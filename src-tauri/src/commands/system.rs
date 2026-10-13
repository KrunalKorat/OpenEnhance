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

fn check_vulkan() -> (bool, Option<String>) {
    // Try vulkaninfo --summary or vulkaninfo
    if let Ok(output) = Command::new("vulkaninfo").arg("--summary").output() {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            // Search for deviceName = ...
            for line in text.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("deviceName") {
                    let parts: Vec<&str> = trimmed.split('=').collect();
                    if parts.len() > 1 {
                        return (true, Some(parts[1].trim().to_string()));
                    }
                }
            }
            return (true, Some("Vulkan Driver Detected".to_string()));
        }
    }
    (false, None)
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

    let (vulkan_available, vulkan_device) = check_vulkan();
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

    let engine = EngineCapabilities {
        engine_id: "realesrgan-ncnn-vulkan".to_string(),
        engine_version: "candidate-adapter".to_string(),
        available: vulkan_available,
        platform: os.to_string(),
        acceleration: if vulkan_available { "vulkan".to_string() } else { "unknown".to_string() },
        device_name: vulkan_device.clone(),
        models: vec![
            ModelCapability {
                model_id: "realesrgan-x4plus".to_string(),
                installed: false,
                verified: false,
                license_url: Some("https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE".to_string()),
            },
            ModelCapability {
                model_id: "realesrgan-x4plus-anime".to_string(),
                installed: false,
                verified: false,
                license_url: Some("https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE".to_string()),
            },
        ],
        supports_cancellation: true,
        supports_progress: true,
        supported_operations: vec!["upscale".to_string()],
        warnings: if !vulkan_available {
            vec!["Vulkan acceleration unavailable for Real-ESRGAN engine.".to_string()]
        } else {
            vec![]
        },
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
