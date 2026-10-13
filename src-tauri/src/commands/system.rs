use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCapability {
    pub model_id: String,
    pub installed: bool,
    pub verified: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineCapabilities {
    pub engine_id: String,
    pub engine_version: String,
    pub available: bool,
    pub platform: String,
    pub acceleration: String, // "vulkan" | "cuda" | "cpu" | "unknown"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device_name: Option<String>,
    pub models: Vec<ModelCapability>,
    pub supports_cancellation: bool,
    pub supports_progress: bool,
    pub supported_operations: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemCapabilities {
    pub os: String,
    pub architecture: String,
    pub ffmpeg_available: bool,
    pub ffmpeg_version: Option<String>,
    pub ffprobe_available: bool,
    pub ffprobe_version: Option<String>,
    pub vulkan_available: bool,
    pub vulkan_device: Option<String>,
    pub engines: Vec<EngineCapabilities>,
    pub warnings: Vec<String>,
}

fn check_binary(binary_name: &str, args: &[&str]) -> (bool, Option<String>) {
    match Command::new(binary_name).args(args).output() {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let first_line = stdout.lines().next().unwrap_or("").trim().to_string();
            (true, Some(first_line))
        }
        _ => (false, None),
    }
}

#[tauri::command]
pub fn get_system_capabilities() -> SystemCapabilities {
    let mut warnings = Vec::new();

    let (ffmpeg_available, ffmpeg_version) = check_binary("ffmpeg", &["-version"]);
    if !ffmpeg_available {
        warnings.push("FFmpeg is not detected on system PATH. Video encoding may be unavailable.".to_string());
    }

    let (ffprobe_available, ffprobe_version) = check_binary("ffprobe", &["-version"]);
    if !ffprobe_available {
        warnings.push("FFprobe is not detected on system PATH. Media inspection may be unavailable.".to_string());
    }

    let engine_status = crate::engines::realesrgan::RealEsrganAdapter::get_status();
    let vulkan_available = engine_status.acceleration == "vulkan";
    let vulkan_device = engine_status.gpu_device.clone();

    if !vulkan_available {
        warnings.push("Vulkan runtime was not detected via vulkaninfo. GPU acceleration requires verified Vulkan support.".to_string());
    }

    let os = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "unknown"
    };

    let models = engine_status
        .models
        .iter()
        .map(|m| ModelCapability {
            model_id: m.model_id.clone(),
            installed: m.installed,
            verified: m.verified,
            license_url: m.license_url.clone(),
        })
        .collect();

    let engine = EngineCapabilities {
        engine_id: engine_status.engine_id,
        engine_version: engine_status.engine_version,
        available: engine_status.available,
        platform: os.to_string(),
        acceleration: engine_status.acceleration,
        device_name: vulkan_device.clone(),
        models,
        supports_cancellation: true,
        supports_progress: true,
        supported_operations: vec!["upscale".to_string()],
        warnings: engine_status.warnings,
    };

    SystemCapabilities {
        os: os.to_string(),
        architecture: std::env::consts::ARCH.to_string(),
        ffmpeg_available,
        ffmpeg_version,
        ffprobe_available,
        ffprobe_version,
        vulkan_available,
        vulkan_device,
        engines: vec![engine],
        warnings,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_system_capabilities_structure() {
        let caps = get_system_capabilities();
        assert!(!caps.os.is_empty());
        assert!(!caps.architecture.is_empty());
        assert!(!caps.engines.is_empty());
        let engine = &caps.engines[0];
        assert_eq!(engine.engine_id, "realesrgan-ncnn-vulkan");
        assert!(engine.supports_cancellation);
    }
}
