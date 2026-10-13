//! Queue Manager coordinating bounded concurrency, job lifecycle transitions,
//! pause/resume checkpoints, cancellation tokens, and startup crash recovery.

use crate::error::{AppError, AppErrorCode};
use crate::pipeline::export::{EnhancementJobConfig, VideoEnhancementPipeline};
use crate::queue::job::{JobRecord, JobStage, JobState, JobSummary};
use crate::queue::store::DurableJobStore;
use crate::security::validate_input_file;
use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

/// Action requested when recovering an interrupted or recoverable job.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RecoverAction {
    Resume,
    Restart,
    Discard,
}

/// Request payload when submitting a new job to the queue.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateJobRequest {
    pub input_path: String,
    pub output_path: String,
    pub output_preset: String,
    pub model_id: String,
    pub quality_preset: String,
    pub fit_mode: String,
    pub container: String,
    pub audio_policy: String,
    pub subtitle_policy: String,
    pub target_width: u32,
    pub target_height: u32,
    pub source_width: Option<u32>,
    pub source_height: Option<u32>,
}

pub struct QueueManager {
    store: Arc<DurableJobStore>,
    is_queue_running: Arc<AtomicBool>,
    concurrency_limit: Arc<Mutex<usize>>,
    active_tokens: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    active_pauses: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
}

impl QueueManager {
    pub fn new(store: Arc<DurableJobStore>) -> Self {
        let manager = Self {
            store,
            is_queue_running: Arc::new(AtomicBool::new(true)),
            concurrency_limit: Arc::new(Mutex::new(1)), // Safe default concurrency: 1 job at a time
            active_tokens: Arc::new(Mutex::new(HashMap::new())),
            active_pauses: Arc::new(Mutex::new(HashMap::new())),
        };

        // Run startup recovery automatically
        manager.startup_recovery();
        manager
    }

    /// Startup Crash Recovery: Inspects database on launch for jobs left in
    /// non-terminal active states (Running, Preparing, Pausing, Finalizing).
    pub fn startup_recovery(&self) {
        if let Ok(jobs) = self.store.list_jobs() {
            for job in jobs {
                if job.state.is_active() {
                    let input_exists = Path::new(&job.input_path).exists();
                    let checkpoint_valid = job.checkpoint.as_ref().map_or(false, |c| {
                        c.can_resume && Path::new(&c.workspace_dir).exists()
                    });

                    let target_state = if input_exists && checkpoint_valid {
                        JobState::Recoverable
                    } else {
                        JobState::Interrupted
                    };

                    let _ = self.store.update_job(&job.job_id, |j| {
                        j.state = target_state;
                        j.stage = None;
                        if target_state == JobState::Interrupted {
                            j.error = Some(
                                "Application exited or crashed while processing this job."
                                    .to_string(),
                            );
                            j.error_code = Some("CRASH_OR_UNEXPECTED_EXIT".to_string());
                        }
                        Ok(())
                    });
                }
            }
        }
    }

    /// Adds a new enhancement job to the queue.
    pub fn create_job(&self, req: CreateJobRequest) -> Result<JobSummary, AppError> {
        let canonical_input = validate_input_file(&req.input_path)?;
        let job_id = format!(
            "job_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis()
        );

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let record = JobRecord {
            job_id: job_id.clone(),
            state: JobState::Queued,
            stage: None,
            input_path: canonical_input.to_string_lossy().to_string(),
            output_path: req.output_path,
            output_preset: req.output_preset,
            model_id: req.model_id,
            quality_preset: req.quality_preset,
            fit_mode: req.fit_mode,
            container: req.container,
            audio_policy: req.audio_policy,
            subtitle_policy: req.subtitle_policy,
            progress_percent: Some(0.0),
            processed_frames: Some(0),
            total_frames: None,
            fps: None,
            source_width: req.source_width,
            source_height: req.source_height,
            target_width: req.target_width,
            target_height: req.target_height,
            duration_ms: None,
            file_size_bytes: None,
            attempt: 1,
            error: None,
            error_code: None,
            checkpoint: None,
            created_at: format!("{now}"),
            started_at: None,
            updated_at: format!("{now}"),
            completed_at: None,
        };

        self.store.insert_job(record.clone())?;
        Ok(JobSummary::from(&record))
    }

