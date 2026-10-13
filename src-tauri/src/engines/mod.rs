//! AI engine adapter interfaces for OpenEnhance.
//! Keeps AI execution behind a typed Rust trait.

pub mod realesrgan;

pub use realesrgan::{EngineStatus, ModelInfo, RealEsrganAdapter};
