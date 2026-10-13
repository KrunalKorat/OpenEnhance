//! Job management and state machine definitions for OpenEnhance.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum JobState {
    Queued,
    Preparing,
    Running,
    Cancelling,
    Cancelled,
    Succeeded,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum JobStage {
    Validating,
    Probing,
    Preparing,
    Upscaling,
    Resizing,
    Encoding,
    Verifying,
    Cleanup,
}
