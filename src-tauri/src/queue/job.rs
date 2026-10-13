//! Job domain models, lifecycle state machine, and checkpoint definitions.

use crate::error::{AppError, AppErrorCode};
use serde::{Deserialize, Serialize};

/// Defined lifecycle states for an enhancement job.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum JobState {
    Queued,
    Preparing,
    Running,
    Pausing,
    Paused,
    Cancelling,
    Cancelled,
    Finalizing,
    Completed,
    Failed,
    Interrupted,
    Recoverable,
}

impl JobState {
    /// Evaluates if transitioning from `self` to `next` is a legally allowed transition.
    pub fn can_transition_to(&self, next: &JobState) -> bool {
        if self == next {
            return true;
        }

        match self {
            JobState::Queued => matches!(next, JobState::Preparing | JobState::Cancelled),
            JobState::Preparing => matches!(
                next,
                JobState::Running | JobState::Failed | JobState::Cancelling | JobState::Cancelled
            ),
            JobState::Running => matches!(
                next,
                JobState::Pausing
                    | JobState::Paused
                    | JobState::Cancelling
                    | JobState::Cancelled
                    | JobState::Finalizing
                    | JobState::Completed
                    | JobState::Failed
                    | JobState::Interrupted
            ),
            JobState::Pausing => matches!(
                next,
                JobState::Paused | JobState::Cancelled | JobState::Failed
            ),
            JobState::Paused => matches!(
                next,
                JobState::Queued | JobState::Preparing | JobState::Running | JobState::Cancelled
            ),
            JobState::Cancelling => matches!(next, JobState::Cancelled | JobState::Failed),
            JobState::Finalizing => matches!(
                next,
                JobState::Completed | JobState::Failed | JobState::Cancelled
            ),
            JobState::Failed => matches!(next, JobState::Queued), // via retry
            JobState::Cancelled => matches!(next, JobState::Queued), // via retry
            JobState::Interrupted => matches!(
                next,
                JobState::Recoverable | JobState::Queued | JobState::Failed | JobState::Cancelled
            ),
            JobState::Recoverable => matches!(
                next,
                JobState::Running | JobState::Preparing | JobState::Queued | JobState::Cancelled
            ),
            JobState::Completed => false, // Terminal: Completed jobs cannot transition
        }
    }

    /// Verifies state transition and returns an error if illegal.
    pub fn validate_transition(&self, next: &JobState) -> Result<(), AppError> {
        if self.can_transition_to(next) {
            Ok(())
        } else {
            Err(AppError::new(
                AppErrorCode::JobStateInvalid,
                format!("Invalid job state transition from {self:?} to {next:?}"),
            ))
        }
    }

    pub fn is_terminal(&self) -> bool {
        matches!(self, JobState::Completed | JobState::Cancelled)
    }

    pub fn is_active(&self) -> bool {
        matches!(
            self,
            JobState::Preparing | JobState::Running | JobState::Pausing | JobState::Finalizing
        )
    }
}

/// Processing stages within a running job.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum JobStage {
    Validating,
    Probing,
    Extracting,
    Upscaling,
    Encoding,
    Verifying,
    Cleanup,
}

/// Recovery checkpoint metadata stored when a job is paused or interrupted.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobCheckpoint {
    pub workspace_dir: String,
    pub extracted_frames: u64,
    pub upscaled_frames: u64,
    pub total_frames: u64,
    pub can_resume: bool,
    pub updated_at: String,
}

/// Full persistent record of an enhancement job stored in durable storage.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobRecord {
    pub job_id: String,
    pub state: JobState,
    pub stage: Option<JobStage>,
    pub input_path: String,
    pub output_path: String,
    pub output_preset: String,
    pub model_id: String,
    pub quality_preset: String,
    pub fit_mode: String,
    pub container: String,
    pub audio_policy: String,
    pub subtitle_policy: String,
    pub progress_percent: Option<f32>,
    pub processed_frames: Option<u64>,
    pub total_frames: Option<u64>,
    pub fps: Option<f32>,
    pub source_width: Option<u32>,
    pub source_height: Option<u32>,
    pub target_width: u32,
    pub target_height: u32,
    pub duration_ms: Option<u64>,
    pub file_size_bytes: Option<u64>,
    pub attempt: u32,
    pub error: Option<String>,
    pub error_code: Option<String>,
    pub checkpoint: Option<JobCheckpoint>,
    pub created_at: String,
    pub started_at: Option<String>,
    pub updated_at: String,
    pub completed_at: Option<String>,
}

