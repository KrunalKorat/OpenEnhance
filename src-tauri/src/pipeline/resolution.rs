//! Resolution Planner for OpenEnhance.
//! Computes exact target dimensions (1080p, 1440p, 4K), AI intermediate scaling,
//! aspect-ratio preservation, and verified FFmpeg filter chains for contain/crop modes.

use crate::error::{AppError, AppErrorCode};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ResolutionPlan {
    pub source_width: u32,
    pub source_height: u32,
    pub target_preset: String, // "1080p" | "1440p" | "4k"
    pub target_width: u32,
    pub target_height: u32,
    pub fit_mode: String, // "contain" | "crop"
    pub model_scale: u32,
    pub ai_width: u32,
    pub ai_height: u32,
    pub needs_upscale: bool,
    pub ffmpeg_filter: String,
}

pub struct ResolutionPlanner;

impl ResolutionPlanner {
    /// Returns canonical pixel dimensions for the given target preset.
    pub fn get_preset_dimensions(preset: &str) -> Result<(u32, u32), AppError> {
        match preset.to_lowercase().as_str() {
            "1080p" => Ok((1920, 1080)),
            "1440p" => Ok((2560, 1440)),
            "4k" => Ok((3840, 2160)),
            _ => Err(AppError::new(
                AppErrorCode::InvalidArgument,
                format!("Unsupported target preset: '{preset}'. Valid presets: 1080p, 1440p, 4k."),
            )),
        }
    }

    /// Plans resolution transformation given source video specs and target options.
    pub fn plan(
        source_width: u32,
        source_height: u32,
        target_preset: &str,
        fit_mode: &str,
        model_scale: u32,
    ) -> Result<ResolutionPlan, AppError> {
        if source_width == 0 || source_height == 0 {
            return Err(AppError::new(
                AppErrorCode::InvalidArgument,
                "Source width and height must be non-zero.",
            ));
        }

        let (target_width, target_height) = Self::get_preset_dimensions(target_preset)?;
        let norm_fit_mode = match fit_mode.to_lowercase().as_str() {
            "crop" => "crop",
            _ => "contain",
        };

        let effective_scale = if model_scale == 0 { 4 } else { model_scale };
        let ai_width = source_width * effective_scale;
        let ai_height = source_height * effective_scale;

        // Determine whether AI upscaling is required or source is already larger than target
        let needs_upscale = source_width < target_width || source_height < target_height;

        let ffmpeg_filter = match norm_fit_mode {
            "crop" => {
                format!(
                    "scale={target_width}:{target_height}:force_original_aspect_ratio=increase,crop={target_width}:{target_height}:(iw-ow)/2:(ih-oh)/2"
                )
            }
            _ => {
                // contain / letterbox mode
                format!(
                    "scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2:black"
                )
            }
        };

        Ok(ResolutionPlan {
            source_width,
            source_height,
            target_preset: target_preset.to_string(),
            target_width,
            target_height,
            fit_mode: norm_fit_mode.to_string(),
            model_scale: effective_scale,
            ai_width,
            ai_height,
            needs_upscale,
            ffmpeg_filter,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolution_planner_1080p_contain() {
        let plan = ResolutionPlanner::plan(1280, 720, "1080p", "contain", 2).unwrap();
        assert_eq!(plan.target_width, 1920);
        assert_eq!(plan.target_height, 1080);
        assert_eq!(plan.ai_width, 2560);
        assert_eq!(plan.ai_height, 1440);
        assert!(plan.needs_upscale);
        assert!(plan.ffmpeg_filter.contains("force_original_aspect_ratio=decrease"));
        assert!(plan.ffmpeg_filter.contains("pad="));
    }

    #[test]
    fn test_resolution_planner_4k_crop() {
        let plan = ResolutionPlanner::plan(1920, 1080, "4k", "crop", 4).unwrap();
        assert_eq!(plan.target_width, 3840);
        assert_eq!(plan.target_height, 2160);
        assert_eq!(plan.ai_width, 7680);
        assert_eq!(plan.ai_height, 4320);
        assert!(plan.needs_upscale);
        assert!(plan.ffmpeg_filter.contains("force_original_aspect_ratio=increase"));
        assert!(plan.ffmpeg_filter.contains("crop="));
    }

    #[test]
    fn test_resolution_planner_1440p() {
        let plan = ResolutionPlanner::plan(640, 480, "1440p", "contain", 4).unwrap();
        assert_eq!(plan.target_width, 2560);
        assert_eq!(plan.target_height, 1440);
        assert_eq!(plan.ai_width, 2560);
        assert_eq!(plan.ai_height, 1920);
        assert!(plan.needs_upscale);
    }

    #[test]
    fn test_resolution_planner_downscale_when_larger() {
        let plan = ResolutionPlanner::plan(3840, 2160, "1080p", "contain", 2).unwrap();
        assert_eq!(plan.target_width, 1920);
        assert_eq!(plan.target_height, 1080);
        assert!(!plan.needs_upscale);
    }

    #[test]
    fn test_invalid_preset() {
        let err = ResolutionPlanner::plan(1280, 720, "8k", "contain", 2);
        assert!(err.is_err());
        assert_eq!(err.unwrap_err().code, AppErrorCode::InvalidArgument);
    }
}
