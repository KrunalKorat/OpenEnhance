//! Durable file-backed persistent job store with schema versioning and atomic write guarantees.

use crate::error::{AppError, AppErrorCode};
use crate::queue::job::JobRecord;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::RwLock;

pub const CURRENT_SCHEMA_VERSION: u32 = 1;

/// In-file persistent schema structure.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorePayload {
    pub schema_version: u32,
    pub updated_at: String,
    pub jobs: Vec<JobRecord>,
}

/// Thread-safe durable storage manager for OpenEnhance jobs.
pub struct DurableJobStore {
    file_path: PathBuf,
    cache: RwLock<Vec<JobRecord>>,
}

impl DurableJobStore {
    /// Initializes or loads the persistent job database.
    pub fn new() -> Result<Self, AppError> {
        let store_dir = if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            PathBuf::from(local_app_data).join("OpenEnhance")
        } else {
            std::env::temp_dir().join("OpenEnhance")
        };

        fs::create_dir_all(&store_dir).map_err(|e| {
            AppError::new(
                AppErrorCode::IoError,
                format!("Failed to create storage directory {}: {e}", store_dir.display()),
            )
        })?;

        let file_path = store_dir.join("jobs.json");
        let store = Self {
            file_path,
            cache: RwLock::new(Vec::new()),
        };

