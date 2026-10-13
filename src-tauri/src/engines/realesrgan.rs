//! Real-ESRGAN NCNN Vulkan engine adapter implementation.
//! Provides binary discovery, model verification, GPU/device detection,
//! single-frame inference, and batch frame directory processing.

use crate::error::{AppError, AppErrorCode};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub model_id: String,
    pub name: String,
    pub scale: u32,
    pub description: String,
    pub installed: bool,
    pub verified: bool,
    pub file_size_bytes: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub engine_id: String,
    pub engine_version: String,
    pub available: bool,
    pub binary_path: Option<String>,
    pub models_path: Option<String>,
    pub acceleration: String, // "vulkan" | "cpu" | "unknown"
    pub gpu_device: Option<String>,
    pub gpu_id: i32,
    pub models: Vec<ModelInfo>,
    pub warnings: Vec<String>,
}

pub struct RealEsrganAdapter;

impl RealEsrganAdapter {
    /// Discovers the path to the realesrgan-ncnn-vulkan executable.
    pub fn find_binary() -> Option<PathBuf> {
        // 1. Check local app data: %LOCALAPPDATA%/OpenEnhance/engine/realesrgan-ncnn-vulkan.exe
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let candidate = PathBuf::from(local_app_data)
                .join("OpenEnhance")
                .join("engine")
                .join("realesrgan-ncnn-vulkan.exe");
            if candidate.exists() {
                return Some(candidate);
            }
        }

        // 2. Check next to current exe
        if let Ok(current_exe) = std::env::current_exe() {
            if let Some(parent) = current_exe.parent() {
                let candidate1 = parent.join("realesrgan-ncnn-vulkan.exe");
                if candidate1.exists() {
                    return Some(candidate1);
                }
                let candidate2 = parent.join("engine").join("realesrgan-ncnn-vulkan.exe");
                if candidate2.exists() {
                    return Some(candidate2);
                }
            }
        }

        // 3. Check system TEMP directory fallback
        let temp_dir = std::env::temp_dir();
        let temp_candidate = temp_dir
            .join("realesrgan-20220424")
            .join("realesrgan-ncnn-vulkan.exe");
        if temp_candidate.exists() {
            return Some(temp_candidate);
        }

        // 4. Check system PATH
        if let Ok(path_var) = std::env::var("PATH") {
            for p in std::env::split_paths(&path_var) {
                let candidate = p.join("realesrgan-ncnn-vulkan.exe");
                if candidate.exists() {
                    return Some(candidate);
                }
            }
        }

