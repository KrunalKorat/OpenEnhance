//! Tauri IPC commands for persistent job queue management.

use crate::error::AppError;
use crate::queue::manager::{CreateJobRequest, QueueManager, RecoverAction};
use crate::queue::store::DurableJobStore;
use crate::queue::JobSummary;
use std::sync::{Arc, Mutex, OnceLock};

static QUEUE_MANAGER: OnceLock<Arc<Mutex<QueueManager>>> = OnceLock::new();

pub fn get_queue_manager() -> Result<Arc<Mutex<QueueManager>>, AppError> {
    if let Some(m) = QUEUE_MANAGER.get() {
        return Ok(m.clone());
    }

    let store = Arc::new(DurableJobStore::new()?);
    let manager = Arc::new(Mutex::new(QueueManager::new(store)));
    let _ = QUEUE_MANAGER.set(manager.clone());
    Ok(manager)
}

#[tauri::command]
pub async fn create_job(request: CreateJobRequest) -> Result<JobSummary, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.create_job(request)
}

#[tauri::command]
pub async fn list_jobs() -> Result<Vec<JobSummary>, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.list_jobs()
}

#[tauri::command]
pub async fn get_job(job_id: String) -> Result<Option<JobSummary>, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.get_job(&job_id)
}

#[tauri::command]
pub async fn cancel_job(job_id: String) -> Result<JobSummary, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.cancel_job(&job_id)
}

#[tauri::command]
pub async fn pause_job(job_id: String) -> Result<JobSummary, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.pause_job(&job_id)
}

#[tauri::command]
pub async fn resume_job(job_id: String) -> Result<JobSummary, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.resume_job(&job_id)
}

#[tauri::command]
pub async fn retry_job(job_id: String) -> Result<JobSummary, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.retry_job(&job_id)
}

#[tauri::command]
pub async fn remove_job(job_id: String) -> Result<bool, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.remove_job(&job_id)
}

#[tauri::command]
pub async fn clear_completed_jobs() -> Result<usize, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.clear_completed()
}

#[tauri::command]
pub async fn start_queue() -> Result<(), AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.start_queue();
    Ok(())
}

#[tauri::command]
pub async fn pause_queue() -> Result<(), AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.pause_queue();
    Ok(())
}

#[tauri::command]
pub async fn recover_jobs(
    action: RecoverAction,
    job_id: Option<String>,
) -> Result<Vec<JobSummary>, AppError> {
    let manager = get_queue_manager()?;
    let mgr = manager
        .lock()
        .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
    mgr.recover_jobs(action, job_id)
}

#[tauri::command]
pub async fn process_queue_step() -> Result<bool, AppError> {
    let manager = get_queue_manager()?;
    tokio::task::spawn_blocking(move || {
        let mgr = manager
            .lock()
            .map_err(|_| AppError::new(crate::error::AppErrorCode::InternalError, "Lock poisoned"))?;
        mgr.run_next_queued_job()
    })
    .await
    .map_err(|e| {
        AppError::new(
            crate::error::AppErrorCode::InternalError,
            format!("Worker thread panicked: {e}"),
        )
    })?
}