        store.load_from_disk()?;
        Ok(store)
    }

    /// Initializes with a custom file path (primarily for unit tests).
    pub fn with_path<P: AsRef<Path>>(path: P) -> Result<Self, AppError> {
        let file_path = path.as_ref().to_path_buf();
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).map_err(|e| {
                AppError::new(
                    AppErrorCode::IoError,
                    format!("Failed to create parent dir: {e}"),
                )
            })?;
        }

        let store = Self {
            file_path,
            cache: RwLock::new(Vec::new()),
        };

        store.load_from_disk()?;
        Ok(store)
    }

    /// Loads and verifies jobs from disk with schema migration support.
    fn load_from_disk(&self) -> Result<(), AppError> {
        if !self.file_path.exists() {
            // Write empty initial store
            self.persist_to_disk(&[])?;
            return Ok(());
        }

        let content = fs::read_to_string(&self.file_path).map_err(|e| {
            AppError::new(
                AppErrorCode::IoError,
                format!("Failed to read job store {}: {e}", self.file_path.display()),
            )
        })?;

        let payload: StorePayload = match serde_json::from_str(&content) {
            Ok(p) => p,
            Err(e) => {
                log::warn!("Corrupt job store detected: {e}. Creating fallback backup.");
                let backup = self.file_path.with_extension(format!("corrupt_{}.json", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs()));
                let _ = fs::copy(&self.file_path, &backup);
                StorePayload {
                    schema_version: CURRENT_SCHEMA_VERSION,
                    updated_at: Self::now_iso(),
                    jobs: Vec::new(),
                }
            }
        };

        // Schema migration handler
        let migrated_jobs = if payload.schema_version < CURRENT_SCHEMA_VERSION {
            log::info!("Migrating store from schema v{} to v{}", payload.schema_version, CURRENT_SCHEMA_VERSION);
            payload.jobs // Extend migration logic when schema evolves in future versions
        } else {
            payload.jobs
        };

        let mut lock = self.cache.write().map_err(|_| {
            AppError::new(AppErrorCode::InternalError, "Store cache lock poisoned")
        })?;
        *lock = migrated_jobs;

        Ok(())
    }

    /// Persists given job records to disk atomically using temporary file rename.
    fn persist_to_disk(&self, jobs: &[JobRecord]) -> Result<(), AppError> {
        let payload = StorePayload {
            schema_version: CURRENT_SCHEMA_VERSION,
            updated_at: Self::now_iso(),
            jobs: jobs.to_vec(),
        };

        let serialized = serde_json::to_string_pretty(&payload).map_err(|e| {
            AppError::new(
                AppErrorCode::InternalError,
                format!("Failed to serialize job store: {e}"),
            )
        })?;

        let temp_path = self.file_path.with_extension("tmp");
        fs::write(&temp_path, serialized.as_bytes()).map_err(|e| {
            AppError::new(
                AppErrorCode::IoError,
                format!("Failed to write temporary store {}: {e}", temp_path.display()),
            )
        })?;

        // Atomic file replacement
        fs::rename(&temp_path, &self.file_path).map_err(|e| {
            AppError::new(
                AppErrorCode::IoError,
                format!("Failed to atomically commit store {}: {e}", self.file_path.display()),
            )
        })?;

        Ok(())
    }

    /// Inserts a new job record.
    pub fn insert_job(&self, job: JobRecord) -> Result<(), AppError> {
        let mut lock = self.cache.write().map_err(|_| {
            AppError::new(AppErrorCode::InternalError, "Store lock poisoned")
        })?;

        if lock.iter().any(|j| j.job_id == job.job_id) {
            return Err(AppError::new(
                AppErrorCode::InvalidArgument,
                format!("Job with ID {} already exists", job.job_id),
            ));
        }

        lock.insert(0, job);
        self.persist_to_disk(&lock)?;
        Ok(())
    }

    /// Retrieves a single job by ID.
    pub fn get_job(&self, job_id: &str) -> Result<Option<JobRecord>, AppError> {
        let lock = self.cache.read().map_err(|_| {
            AppError::new(AppErrorCode::InternalError, "Store lock poisoned")
        })?;
        Ok(lock.iter().find(|j| j.job_id == job_id).cloned())
    }

    /// Updates an existing job record and persists changes to disk.
    pub fn update_job<F>(&self, job_id: &str, update_fn: F) -> Result<JobRecord, AppError>
    where
        F: FnOnce(&mut JobRecord) -> Result<(), AppError>,
    {
        let mut lock = self.cache.write().map_err(|_| {
            AppError::new(AppErrorCode::InternalError, "Store lock poisoned")
        })?;

        let job = lock
            .iter_mut()
            .find(|j| j.job_id == job_id)
            .ok_or_else(|| {
                AppError::new(
                    AppErrorCode::JobNotFound,
                    format!("Job not found: {job_id}"),
                )
            })?;

        update_fn(job)?;
        job.updated_at = Self::now_iso();
        let cloned = job.clone();

        self.persist_to_disk(&lock)?;
        Ok(cloned)
    }

    /// Lists all stored jobs.
    pub fn list_jobs(&self) -> Result<Vec<JobRecord>, AppError> {
        let lock = self.cache.read().map_err(|_| {
            AppError::new(AppErrorCode::InternalError, "Store lock poisoned")
        })?;
        Ok(lock.clone())
    }

    /// Removes a job record by ID.
    pub fn delete_job(&self, job_id: &str) -> Result<bool, AppError> {
        let mut lock = self.cache.write().map_err(|_| {
            AppError::new(AppErrorCode::InternalError, "Store lock poisoned")
        })?;

        let initial_len = lock.len();
        lock.retain(|j| j.job_id != job_id);
        let removed = lock.len() < initial_len;

        if removed {
            self.persist_to_disk(&lock)?;
        }
        Ok(removed)
    }

    /// Clears completed or cancelled jobs while preserving outputs and active/failed jobs.
    pub fn clear_completed(&self) -> Result<usize, AppError> {
        let mut lock = self.cache.write().map_err(|_| {
            AppError::new(AppErrorCode::InternalError, "Store lock poisoned")
        })?;

        let initial_len = lock.len();
        lock.retain(|j| {
            j.state != crate::queue::job::JobState::Completed
                && j.state != crate::queue::job::JobState::Cancelled
        });
        let removed_count = initial_len - lock.len();

        if removed_count > 0 {
            self.persist_to_disk(&lock)?;
        }
        Ok(removed_count)
    }

    fn now_iso() -> String {
        let now = std::time::SystemTime::now();
        let duration = now.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
        format!("{}s", duration.as_secs())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::queue::job::JobState;

    fn sample_job(id: &str) -> JobRecord {
        JobRecord {
            job_id: id.to_string(),
            state: JobState::Queued,
            stage: None,
            input_path: "C:\\Videos\\sample.mp4".to_string(),
            output_path: "C:\\Videos\\sample_4k.mp4".to_string(),
            output_preset: "4k".to_string(),
            model_id: "realesrgan-x4plus".to_string(),
            quality_preset: "high".to_string(),
            fit_mode: "contain".to_string(),
            container: "mp4".to_string(),
            audio_policy: "preserve".to_string(),
            subtitle_policy: "preserve-supported".to_string(),
            progress_percent: None,
            processed_frames: None,
            total_frames: None,
            fps: None,
            source_width: Some(1920),
            source_height: Some(1080),
            target_width: 3840,
            target_height: 2160,
            duration_ms: Some(30000),
            file_size_bytes: None,
            attempt: 1,
            error: None,
            error_code: None,
            checkpoint: None,
            created_at: "now".to_string(),
            started_at: None,
            updated_at: "now".to_string(),
            completed_at: None,
        }
    }

    #[test]
    fn test_store_insert_get_update_persistence() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test_jobs.json");

        let store = DurableJobStore::with_path(&db_path).unwrap();
        let job = sample_job("job_1");
        store.insert_job(job).unwrap();

        let retrieved = store.get_job("job_1").unwrap().unwrap();
        assert_eq!(retrieved.job_id, "job_1");
        assert_eq!(retrieved.state, JobState::Queued);

        store
            .update_job("job_1", |j| {
                j.state = JobState::Running;
                Ok(())
            })
            .unwrap();

        // Reload fresh store from disk to verify atomic disk persistence
        let reloaded_store = DurableJobStore::with_path(&db_path).unwrap();
        let reloaded_job = reloaded_store.get_job("job_1").unwrap().unwrap();
        assert_eq!(reloaded_job.state, JobState::Running);
    }
}