        None
    }

    /// Finds the models folder associated with the binary.
    pub fn find_models_dir(binary_path: &Path) -> Option<PathBuf> {
        if let Some(parent) = binary_path.parent() {
            let models = parent.join("models");
            if models.exists() && models.is_dir() {
                return Some(models);
            }
        }
        None
    }

    /// Probes and detects GPU device and ID for Vulkan acceleration.
    /// Prioritizes discrete NVIDIA / AMD GPUs over integrated Intel graphics.
    pub fn detect_gpu_device() -> (Option<String>, i32, String) {
        // Run vulkaninfo --summary
        if let Ok(output) = Command::new("vulkaninfo").arg("--summary").output() {
            if output.status.success() {
                let text = String::from_utf8_lossy(&output.stdout);
                let mut devices: Vec<(String, String)> = Vec::new();
                let mut current_name: Option<String> = None;

                for line in text.lines() {
                    let trimmed = line.trim();
                    if trimmed.starts_with("deviceName") {
                        if let Some((_, val)) = trimmed.split_once('=') {
                            current_name = Some(val.trim().to_string());
                        }
                    } else if trimmed.starts_with("deviceType") {
                        if let Some((_, val)) = trimmed.split_once('=') {
                            if let Some(name) = current_name.take() {
                                devices.push((name, val.trim().to_string()));
                            }
                        }
                    }
                }

                // If multiple devices, pick DISCRETE_GPU first (usually device 1 or NVIDIA)
                for (idx, (name, dev_type)) in devices.iter().enumerate() {
                    if dev_type.contains("DISCRETE_GPU")
                        || name.contains("NVIDIA")
                        || name.contains("GeForce")
                        || name.contains("Radeon")
                    {
                        return (Some(name.clone()), idx as i32, "vulkan".to_string());
                    }
                }

                if let Some((first_name, _)) = devices.first() {
                    return (Some(first_name.clone()), 0, "vulkan".to_string());
                }
            }
        }

        (None, 0, "unknown".to_string())
    }

    /// Inspects the models directory and lists all known Real-ESRGAN models with verified status.
    pub fn list_models(models_dir: Option<&Path>) -> Vec<ModelInfo> {
        let known_definitions = vec![
            (
                "realesr-animevideov3",
                "Real-ESRGAN AnimeVideo v3",
                4,
                "Fast temporal video restoration model optimized for anime, cartoons, and clean CGI.",
                vec!["realesr-animevideov3-x4.bin", "realesr-animevideov3-x4.param"],
            ),
            (
                "realesr-animevideov3-x2",
                "Real-ESRGAN AnimeVideo v3 (2x)",
                2,
                "High-speed 2x upscale model for animation and line art.",
                vec!["realesr-animevideov3-x2.bin", "realesr-animevideov3-x2.param"],
            ),
            (
                "realesr-animevideov3-x3",
                "Real-ESRGAN AnimeVideo v3 (3x)",
                3,
                "Balanced 3x upscale model for 720p to 1440p workflows.",
                vec!["realesr-animevideov3-x3.bin", "realesr-animevideov3-x3.param"],
            ),
            (
                "realesrgan-x4plus",
                "Real-ESRGAN x4 Plus",
                4,
                "General-purpose deep neural model for real-world footage, live action, and textured scenes.",
                vec!["realesrgan-x4plus.bin", "realesrgan-x4plus.param"],
            ),
            (
                "realesrgan-x4plus-anime",
                "Real-ESRGAN x4 Plus Anime",
                4,
                "Specialized 4x model preserving sharp line art, flat fills, and illustration details.",
                vec!["realesrgan-x4plus-anime.bin", "realesrgan-x4plus-anime.param"],
            ),
        ];

        let mut result = Vec::new();

        for (id, name, scale, desc, files) in known_definitions {
            let mut installed = false;
            let mut verified = false;
            let mut total_size: u64 = 0;

            if let Some(dir) = models_dir {
                let mut all_exist = true;
                for f in &files {
                    let file_path = dir.join(f);
                    if file_path.exists() {
                        if let Ok(meta) = std::fs::metadata(&file_path) {
                            total_size += meta.len();
                        }
                    } else {
                        all_exist = false;
                    }
                }
                if all_exist && total_size > 0 {
                    installed = true;
                    verified = true;
                }
            }

            result.push(ModelInfo {
                model_id: id.to_string(),
                name: name.to_string(),
                scale,
                description: desc.to_string(),
                installed,
                verified,
                file_size_bytes: total_size,
                license_url: Some(
                    "https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE".to_string(),
                ),
            });
        }

        result
    }

    /// Returns full readiness and capability status of the AI engine.
    pub fn get_status() -> EngineStatus {
        let binary_path = Self::find_binary();
        let available = binary_path.is_some();
        let models_path = binary_path
            .as_ref()
            .and_then(|p| Self::find_models_dir(p));

        let (gpu_device, gpu_id, acceleration) = Self::detect_gpu_device();
        let models = Self::list_models(models_path.as_deref());

        let mut warnings = Vec::new();
        if !available {
            warnings.push("Real-ESRGAN NCNN Vulkan binary was not found. Install or download the verified engine package.".to_string());
        }
        if acceleration != "vulkan" {
            warnings.push("Vulkan GPU acceleration was not detected. Inference may fall back to CPU or fail.".to_string());
        }

        EngineStatus {
            engine_id: "realesrgan-ncnn-vulkan".to_string(),
            engine_version: "20220424-vulkan".to_string(),
            available,
            binary_path: binary_path.map(|p| p.to_string_lossy().to_string()),
            models_path: models_path.map(|p| p.to_string_lossy().to_string()),
            acceleration,
            gpu_device,
            gpu_id,
            models,
            warnings,
        }
    }

    /// Enhances a single image frame using Real-ESRGAN.
    pub fn upscale_frame(
        input: &Path,
        output: &Path,
        model_name: &str,
        scale: u32,
        gpu_id: Option<i32>,
    ) -> Result<(), AppError> {
        let binary = Self::find_binary().ok_or_else(|| {
            AppError::new(
                AppErrorCode::EngineMissing,
                "Real-ESRGAN executable not found. Ensure engine is installed.",
            )
        })?;

        let models_dir = Self::find_models_dir(&binary).ok_or_else(|| {
            AppError::new(
                AppErrorCode::ModelMissing,
                "Real-ESRGAN models directory not found.",
            )
        })?;

        if !input.exists() {
            return Err(AppError::new(
                AppErrorCode::InputUnreadable,
                format!("Input image not found: {}", input.display()),
            ));
        }

        let mut cmd = Command::new(&binary);
        cmd.arg("-i").arg(input);
        cmd.arg("-o").arg(output);
        cmd.arg("-n").arg(model_name);
        cmd.arg("-s").arg(scale.to_string());
        cmd.arg("-m").arg(&models_dir);

        if let Some(gid) = gpu_id {
            cmd.arg("-g").arg(gid.to_string());
        } else {
            let (_, detected_gid, _) = Self::detect_gpu_device();
            cmd.arg("-g").arg(detected_gid.to_string());
        }

        let proc_output = cmd.output().map_err(|e| {
            AppError::new(
                AppErrorCode::ProcessStartFailed,
                format!("Failed to execute Real-ESRGAN: {e}"),
            )
        })?;

        if !proc_output.status.success() {
            let stderr = String::from_utf8_lossy(&proc_output.stderr);
            return Err(AppError::new(
                AppErrorCode::InternalError,
                format!("Real-ESRGAN inference failed: {}", stderr.trim()),
            ));
        }

        if !output.exists() {
            return Err(AppError::new(
                AppErrorCode::OutputValidationFailed,
                "Real-ESRGAN exited successfully but output image was not created.",
            ));
        }

        Ok(())
    }

    /// Upscales all frames in an input directory to an output directory.
    pub fn upscale_directory(
        input_dir: &Path,
        output_dir: &Path,
        model_name: &str,
        scale: u32,
        gpu_id: Option<i32>,
        progress_cb: Option<&dyn Fn(f32)>,
    ) -> Result<(), AppError> {
        let binary = Self::find_binary().ok_or_else(|| {
            AppError::new(
                AppErrorCode::EngineMissing,
                "Real-ESRGAN executable not found. Ensure engine is installed.",
            )
        })?;

        let models_dir = Self::find_models_dir(&binary).ok_or_else(|| {
            AppError::new(
                AppErrorCode::ModelMissing,
                "Real-ESRGAN models directory not found.",
            )
        })?;

        if !input_dir.exists() {
            return Err(AppError::new(
                AppErrorCode::InputUnreadable,
                format!("Input directory does not exist: {}", input_dir.display()),
            ));
        }

        std::fs::create_dir_all(output_dir).map_err(|e| {
            AppError::new(
                AppErrorCode::IoError,
                format!("Failed to create output directory: {e}"),
            )
        })?;

        let mut cmd = Command::new(&binary);
        cmd.arg("-i").arg(input_dir);
        cmd.arg("-o").arg(output_dir);
        cmd.arg("-n").arg(model_name);
        cmd.arg("-s").arg(scale.to_string());
        cmd.arg("-m").arg(&models_dir);

        if let Some(gid) = gpu_id {
            cmd.arg("-g").arg(gid.to_string());
        } else {
            let (_, detected_gid, _) = Self::detect_gpu_device();
            cmd.arg("-g").arg(detected_gid.to_string());
        }

        let proc_output = cmd.output().map_err(|e| {
            AppError::new(
                AppErrorCode::ProcessStartFailed,
                format!("Failed to execute Real-ESRGAN directory inference: {e}"),
            )
        })?;

        if !proc_output.status.success() {
            let stderr = String::from_utf8_lossy(&proc_output.stderr);
            return Err(AppError::new(
                AppErrorCode::InternalError,
                format!("Batch upscaling failed: {}", stderr.trim()),
            ));
        }

        // Parse any progress lines from stderr/stdout
        let combined = format!(
            "{}\n{}",
            String::from_utf8_lossy(&proc_output.stdout),
            String::from_utf8_lossy(&proc_output.stderr)
        );

        if let Some(cb) = progress_cb {
            for line in combined.lines() {
                let trimmed = line.trim();
                if trimmed.ends_with('%') {
                    if let Ok(pct) = trimmed.trim_end_matches('%').parse::<f32>() {
                        cb(pct);
                    }
                }
            }
            cb(100.0);
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_models_definitions() {
        let models = RealEsrganAdapter::list_models(None);
        assert!(!models.is_empty());
        assert!(models.iter().any(|m| m.model_id == "realesrgan-x4plus"));
        assert!(models.iter().any(|m| m.model_id == "realesr-animevideov3"));
    }

    #[test]
    fn test_get_status_structure() {
        let status = RealEsrganAdapter::get_status();
        assert_eq!(status.engine_id, "realesrgan-ncnn-vulkan");
        assert!(!status.models.is_empty());
    }

    #[test]
    fn test_find_binary_if_installed() {
        if let Some(bin) = RealEsrganAdapter::find_binary() {
            assert!(bin.exists());
            let models_dir = RealEsrganAdapter::find_models_dir(&bin);
            assert!(models_dir.is_some());
        }
    }
}
