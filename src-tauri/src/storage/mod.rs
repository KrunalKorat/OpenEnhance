//! Storage and settings persistence module for OpenEnhance.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPreferences {
    pub theme: String,
    pub default_output_folder: Option<String>,
    pub temp_directory: Option<String>,
    pub concurrency_limit: u32,
    pub auto_clean_temp: bool,
    pub prefers_reduced_motion: bool,
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            default_output_folder: None,
            temp_directory: None,
            concurrency_limit: 1,
            auto_clean_temp: true,
            prefers_reduced_motion: false,
        }
    }
}
