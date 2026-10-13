//! Media inspection and metadata module for OpenEnhance.
//! Safe execution of FFprobe and FFmpeg for metadata inspection and thumbnail generation.

use crate::error::{AppError, AppErrorCode};
use crate::security::validate_input_file;
use base64::Engine;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AudioTrackInfo {
    pub index: u32,
    pub codec: Option<String>,
    pub language: Option<String>,
    pub channels: Option<u32>,
    pub sample_rate: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleTrackInfo {
    pub index: u32,
    pub codec: Option<String>,
    pub language: Option<String>,
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
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
    pub display_aspect_ratio: Option<String>,
    pub sample_aspect_ratio: Option<String>,
    pub frame_count: Option<u64>,
    pub rotation: Option<i32>,
    pub audio_tracks: Vec<AudioTrackInfo>,
    pub subtitle_tracks: Vec<SubtitleTrackInfo>,
}

// Internal raw FFprobe JSON mapping structs
#[derive(Debug, Deserialize)]
struct FFprobeFormat {
    format_name: Option<String>,
    duration: Option<String>,
    size: Option<String>,
    bit_rate: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FFprobeSideData {
    _side_data_type: Option<String>,
    rotation: Option<i32>,
}

#[derive(Debug, Deserialize)]
struct FFprobeStream {
    index: u32,
    codec_type: String,
    codec_name: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    r_frame_rate: Option<String>,
    avg_frame_rate: Option<String>,
    pix_fmt: Option<String>,
    display_aspect_ratio: Option<String>,
    sample_aspect_ratio: Option<String>,
    nb_frames: Option<String>,
    duration: Option<String>,
    bit_rate: Option<String>,
    channels: Option<u32>,
    sample_rate: Option<String>,
    tags: Option<HashMap<String, String>>,
    side_data_list: Option<Vec<FFprobeSideData>>,
}

#[derive(Debug, Deserialize)]
struct FFprobeOutput {
    streams: Option<Vec<FFprobeStream>>,
    format: Option<FFprobeFormat>,
}

/// Parses a fractional rate string like "30000/1001" or "24/1" or "30"
pub fn parse_fractional_rate(rate_str: &str) -> (Option<u32>, Option<u32>, Option<f64>) {
    let trimmed = rate_str.trim();
    if trimmed.is_empty() || trimmed == "0/0" {
        return (None, None, None);
    }

    if let Some((num_str, den_str)) = trimmed.split_once('/') {
        if let (Ok(num), Ok(den)) = (num_str.trim().parse::<u32>(), den_str.trim().parse::<u32>())
        {
            if den > 0 {
                let rate = num as f64 / den as f64;
                return (Some(num), Some(den), Some(rate));
            }
        }
    } else if let Ok(val) = trimmed.parse::<f64>() {
        if val > 0.0 {
            return (Some(val.round() as u32), Some(1), Some(val));
        }
    }

    (None, None, None)
}

/// Parses raw FFprobe JSON output into typed MediaInfo
pub fn parse_ffprobe_json(
    raw_json: &str,
    file_path: &Path,
    file_size_fallback: u64,
) -> Result<MediaInfo, AppError> {
    let parsed: FFprobeOutput = serde_json::from_str(raw_json).map_err(|e| {
        AppError::new(
            AppErrorCode::UnsupportedMedia,
            format!("Failed to parse FFprobe metadata: {e}"),
        )
    })?;

    let streams = parsed.streams.unwrap_or_default();
    let format = parsed.format;

    // Find the primary video stream
    let video_stream = streams
        .iter()
        .find(|s| s.codec_type == "video")
        .ok_or_else(|| {
            AppError::new(
                AppErrorCode::UnsupportedMedia,
                "File contains no decodable video stream",
            )
        })?;

    let width = video_stream.width.unwrap_or(0);
    let height = video_stream.height.unwrap_or(0);

    if width == 0 || height == 0 {
        return Err(AppError::new(
            AppErrorCode::UnsupportedMedia,
            "Video stream does not contain valid dimensions",
        ));
    }

    // Parse frame rates
    let (mut num, mut den, mut avg_rate) =
        parse_fractional_rate(video_stream.r_frame_rate.as_deref().unwrap_or(""));

    let (_, _, fallback_avg_rate) =
        parse_fractional_rate(video_stream.avg_frame_rate.as_deref().unwrap_or(""));

    let mut is_vfr = false;
    if let (Some(r), Some(avg)) = (avg_rate, fallback_avg_rate) {
        if (r - avg).abs() > 0.05 {
            is_vfr = true;
        }
    }

    if avg_rate.is_none() {
        avg_rate = fallback_avg_rate;
        if let Some((n, d, _)) = fallback_avg_rate.map(|_| {
            parse_fractional_rate(video_stream.avg_frame_rate.as_deref().unwrap_or(""))
        }) {
            num = n;
            den = d;
        }
    }

    // Duration in milliseconds (try format duration, then stream duration)
    let duration_sec = format
        .as_ref()
        .and_then(|f| f.duration.as_deref())
        .or_else(|| video_stream.duration.as_deref())
        .and_then(|d| d.parse::<f64>().ok());

    let duration_ms = duration_sec.map(|s| (s * 1000.0).round() as u64);

    // File size
    let file_size_bytes = format
        .as_ref()
        .and_then(|f| f.size.as_deref())
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(file_size_fallback);

    // Bitrate
    let bitrate = format
        .as_ref()
        .and_then(|f| f.bit_rate.as_deref())
        .or_else(|| video_stream.bit_rate.as_deref())
        .and_then(|b| b.parse::<u64>().ok());

    // Frame count
    let frame_count = video_stream
        .nb_frames
        .as_deref()
        .and_then(|f| f.parse::<u64>().ok());

    // Rotation
    let mut rotation: Option<i32> = None;
    if let Some(tags) = &video_stream.tags {
        if let Some(rot_str) = tags.get("rotate").or_else(|| tags.get("ROTATION")) {
            if let Ok(rot) = rot_str.parse::<i32>() {
                rotation = Some(rot);
            }
        }
    }
    if rotation.is_none() {
        if let Some(side_data) = &video_stream.side_data_list {
            for sd in side_data {
                if let Some(rot) = sd.rotation {
                    rotation = Some(rot);
                    break;
                }
            }
        }
    }

    // Audio tracks
    let mut audio_tracks = Vec::new();
    for stream in streams.iter().filter(|s| s.codec_type == "audio") {
        let language = stream.tags.as_ref().and_then(|t| {
            t.get("language")
                .or_else(|| t.get("LANGUAGE"))
                .or_else(|| t.get("lang"))
                .cloned()
        });

        let sample_rate = stream
            .sample_rate
            .as_deref()
            .and_then(|sr| sr.parse::<u32>().ok());

        audio_tracks.push(AudioTrackInfo {
            index: stream.index,
            codec: stream.codec_name.clone(),
            language,
            channels: stream.channels,
            sample_rate,
        });
    }

    // Subtitle tracks
    let mut subtitle_tracks = Vec::new();
    for stream in streams.iter().filter(|s| s.codec_type == "subtitle") {
        let language = stream.tags.as_ref().and_then(|t| {
            t.get("language")
                .or_else(|| t.get("LANGUAGE"))
                .or_else(|| t.get("lang"))
                .cloned()
        });
        let title = stream.tags.as_ref().and_then(|t| {
            t.get("title")
                .or_else(|| t.get("TITLE"))
                .cloned()
        });

        subtitle_tracks.push(SubtitleTrackInfo {
            index: stream.index,
            codec: stream.codec_name.clone(),
            language,
            title,
        });
    }

    let file_name = file_path
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("unknown")
        .to_string();

    let container = format.and_then(|f| f.format_name);

    Ok(MediaInfo {
        path: file_path.to_string_lossy().to_string(),
        file_name,
        container,
        duration_ms,
        width,
        height,
        frame_rate_numerator: num,
        frame_rate_denominator: den,
        average_frame_rate: avg_rate,
        variable_frame_rate: if is_vfr { Some(true) } else { Some(false) },
        video_codec: video_stream.codec_name.clone(),
        pixel_format: video_stream.pix_fmt.clone(),
        bitrate,
        file_size_bytes,
        display_aspect_ratio: video_stream.display_aspect_ratio.clone(),
        sample_aspect_ratio: video_stream.sample_aspect_ratio.clone(),
        frame_count,
        rotation,
        audio_tracks,
        subtitle_tracks,
    })
}

/// Executes real FFprobe inspection on a validated file path
pub fn inspect_media_file(path_str: &str) -> Result<MediaInfo, AppError> {
    let canonical = validate_input_file(path_str)?;

    let metadata = std::fs::metadata(&canonical).map_err(|e| {
        AppError::new(
            AppErrorCode::InputUnreadable,
            format!("Cannot access file metadata: {e}"),
        )
    })?;

    let file_size = metadata.len();

    // Call ffprobe safely without shell interpolation
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
        ])
        .arg(&canonical)
        .output()
        .map_err(|e| {
            AppError::new(
                AppErrorCode::EngineMissing,
                format!("Failed to execute ffprobe. Ensure FFprobe is installed: {e}"),
            )
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::new(
            AppErrorCode::UnsupportedMedia,
            format!("FFprobe failed to inspect media: {stderr}"),
        ));
    }

    let raw_json = String::from_utf8_lossy(&output.stdout);
    parse_ffprobe_json(&raw_json, &canonical, file_size)
}