    /// Lists all jobs with optional state filtering.
    pub fn list_jobs(&self) -> Result<Vec<JobSummary>, AppError> {
        let records = self.store.list_jobs()?;
        Ok(records.iter().map(JobSummary::from).collect())
    }

    /// Retrieves an individual job summary.
    pub fn get_job(&self, job_id: &str) -> Result<Option<JobSummary>, AppError> {
        let opt = self.store.get_job(job_id)?;
        Ok(opt.as_ref().map(JobSummary::from))
    }

    /// Cancels a running or queued job.
    pub fn cancel_job(&self, job_id: &str) -> Result<JobSummary, AppError> {
        // Signal cancellation token to active child process
        if let Ok(tokens) = self.active_tokens.lock() {
            if let Some(token) = tokens.get(job_id) {
                token.store(true, Ordering::SeqCst);
            }
        }

        let updated = self.store.update_job(job_id, |j| {
            j.state.validate_transition(&JobState::Cancelled)?;
            j.state = JobState::Cancelled;
            j.stage = None;
            j.error = Some("Job was cancelled by user.".to_string());
            j.error_code = Some("PROCESS_CANCELLED".to_string());
            Ok(())
        })?;

        Ok(JobSummary::from(&updated))
    }

    /// Pauses an active job cooperatively.
    pub fn pause_job(&self, job_id: &str) -> Result<JobSummary, AppError> {
        if let Ok(pauses) = self.active_pauses.lock() {
            if let Some(token) = pauses.get(job_id) {
                token.store(true, Ordering::SeqCst);
            }
        }

        let updated = self.store.update_job(job_id, |j| {
            if j.state == JobState::Running {
                j.state = JobState::Paused;
                j.stage = None;
            }
            Ok(())
        })?;

        Ok(JobSummary::from(&updated))
    }

    /// Resumes a paused or recoverable job.
    pub fn resume_job(&self, job_id: &str) -> Result<JobSummary, AppError> {
        let updated = self.store.update_job(job_id, |j| {
            j.state.validate_transition(&JobState::Queued)?;
            j.state = JobState::Queued;
            j.error = None;
            j.error_code = None;
            Ok(())
        })?;

        Ok(JobSummary::from(&updated))
    }

    /// Retries a failed or cancelled job.
    pub fn retry_job(&self, job_id: &str) -> Result<JobSummary, AppError> {
        let updated = self.store.update_job(job_id, |j| {
            j.state.validate_transition(&JobState::Queued)?;
            j.state = JobState::Queued;
            j.attempt += 1;
            j.error = None;
            j.error_code = None;
            j.progress_percent = Some(0.0);
            Ok(())
        })?;

        Ok(JobSummary::from(&updated))
    }

    /// Removes a job record from the queue.
    pub fn remove_job(&self, job_id: &str) -> Result<bool, AppError> {
        let job = self.store.get_job(job_id)?;
        if let Some(j) = job {
            if j.state.is_active() {
                return Err(AppError::new(
                    AppErrorCode::JobStateInvalid,
                    "Cannot remove an actively running job. Cancel it first.",
                ));
            }
        }
        self.store.delete_job(job_id)
    }

    /// Clears completed or cancelled jobs.
    pub fn clear_completed(&self) -> Result<usize, AppError> {
        self.store.clear_completed()
    }

    /// Pauses entire queue processing.
    pub fn pause_queue(&self) {
        self.is_queue_running.store(false, Ordering::SeqCst);
    }

    /// Starts or resumes queue processing.
    pub fn start_queue(&self) {
        self.is_queue_running.store(true, Ordering::SeqCst);
    }