/// Client-facing summary of an enhancement job matching API.md.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobSummary {
    pub job_id: String,
    pub state: JobState,
    pub stage: Option<JobStage>,
    pub progress_percent: Option<f32>,
    pub progress_mode: String,
    pub current_file: Option<String>,
    pub input_path: String,
    pub output_path: String,
    pub source_width: Option<u32>,
    pub source_height: Option<u32>,
    pub target_width: u32,
    pub target_height: u32,
    pub started_at: Option<String>,
    pub updated_at: String,
    pub elapsed_ms: Option<u64>,
    pub estimated_remaining_ms: Option<u64>,
    pub attempt: u32,
    pub processed_frames: Option<u64>,
    pub total_frames: Option<u64>,
    pub fps: Option<f32>,
    pub error_message: Option<String>,
    pub error_code: Option<String>,
    pub is_recoverable: bool,
}

impl From<&JobRecord> for JobSummary {
    fn from(r: &JobRecord) -> Self {
        let is_recoverable = r.state == JobState::Recoverable
            || (r.state == JobState::Interrupted
                && r.checkpoint.as_ref().map(|c| c.can_resume).unwrap_or(false));

        let current_file = std::path::Path::new(&r.input_path)
            .file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.to_string());

        let progress_mode = if r.progress_percent.is_some() {
            "determinate".to_string()
        } else {
            "indeterminate".to_string()
        };

        Self {
            job_id: r.job_id.clone(),
            state: r.state,
            stage: r.stage,
            progress_percent: r.progress_percent,
            progress_mode,
            current_file,
            input_path: r.input_path.clone(),
            output_path: r.output_path.clone(),
            source_width: r.source_width,
            source_height: r.source_height,
            target_width: r.target_width,
            target_height: r.target_height,
            started_at: r.started_at.clone(),
            updated_at: r.updated_at.clone(),
            elapsed_ms: None,
            estimated_remaining_ms: None,
            attempt: r.attempt,
            processed_frames: r.processed_frames,
            total_frames: r.total_frames,
            fps: r.fps,
            error_message: r.error.clone(),
            error_code: r.error_code.clone(),
            is_recoverable,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_state_transitions() {
        assert!(JobState::Queued.can_transition_to(&JobState::Preparing));
        assert!(JobState::Preparing.can_transition_to(&JobState::Running));
        assert!(JobState::Running.can_transition_to(&JobState::Pausing));
        assert!(JobState::Pausing.can_transition_to(&JobState::Paused));
        assert!(JobState::Paused.can_transition_to(&JobState::Running));
        assert!(JobState::Running.can_transition_to(&JobState::Finalizing));
        assert!(JobState::Finalizing.can_transition_to(&JobState::Completed));
        assert!(JobState::Running.can_transition_to(&JobState::Interrupted));
        assert!(JobState::Interrupted.can_transition_to(&JobState::Recoverable));
        assert!(JobState::Recoverable.can_transition_to(&JobState::Running));
        assert!(JobState::Failed.can_transition_to(&JobState::Queued));
    }

    #[test]
    fn test_invalid_state_transitions() {
        assert!(!JobState::Completed.can_transition_to(&JobState::Running));
        assert!(!JobState::Completed.can_transition_to(&JobState::Queued));
        assert!(!JobState::Queued.can_transition_to(&JobState::Completed));
        assert!(!JobState::Paused.can_transition_to(&JobState::Completed));
        assert!(!JobState::Failed.can_transition_to(&JobState::Completed));
    }
}
