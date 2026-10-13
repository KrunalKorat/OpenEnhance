use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub app_version: String,
    pub api_version: u32,
    pub os: String,
    pub architecture: String,
    pub storage_schema_version: u32,
}

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    let os = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "unknown"
    };

    AppInfo {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        api_version: 1,
        os: os.to_string(),
        architecture: std::env::consts::ARCH.to_string(),
        storage_schema_version: 1,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_app_info() {
        let info = get_app_info();
        assert_eq!(info.api_version, 1);
        assert_eq!(info.storage_schema_version, 1);
        assert!(!info.app_version.is_empty());
        assert!(!info.architecture.is_empty());
        assert!(["windows", "linux", "macos", "unknown"].contains(&info.os.as_str()));
    }
}
