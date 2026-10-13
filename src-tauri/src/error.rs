use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AppErrorCode {
    InvalidArgument,
    PathNotAllowed,
    InputUnreadable,
    UnsupportedMedia,
    EngineMissing,
    EngineUnavailable,
    ModelMissing,
    ModelUnverified,
    GpuUnavailable,
    GpuOutOfMemory,
    InsufficientDiskSpace,
    JobNotFound,
    JobStateInvalid,
    ProcessStartFailed,
    ProcessCancelled,
    EncodeFailed,
    OutputValidationFailed,
    PermissionDenied,
    IoError,
    InternalError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub code: AppErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stage: Option<String>,
    pub retryable: boolean_alias::Bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
}

mod boolean_alias {
    pub type Bool = bool;
}

impl AppError {
    pub fn new(code: AppErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            stage: None,
            retryable: false,
            details: None,
            correlation_id: None,
        }
    }

    pub fn with_stage(mut self, stage: impl Into<String>) -> Self {
        self.stage = Some(stage.into());
        self
    }

    pub fn with_retryable(mut self, retryable: bool) -> Self {
        self.retryable = retryable;
        self
    }

    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{:?}] {}", self.code, self.message)
    }
}

impl std::error::Error for AppError {}
