//! Video enhancement and job execution commands for OpenEnhance.

use crate::error::{AppError, AppErrorCode};
use crate::pipeline::export::{EnhancementJobConfig, EnhancementResult, VideoEnhancementPipeline};
use crate::security::validate_input_file;
use std::process::Command;

#[tauri::command]
pub async fn run_enhancement(
    config: EnhancementJobConfig,
) -> Result<EnhancementResult, AppError> {
    let job_id = format!("job_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis());

    // Execute enhancement pipeline in blocking thread pool
    tokio::task::spawn_blocking(move || {
        VideoEnhancementPipeline::execute(&job_id, &config, |_stage, _pct, _msg| {
            // Future phase: emit Tauri event to window
        })
    })
    .await
    .map_err(|e| {
        AppError::new(
            AppErrorCode::InternalError,
            format!("Enhancement task thread panicked or cancelled: {e}"),
        )
    })?
}

#[tauri::command]
pub fn open_output(path: String) -> Result<(), AppError> {
    let canonical = validate_input_file(&path)?;

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&canonical)
            .spawn()
            .map_err(|e| {
                AppError::new(
                    AppErrorCode::ProcessStartFailed,
                    format!("Failed to open file in system player: {e}"),
                )
            })?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&canonical)
            .spawn()
            .map_err(|e| {
                AppError::new(
                    AppErrorCode::ProcessStartFailed,
                    format!("Failed to open file: {e}"),
                )
            })?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&canonical)
            .spawn()
            .map_err(|e| {
                AppError::new(
                    AppErrorCode::ProcessStartFailed,
                    format!("Failed to open file: {e}"),
                )
            })?;
    }

    Ok(())
}

#[tauri::command]
pub fn reveal_in_folder(path: String) -> Result<(), AppError> {
    let canonical = validate_input_file(&path)?;

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(format!("/select,{}", canonical.display()))
            .spawn()
            .map_err(|e| {
                AppError::new(
                    AppErrorCode::ProcessStartFailed,
                    format!("Failed to reveal file in folder: {e}"),
                )
            })?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-R", &canonical.to_string_lossy()])
            .spawn()
            .map_err(|e| {
                AppError::new(
                    AppErrorCode::ProcessStartFailed,
                    format!("Failed to reveal file in folder: {e}"),
                )
            })?;
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(parent) = canonical.parent() {
            Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| {
                    AppError::new(
                        AppErrorCode::ProcessStartFailed,
                        format!("Failed to open folder: {e}"),
                    )
                })?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reveal_in_folder_missing_file() {
        let err = reveal_in_folder("C:\\does_not_exist_file.mp4".to_string());
        assert!(err.is_err());
        assert_eq!(err.unwrap_err().code, AppErrorCode::InputUnreadable);
    }
}
