//! Typed Tauri events module for OpenEnhance.
//! Events are emitted to notify frontend of state updates, logs, and capability changes.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobLogEvent {
    pub job_id: String,
    pub timestamp: String,
    pub level: String, // "debug" | "info" | "warning" | "error"
    pub stage: Option<String>,
    pub message: String,
}