/// Generates a representative video thumbnail via FFmpeg and returns a base64 data URL
pub fn generate_video_thumbnail(path_str: &str) -> Result<String, AppError> {
    let canonical = validate_input_file(path_str)?;

    let cache_dir = std::env::temp_dir().join("openenhance_thumbnails");
    let _ = std::fs::create_dir_all(&cache_dir);

    // Compute a hash of the file path and file size for caching
    let meta = std::fs::metadata(&canonical).map_err(|e| {
        AppError::new(
            AppErrorCode::InputUnreadable,
            format!("Cannot inspect file for thumbnail: {e}"),
        )
    })?;

    let mut hasher = Sha256::new();
    hasher.update(canonical.to_string_lossy().as_bytes());
    hasher.update(meta.len().to_le_bytes());
    let hash = format!("{:x}", hasher.finalize());

    let thumb_file = cache_dir.join(format!("{hash}.jpg"));

    if thumb_file.exists() && thumb_file.metadata().map(|m| m.len() > 0).unwrap_or(false) {
        if let Ok(bytes) = std::fs::read(&thumb_file) {
            let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
            return Ok(format!("data:image/jpeg;base64,{encoded}"));
        }
    }

    // Try seeking to 1.0s first, fallback to 0.0s
    let mut cmd = Command::new("ffmpeg");
    cmd.args([
        "-ss",
        "00:00:01.000",
        "-i",
    ])
    .arg(&canonical)
    .args([
        "-vframes",
        "1",
        "-vf",
        "scale=640:-1",
        "-q:v",
        "2",
        "-y",
    ])
    .arg(&thumb_file);

    let mut success = false;
    if let Ok(res) = cmd.output() {
        if res.status.success() && thumb_file.exists() && thumb_file.metadata().map(|m| m.len() > 0).unwrap_or(false) {
            success = true;
        }
    }

    // Fallback seek to 00:00:00.000 if 1s was beyond duration or failed
    if !success {
        let mut fallback = Command::new("ffmpeg");
        fallback.args([
            "-ss",
            "00:00:00.000",
            "-i",
        ])
        .arg(&canonical)
        .args([
            "-vframes",
            "1",
            "-vf",
            "scale=640:-1",
            "-q:v",
            "2",
            "-y",
        ])
        .arg(&thumb_file);

        if let Ok(res) = fallback.output() {
            if res.status.success() && thumb_file.exists() && thumb_file.metadata().map(|m| m.len() > 0).unwrap_or(false) {
                success = true;
            }
        }
    }

    if !success || !thumb_file.exists() {
        return Err(AppError::new(
            AppErrorCode::UnsupportedMedia,
            "Failed to generate video thumbnail from media stream",
        ));
    }

    let bytes = std::fs::read(&thumb_file).map_err(|e| {
        AppError::new(
            AppErrorCode::IoError,
            format!("Cannot read generated thumbnail: {e}"),
        )
    })?;

    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:image/jpeg;base64,{encoded}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_FFPROBE_JSON: &str = r#"{
        "streams": [
            {
                "index": 0,
                "codec_name": "h264",
                "codec_type": "video",
                "width": 1920,
                "height": 1080,
                "r_frame_rate": "30000/1001",
                "avg_frame_rate": "30000/1001",
                "pix_fmt": "yuv420p",
                "display_aspect_ratio": "16:9",
                "sample_aspect_ratio": "1:1",
                "nb_frames": "1800",
                "duration": "60.060",
                "bit_rate": "4500000",
                "tags": {
                    "rotate": "0"
                }
            },
            {
                "index": 1,
                "codec_name": "aac",
                "codec_type": "audio",
                "channels": 2,
                "sample_rate": "48000",
                "tags": {
                    "language": "eng"
                }
            },
            {
                "index": 2,
                "codec_name": "subrip",
                "codec_type": "subtitle",
                "tags": {
                    "language": "spa",
                    "title": "Spanish Commentary"
                }
            }
        ],
        "format": {
            "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
            "duration": "60.060",
            "size": "33783808",
            "bit_rate": "4500000"
        }
    }"#;

    #[test]
    fn test_parse_ffprobe_json_success() {
        let path = Path::new("test_video.mp4");
        let media_info = parse_ffprobe_json(SAMPLE_FFPROBE_JSON, path, 33783808).unwrap();

        assert_eq!(media_info.width, 1920);
        assert_eq!(media_info.height, 1080);
        assert_eq!(media_info.video_codec.as_deref(), Some("h264"));
        assert_eq!(media_info.duration_ms, Some(60060));
        assert_eq!(media_info.frame_rate_numerator, Some(30000));
        assert_eq!(media_info.frame_rate_denominator, Some(1001));
        assert!(media_info.average_frame_rate.unwrap() > 29.97);
        assert_eq!(media_info.variable_frame_rate, Some(false));
        assert_eq!(media_info.audio_tracks.len(), 1);
        assert_eq!(media_info.audio_tracks[0].codec.as_deref(), Some("aac"));
        assert_eq!(media_info.audio_tracks[0].channels, Some(2));
        assert_eq!(media_info.subtitle_tracks.len(), 1);
        assert_eq!(media_info.subtitle_tracks[0].language.as_deref(), Some("spa"));
    }

    #[test]
    fn test_parse_fractional_rate_variants() {
        let (num, den, rate) = parse_fractional_rate("30000/1001");
        assert_eq!(num, Some(30000));
        assert_eq!(den, Some(1001));
        assert!((rate.unwrap() - 29.970029).abs() < 0.001);

        let (num, den, rate) = parse_fractional_rate("24/1");
        assert_eq!(num, Some(24));
        assert_eq!(den, Some(1));
        assert_eq!(rate, Some(24.0));

        let (num, den, rate) = parse_fractional_rate("0/0");
        assert_eq!(num, None);
        assert_eq!(den, None);
        assert_eq!(rate, None);
    }

    #[test]
    fn test_parse_ffprobe_missing_video_stream() {
        let audio_only_json = r#"{
            "streams": [
                {
                    "index": 0,
                    "codec_name": "mp3",
                    "codec_type": "audio"
                }
            ],
            "format": {
                "format_name": "mp3"
            }
        }"#;

        let res = parse_ffprobe_json(audio_only_json, Path::new("audio.mp3"), 1000);
        assert!(res.is_err());
        assert_eq!(res.unwrap_err().code, AppErrorCode::UnsupportedMedia);
    }

    #[test]
    fn test_parse_ffprobe_invalid_json() {
        let res = parse_ffprobe_json("not valid json", Path::new("bad.mp4"), 1000);
        assert!(res.is_err());
        assert_eq!(res.unwrap_err().code, AppErrorCode::UnsupportedMedia);
    }

    #[test]
    fn test_inspect_real_media_if_available() {
        let temp_clip = std::env::temp_dir().join("test_clip.mp4");
        if temp_clip.exists() {
            let res = inspect_media_file(&temp_clip.to_string_lossy());
            assert!(res.is_ok());
            let info = res.unwrap();
            assert_eq!(info.width, 1280);
            assert_eq!(info.height, 720);
            assert_eq!(info.video_codec.as_deref(), Some("h264"));
            assert!(!info.audio_tracks.is_empty());

            let thumb = generate_video_thumbnail(&temp_clip.to_string_lossy());
            assert!(thumb.is_ok());
            assert!(thumb.unwrap().starts_with("data:image/jpeg;base64,"));
        }
    }
}
