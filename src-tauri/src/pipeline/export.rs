//! Real video enhancement and export pipeline for OpenEnhance.
//! Executes frame extraction, AI model inference, aspect-ratio preserved reassembly,
//! audio/subtitle handling, and strict output validation with FFprobe.

use crate::error::{AppError, AppErrorCode};
use crate::media::inspect_media_file;
use crate::pipeline::resolution::{ResolutionPlan, ResolutionPlanner};
use crate::engines::realesrgan::RealEsrganAdapter;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnhancementJobConfig {
    pub input_path: String,
    pub output_path: String,
    pub output_preset: String, // "1080p" | "1440p" | "4k"
    pub model_id: String,
    pub quality_preset: String, // "balanced" | "high" | "maximum"
    pub fit_mode: String,       // "contain" | "crop"
    pub container: String,      // "mp4" | "mkv"
    pub audio_policy: String,   // "preserve" | "remove"
    pub subtitle_policy: String,// "preserve-supported" | "remove"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnhancementResult {
    pub success: bool,
    pub output_path: String,
    pub target_width: u32,
    pub target_height: u32,
    pub actual_width: u32,
    pub actual_height: u32,
    pub duration_ms: Option<u64>,
    pub file_size_bytes: u64,
    pub video_codec: Option<String>,
    pub audio_tracks_count: usize,
    pub resolution_plan: ResolutionPlan,
}

pub struct VideoEnhancementPipeline;

impl VideoEnhancementPipeline {
    /// Generates a managed temporary directory for an enhancement job.
    pub fn create_job_workspace(job_id: &str) -> Result<PathBuf, AppError> {
        let base_temp = if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            PathBuf::from(local_app_data).join("OpenEnhance").join("temp")
        } else {
            std::env::temp_dir().join("OpenEnhance_temp")
        };

        let job_workspace = base_temp.join(job_id);
        std::fs::create_dir_all(&job_workspace).map_err(|e| {
            AppError::new(
                AppErrorCode::IoError,
                format!("Failed to create job workspace: {e}"),
            )
        })?;