    /// Handles batch recovery action (Resume, Restart, Discard).
    pub fn recover_jobs(
        &self,
        action: RecoverAction,
        target_job_id: Option<String>,
    ) -> Result<Vec<JobSummary>, AppError> {
        let jobs = self.store.list_jobs()?;
        let mut affected = Vec::new();

        for job in jobs {
            let matches_target = target_job_id
                .as_ref()
                .map_or(true, |id| id == &job.job_id);

            if matches_target
                && (job.state == JobState::Interrupted || job.state == JobState::Recoverable)
            {
                let updated = match action {
                    RecoverAction::Resume => self.store.update_job(&job.job_id, |j| {
                        j.state = JobState::Queued;
                        j.error = None;
                        j.error_code = None;
                        Ok(())
                    })?,
                    RecoverAction::Restart => self.store.update_job(&job.job_id, |j| {
                        j.state = JobState::Queued;
                        j.checkpoint = None; // Reset checkpoint to start from frame 0
                        j.error = None;
                        j.error_code = None;
                        j.attempt += 1;
                        Ok(())
                    })?,
                    RecoverAction::Discard => {
                        self.store.delete_job(&job.job_id)?;
                        continue;
                    }
                };
                affected.push(JobSummary::from(&updated));
            }
        }

        Ok(affected)
    }

    /// Executes next available Queued job synchronously (called within worker loop).
    pub fn run_next_queued_job(&self) -> Result<bool, AppError> {
        if !self.is_queue_running.load(Ordering::SeqCst) {
            return Ok(false);
        }

        // Find first Queued job
        let jobs = self.store.list_jobs()?;
        let next_job = jobs.into_iter().find(|j| j.state == JobState::Queued);

        let job = match next_job {
            Some(j) => j,
            None => return Ok(false), // No pending jobs
        };

        let job_id = job.job_id.clone();
        let cancel_token = Arc::new(AtomicBool::new(false));
        let pause_token = Arc::new(AtomicBool::new(false));

        if let Ok(mut tokens) = self.active_tokens.lock() {
            tokens.insert(job_id.clone(), cancel_token.clone());
        }
        if let Ok(mut pauses) = self.active_pauses.lock() {
            pauses.insert(job_id.clone(), pause_token.clone());
        }

        // Transition: Queued -> Preparing -> Running
        self.store.update_job(&job_id, |j| {
            j.state.validate_transition(&JobState::Preparing)?;
            j.state = JobState::Preparing;
            j.stage = Some(JobStage::Validating);
            j.started_at = Some(format!(
                "{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
            ));
            Ok(())
        })?;

        self.store.update_job(&job_id, |j| {
            j.state.validate_transition(&JobState::Running)?;
            j.state = JobState::Running;
            j.stage = Some(JobStage::Extracting);
            Ok(())
        })?;

        let config = EnhancementJobConfig {
            input_path: job.input_path.clone(),
            output_path: job.output_path.clone(),
            output_preset: job.output_preset.clone(),
            model_id: job.model_id.clone(),
            quality_preset: job.quality_preset.clone(),
            fit_mode: job.fit_mode.clone(),
            container: job.container.clone(),
            audio_policy: job.audio_policy.clone(),
            subtitle_policy: job.subtitle_policy.clone(),
        };

        let store_clone = self.store.clone();
        let jid = job_id.clone();

        let exec_result = VideoEnhancementPipeline::execute(&job_id, &config, move |stage_str, pct, _msg| {
            let stage_enum = match stage_str {
                "probing" => Some(JobStage::Probing),
                "extracting" => Some(JobStage::Extracting),
                "upscaling" => Some(JobStage::Upscaling),
                "assembling" => Some(JobStage::Encoding),
                "validating" => Some(JobStage::Verifying),
                _ => None,
            };

            let _ = store_clone.update_job(&jid, |j| {
                j.stage = stage_enum;
                j.progress_percent = Some(pct as f32);
                Ok(())
            });
        });

        // Cleanup in-memory tokens
        if let Ok(mut tokens) = self.active_tokens.lock() {
            tokens.remove(&job_id);
        }
        if let Ok(mut pauses) = self.active_pauses.lock() {
            pauses.remove(&job_id);
        }

        // Process final result
        match exec_result {
            Ok(enhancement) => {
                let now_ts = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();

                self.store.update_job(&job_id, |j| {
                    j.state = JobState::Completed;
                    j.stage = Some(JobStage::Cleanup);
                    j.progress_percent = Some(100.0);
                    j.file_size_bytes = Some(enhancement.file_size_bytes);
                    j.duration_ms = enhancement.duration_ms;
                    j.completed_at = Some(format!("{now_ts}"));
                    Ok(())
                })?;
            }
            Err(e) => {
                let is_cancelled = cancel_token.load(Ordering::SeqCst);
                let is_paused = pause_token.load(Ordering::SeqCst);

                self.store.update_job(&job_id, |j| {
                    if is_cancelled {
                        j.state = JobState::Cancelled;
                        j.error = Some("Job was cancelled by user.".to_string());
                        j.error_code = Some("PROCESS_CANCELLED".to_string());
                    } else if is_paused {
                        j.state = JobState::Paused;
                    } else {
                        j.state = JobState::Failed;
                        j.error = Some(e.message);
                        j.error_code = Some(format!("{:?}", e.code));
                    }
                    j.stage = None;
                    Ok(())
                })?;
            }
        }

        Ok(true)
    }

