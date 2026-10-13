use crate::error::{AppError, AppErrorCode};
use crate::media::{generate_video_thumbnail, inspect_media_file, MediaInfo};

#[tauri::command]
pub async fn inspect_media(path: String) -> Result<MediaInfo, AppError> {
    tokio::task::spawn_blocking(move || inspect_media_file(&path))
        .await
        .map_err(|e| AppError::new(AppErrorCode::InternalError, e.to_string()))?
}

#[tauri::command]
pub async fn generate_thumbnail(path: String) -> Result<String, AppError> {
    tokio::task::spawn_blocking(move || generate_video_thumbnail(&path))
        .await
        .map_err(|e| AppError::new(AppErrorCode::InternalError, e.to_string()))?
}

#[tauri::command]
pub async fn pick_video_files() -> Result<Vec<String>, AppError> {
    let files = tokio::task::spawn_blocking(|| {
        rfd::FileDialog::new()
            .set_title("OpenEnhance — Select Video File")
            .add_filter(
                "Video Files",
                &[
                    "mp4", "mov", "mkv", "avi", "webm", "flv", "m4v", "ts", "wmv",
                ],
            )
            .pick_files()
    })
    .await
    .map_err(|e| AppError::new(AppErrorCode::InternalError, e.to_string()))?;

    match files {
        Some(paths) => Ok(paths
            .into_iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect()),
        None => Ok(Vec::new()),
    }
}