        Ok(job_workspace)
    }

    /// Safely cleans up the temporary job workspace.
    pub fn cleanup_workspace(workspace: &Path) {
        if workspace.exists() {
            let _ = std::fs::remove_dir_all(workspace);
        }
    }

    /// Executes the full enhancement and export pipeline.
    pub fn execute<F>(
        job_id: &str,
        config: &EnhancementJobConfig,
        progress_cb: F,
    ) -> Result<EnhancementResult, AppError>
    where
        F: Fn(&str, f32, &str), // stage, progress percentage (0..100), message
    {
        // 1. Validate and probe input media
        progress_cb("probing", 5.0, "Inspecting source media streams via FFprobe...");
        let source_media = inspect_media_file(&config.input_path)?;

        // Ensure output parent directory exists
        let output_file_path = PathBuf::from(&config.output_path);
        if let Some(parent) = output_file_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                AppError::new(
                    AppErrorCode::IoError,
                    format!("Failed to create destination folder: {e}"),
                )
            })?;
        }

        // Determine model scale from model_id
        let model_scale = if config.model_id.contains("-x2") {
            2
        } else if config.model_id.contains("-x3") {
            3
        } else {
            4
        };

        // 2. Plan resolution and aspect ratio handling
        progress_cb("planning", 10.0, "Computing resolution plan and scaling filter...");
        let plan = ResolutionPlanner::plan(
            source_media.width,
            source_media.height,
            &config.output_preset,
            &config.fit_mode,
            model_scale,
        )?;

        // 3. Prepare managed temporary workspace
        progress_cb("preparing", 15.0, "Allocating temporary frame workspace...");
        let workspace = Self::create_job_workspace(job_id)?;
        let input_frames = workspace.join("input_frames");
        let output_frames = workspace.join("output_frames");
        std::fs::create_dir_all(&input_frames).map_err(|e| {
            AppError::new(
                AppErrorCode::IoError,
                format!("Failed to create input frames folder: {e}"),
            )
        })?;
        std::fs::create_dir_all(&output_frames).map_err(|e| {
            AppError::new(
                AppErrorCode::IoError,
                format!("Failed to create output frames folder: {e}"),
            )
        })?;

        // Guard to ensure workspace cleanup on exit
        struct WorkspaceGuard<'a>(&'a Path);
        impl<'a> Drop for WorkspaceGuard<'a> {
            fn drop(&mut self) {
                VideoEnhancementPipeline::cleanup_workspace(self.0);
            }
        }
        let _guard = WorkspaceGuard(&workspace);

        // 4. Extract frames using FFmpeg
        progress_cb("extracting", 20.0, "Extracting video frames with FFmpeg...");
        let frame_pattern = input_frames.join("frame_%08d.png");
        let extract_status = Command::new("ffmpeg")
            .args([
                "-v",
                "error",
                "-i",
                &config.input_path,
                "-qscale:v",
                "1",
                "-qmin",
                "1",
                "-pix_fmt",
                "rgb24",
            ])
            .arg(&frame_pattern)
            .status()
            .map_err(|e| {
                AppError::new(
                    AppErrorCode::EngineMissing,
                    format!("FFmpeg execution failed during frame extraction: {e}"),
                )
            })?;

        if !extract_status.success() {
            return Err(AppError::new(
                AppErrorCode::InputUnreadable,
                "FFmpeg failed to extract video frames.",
            ));
        }

        // Count extracted frames
        let frame_count = std::fs::read_dir(&input_frames)
            .map(|r| r.count())
            .unwrap_or(0);

        if frame_count == 0 {
            return Err(AppError::new(
                AppErrorCode::UnsupportedMedia,
                "No frames were extracted from the input video file.",
            ));
        }

        // 5. Run real AI inference
        if plan.needs_upscale {
            progress_cb(
                "upscaling",
                30.0,
                &format!("Running Real-ESRGAN Vulkan inference on {frame_count} frames..."),
            );

            // Determine model name passed to engine
            let model_name = if config.model_id.starts_with("realesr-animevideov3") {
                "realesr-animevideov3"
            } else if config.model_id.contains("anime") {
                "realesrgan-x4plus-anime"
            } else {
                "realesrgan-x4plus"
            };

            RealEsrganAdapter::upscale_directory(
                &input_frames,
                &output_frames,
                model_name,
                model_scale,
                None, // auto-detect discrete GPU
                Some(&|pct| {
                    let overall_pct = 30.0 + (pct * 0.40); // 30% to 70%
                    progress_cb("upscaling", overall_pct, &format!("AI upscaling: {pct:.1}% complete"));
                }),
            )?;
        } else {
            // Source is already >= target resolution; copy frames directly for downscaling
            progress_cb("preparing", 50.0, "Source resolution exceeds target; proceeding to high-precision downscaling...");
            for entry in std::fs::read_dir(&input_frames).map_err(|e| AppError::new(AppErrorCode::IoError, e.to_string()))? {
                let entry = entry.map_err(|e| AppError::new(AppErrorCode::IoError, e.to_string()))?;
                let file_name = entry.file_name();
                std::fs::copy(entry.path(), output_frames.join(file_name)).map_err(|e| AppError::new(AppErrorCode::IoError, e.to_string()))?;
            }
        }

        // 6. Encode and reassemble output video with FFmpeg
        progress_cb("encoding", 75.0, "Encoding enhanced frames into target video container...");

        let num = source_media.frame_rate_numerator.unwrap_or(30);
        let den = source_media.frame_rate_denominator.unwrap_or(1);
        let fps_str = if den > 0 {
            format!("{num}/{den}")
        } else {
            "30/1".to_string()
        };

        let encoded_frame_pattern = output_frames.join("frame_%08d.png");

        // Quality presets to CRF values
        let crf = match config.quality_preset.to_lowercase().as_str() {
            "maximum" => "16",
            "high" => "19",
            _ => "23", // balanced
        };

        let mut encode_cmd = Command::new("ffmpeg");
        encode_cmd.args(["-v", "error", "-y"]);
        encode_cmd.args(["-framerate", &fps_str]);
        encode_cmd.arg("-i").arg(&encoded_frame_pattern);
        encode_cmd.arg("-i").arg(&config.input_path);

        // Apply resolution filter chain
        encode_cmd.arg("-vf").arg(&plan.ffmpeg_filter);

        // Video codec & CRF
        encode_cmd.args(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", crf, "-preset", "medium"]);

        // Map audio
        if config.audio_policy == "preserve" && !source_media.audio_tracks.is_empty() {
            encode_cmd.args(["-map", "0:v:0", "-map", "1:a?", "-c:a", "aac", "-b:a", "192k"]);
        } else {
            encode_cmd.args(["-map", "0:v:0", "-an"]);
        }

        // Map subtitles if requested and available in container
        if config.subtitle_policy == "preserve-supported"
            && !source_media.subtitle_tracks.is_empty()
            && config.container.to_lowercase() == "mkv"
        {
            encode_cmd.args(["-map", "1:s?", "-c:s", "copy"]);
        }

        encode_cmd.arg(&config.output_path);

        let encode_status = encode_cmd.status().map_err(|e| {
            AppError::new(
                AppErrorCode::EncodeFailed,
                format!("Failed to execute FFmpeg encoding: {e}"),
            )
        })?;

        if !encode_status.success() {
            return Err(AppError::new(
                AppErrorCode::EncodeFailed,
                "FFmpeg failed to encode reassembled video frames.",
            ));
        }

        // 7. Output Validation with FFprobe
        progress_cb("verifying", 90.0, "Validating exported video dimensions and streams via FFprobe...");

        if !output_file_path.exists() {
            return Err(AppError::new(
                AppErrorCode::OutputValidationFailed,
                "Exported video file does not exist at target destination.",
            ));
        }

        let output_media = inspect_media_file(&config.output_path).map_err(|e| {
            AppError::new(
                AppErrorCode::OutputValidationFailed,
                format!("Failed to inspect exported video: {}", e.message),
            )
        })?;

        if output_media.file_size_bytes == 0 {
            return Err(AppError::new(
                AppErrorCode::OutputValidationFailed,
                "Exported video file is empty (0 bytes).",
            ));
        }

        // Strict dimension check against target preset
        if output_media.width != plan.target_width || output_media.height != plan.target_height {
            return Err(AppError::new(
                AppErrorCode::OutputValidationFailed,
                format!(
                    "Output dimensions ({}×{}) do not match requested target preset ({}×{}).",
                    output_media.width, output_media.height, plan.target_width, plan.target_height
                ),
            ));
        }

        // Check audio stream presence if preserved
        if config.audio_policy == "preserve" && !source_media.audio_tracks.is_empty() {
            if output_media.audio_tracks.is_empty() {
                return Err(AppError::new(
                    AppErrorCode::OutputValidationFailed,
                    "Expected preserved audio stream was missing from exported video.",
                ));
            }
        }

        progress_cb("complete", 100.0, "Video enhancement and verified export complete!");

        Ok(EnhancementResult {
            success: true,
            output_path: config.output_path.clone(),
            target_width: plan.target_width,
            target_height: plan.target_height,
            actual_width: output_media.width,
            actual_height: output_media.height,
            duration_ms: output_media.duration_ms,
            file_size_bytes: output_media.file_size_bytes,
            video_codec: output_media.video_codec,
            audio_tracks_count: output_media.audio_tracks.len(),
            resolution_plan: plan,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_cleanup_workspace() {
        let ws = VideoEnhancementPipeline::create_job_workspace("test_job_123").unwrap();
        assert!(ws.exists());
        VideoEnhancementPipeline::cleanup_workspace(&ws);
        assert!(!ws.exists());
    }

    #[test]
    fn test_end_to_end_pipeline_if_ffmpeg_available() {
        let temp_in = std::env::temp_dir().join("oe_pipeline_test_in.mp4");
        let temp_out = std::env::temp_dir().join("oe_pipeline_test_out.mp4");

        let gen_status = Command::new("ffmpeg")
            .args([
                "-y",
                "-f",
                "lavfi",
                "-i",
                "testsrc=duration=1:size=640x360:rate=24",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=1000:duration=1",
                "-c:v",
                "libx264",
                "-c:a",
                "aac",
                "-pix_fmt",
                "yuv420p",
            ])
            .arg(&temp_in)
            .status();

        if let Ok(status) = gen_status {
            if status.success() && temp_in.exists() {
                let config = EnhancementJobConfig {
                    input_path: temp_in.to_string_lossy().to_string(),
                    output_path: temp_out.to_string_lossy().to_string(),
                    output_preset: "1080p".to_string(),
                    model_id: "realesr-animevideov3-x2".to_string(),
                    quality_preset: "balanced".to_string(),
                    fit_mode: "contain".to_string(),
                    container: "mp4".to_string(),
                    audio_policy: "preserve".to_string(),
                    subtitle_policy: "remove".to_string(),
                };

                let res = VideoEnhancementPipeline::execute("test_pipe_run", &config, |_s, _p, _m| {});
                assert!(res.is_ok(), "Pipeline execution failed: {:?}", res.err());
                let result = res.unwrap();
                assert_eq!(result.actual_width, 1920);
                assert_eq!(result.actual_height, 1080);
                assert!(result.audio_tracks_count > 0);
                assert!(temp_out.exists());

                let _ = std::fs::remove_file(temp_in);
                let _ = std::fs::remove_file(temp_out);
            }
        }
    }
}