    pub fn get_concurrency_limit(&self) -> usize {
        self.concurrency_limit
            .lock()
            .map(|l| *l)
            .unwrap_or(1)
    }

    pub fn set_concurrency_limit(&self, limit: usize) {
        if let Ok(mut lock) = self.concurrency_limit.lock() {
            *lock = limit.clamp(1, 4);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_req(path: &str) -> CreateJobRequest {
        CreateJobRequest {
            input_path: path.to_string(),
            output_path: "C:\\Videos\\output.mp4".to_string(),
            output_preset: "1080p".to_string(),
            model_id: "realesrgan-x4plus".to_string(),
            quality_preset: "high".to_string(),
            fit_mode: "contain".to_string(),
            container: "mp4".to_string(),
            audio_policy: "preserve".to_string(),
            subtitle_policy: "preserve-supported".to_string(),
            target_width: 1920,
            target_height: 1080,
            source_width: Some(1280),
            source_height: Some(720),
        }
    }

    #[test]
    fn test_queue_lifecycle_and_recovery() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("jobs.json");
        let store = Arc::new(DurableJobStore::with_path(&db_path).unwrap());

        // Create dummy video file
        let dummy_video = temp_dir.path().join("test_src.mp4");
        std::fs::write(&dummy_video, b"fake video bytes").unwrap();

        let manager = QueueManager::new(store.clone());

        let job = manager
            .create_job(test_req(dummy_video.to_str().unwrap()))
            .unwrap();
        assert_eq!(job.state, JobState::Queued);

        // Cancel job
        let cancelled = manager.cancel_job(&job.job_id).unwrap();
        assert_eq!(cancelled.state, JobState::Cancelled);

        // Retry job
        let retried = manager.retry_job(&job.job_id).unwrap();
        assert_eq!(retried.state, JobState::Queued);
        assert_eq!(retried.attempt, 2);

        // Simulate crash: mark job Running directly in store
        store
            .update_job(&job.job_id, |j| {
                j.state = JobState::Running;
                Ok(())
            })
            .unwrap();

        // New manager starts up -> performs startup crash recovery
        let new_manager = QueueManager::new(store.clone());
        let recovered_job = new_manager.get_job(&job.job_id).unwrap().unwrap();
        // Without active checkpoint workspace, it should be marked Interrupted
        assert_eq!(recovered_job.state, JobState::Interrupted);

        // Recover action: Restart
        let restarted = new_manager
            .recover_jobs(RecoverAction::Restart, Some(job.job_id.clone()))
            .unwrap();
        assert_eq!(restarted.len(), 1);
        assert_eq!(restarted[0].state, JobState::Queued);
    }
}
