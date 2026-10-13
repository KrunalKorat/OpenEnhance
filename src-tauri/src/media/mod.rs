//! Media inspection and metadata types for OpenEnhance.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioTrackInfo {
    pub index: u32,
    pub codec: Option<String>,
    pub language: Option<String>,
    pub channels: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleTrackInfo {
    pub index: u32,
    pub codec: Option<String>,
    pub language: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub path: String,
    pub file_name: String,
    pub container: Option<String>,
    pub duration_ms: Option<u64>,
    pub width: u32,
    pub height: u32,
    pub frame_rate_numerator: Option<u32>,
    pub frame_rate_denominator: Option<u32>,
    pub average_frame_rate: Option<f64>,
    pub variable_frame_rate: Option<bool>,
    pub video_codec: Option<String>,
    pub pixel_format: Option<String>,
    pub bitrate: Option<u64>,
    pub file_size_bytes: u64,
    pub audio_tracks: Vec<AudioTrackInfo>,
    pub subtitle_tracks: Vec<SubtitleTrackInfo>,
}
