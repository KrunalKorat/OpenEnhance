//! Engine and model management commands for OpenEnhance.

use crate::engines::realesrgan::{EngineStatus, ModelInfo, RealEsrganAdapter};
use crate::error::{AppError, AppErrorCode};
use crate::pipeline::resolution::{ResolutionPlan, ResolutionPlanner};
use crate::security::validate_input_file;
use std::path::Path;

#[tauri::command]
pub fn get_engine_status() -> EngineStatus {
    RealEsrganAdapter::get_status()
}

#[tauri::command]
pub fn list_models() -> Vec<ModelInfo> {
    let binary = RealEsrganAdapter::find_binary();
    let models_dir = binary.as_ref().and_then(|p| RealEsrganAdapter::find_models_dir(p));
    RealEsrganAdapter::list_models(models_dir.as_deref())
}

#[tauri::command]
pub fn run_frame_upscale(
    input_path: String,
    output_path: String,
    model_id: String,
    scale: u32,
) -> Result<(), AppError> {
    let canonical_in = validate_input_file(&input_path)?;
    let out_p = Path::new(&output_path);

    // Validate parent directory
    if let Some(parent) = out_p.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| {
                AppError::new(
                    AppErrorCode::IoError,
                    format!("Failed to create output directory: {e}"),
                )
            })?;
        }
    }

    RealEsrganAdapter::upscale_frame(&canonical_in, out_p, &model_id, scale, None)
}

#[tauri::command]
pub fn plan_resolution(
    source_width: u32,
    source_height: u32,
    target_preset: String,
    fit_mode: String,
    model_scale: u32,
) -> Result<ResolutionPlan, AppError> {
    ResolutionPlanner::plan(source_width, source_height, &target_preset, &fit_mode, model_scale)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_status_command() {
        let status = get_engine_status();
        assert_eq!(status.engine_id, "realesrgan-ncnn-vulkan");
        assert!(!status.models.is_empty());
    }

    #[test]
    fn test_plan_resolution_command() {
        let plan = plan_resolution(1920, 1080, "4k".to_string(), "contain".to_string(), 4).unwrap();
        assert_eq!(plan.target_width, 3840);
        assert_eq!(plan.target_height, 2160);
    }
}
