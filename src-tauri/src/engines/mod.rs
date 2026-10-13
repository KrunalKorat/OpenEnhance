//! AI engine adapter interfaces for OpenEnhance.
//! Keeps AI execution behind a typed Rust trait.

use crate::error::AppError;
use std::path::Path;

pub trait AiEngineAdapter: Send + Sync {
    fn engine_id(&self) -> &'static str;
    fn probe_capabilities(&self) -> Result<crate::commands::EngineCapabilities, AppError>;
    fn validate_model(&self, model_path: &Path) -> Result<bool, AppError>;
}
