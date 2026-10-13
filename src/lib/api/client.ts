import { invoke } from '@tauri-apps/api/core';
import type { AppError, AppInfo, SystemCapabilities } from '@/types/api';
import type { MediaInfo } from '@/types/media';

/**
 * Checks if the current execution context is within the Tauri desktop runtime.
 */
export function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
  );
}

/**
 * Normalizes any error thrown by IPC into a typed AppError.
 */
export function normalizeAppError(error: unknown): AppError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  ) {
    return error as AppError;
  }
  return {
    code: 'INTERNAL_ERROR',
    message:
      typeof error === 'string'
        ? error
        : ((error as Error)?.message ?? 'An unknown error occurred'),
    retryable: false,
  };
}

/**
 * Retrieves core application and runtime metadata.
 */
export async function getAppInfo(): Promise<AppInfo> {
  if (!isTauriEnvironment()) {
    return {
      appVersion: '0.1.0-dev',
      apiVersion: 1,
      os: 'windows',
      architecture: 'x86_64',
      storageSchemaVersion: 1,
    };
  }

  try {
    return await invoke<AppInfo>('get_app_info');
  } catch (error) {
    throw normalizeAppError(error);
  }
}

/**
 * Probes local system capabilities including FFmpeg, FFprobe, and Vulkan GPU acceleration.
 */
export async function getSystemCapabilities(): Promise<SystemCapabilities> {
  if (!isTauriEnvironment()) {
    return {
      os: 'windows',
      architecture: 'x86_64',
      ffmpegAvailable: true,
      ffmpegVersion: 'ffmpeg version (dev mock)',
      ffprobeAvailable: true,
      ffprobeVersion: 'ffprobe version (dev mock)',
      vulkanAvailable: true,
      vulkanDevice: 'Vulkan GPU (dev mock)',
      engines: [
        {
          engineId: 'realesrgan-ncnn-vulkan',
          engineVersion: 'candidate-adapter',
          available: true,
          platform: 'windows',
          acceleration: 'vulkan',
          deviceName: 'NVIDIA GeForce RTX (dev mock)',
          models: [
            {
              modelId: 'realesrgan-x4plus',
              installed: false,
              verified: false,
              licenseUrl: 'https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE',
            },
          ],
          supportsCancellation: true,
          supportsProgress: true,
          supportedOperations: ['upscale'],
          warnings: [],
        },
      ],
      warnings: [],
    };
  }

  try {
    return await invoke<SystemCapabilities>('get_system_capabilities');
  } catch (error) {
    throw normalizeAppError(error);
  }
}

/**
 * Inspects a video file using FFprobe via Rust backend.
 */
export async function inspectMedia(path: string): Promise<MediaInfo> {
  if (!isTauriEnvironment()) {
    return {
      path,
      fileName: path.split(/[/\\]/).pop() ?? 'sample.mp4',
      container: 'mov,mp4,m4a,3gp,3g2,mj2',
      durationMs: 45000,
      width: 1920,
      height: 1080,
      frameRateNumerator: 30000,
      frameRateDenominator: 1001,
      averageFrameRate: 29.97,
      variableFrameRate: false,
      videoCodec: 'h264',
      pixelFormat: 'yuv420p',
      bitrate: 4500000,
      fileSizeBytes: 25300000,
      displayAspectRatio: '16:9',
      sampleAspectRatio: '1:1',
      frameCount: 1350,
      rotation: 0,
      audioTracks: [
        { index: 1, codec: 'aac', language: 'eng', channels: 2, sampleRate: 48000 },
      ],
      subtitleTracks: [],
    };
  }

  try {
    return await invoke<MediaInfo>('inspect_media', { path });
  } catch (error) {
    throw normalizeAppError(error);
  }
}

/**
 * Generates or retrieves a cached representative video thumbnail via FFmpeg.
 */
export async function generateThumbnail(path: string): Promise<string> {
  if (!isTauriEnvironment()) {
    // Return SVG data URL fallback in test/mock environment
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="%231a202b"/><text x="50%" y="50%" fill="%237c8cff" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20">Video Preview</text></svg>';
  }

  try {
    return await invoke<string>('generate_thumbnail', { path });
  } catch (error) {
    throw normalizeAppError(error);
  }
}

/**
 * Opens native OS file picker to choose one or more video files.
 */
export async function pickVideoFiles(): Promise<string[]> {
  if (!isTauriEnvironment()) {
    return ['C:\\Videos\\demo_sample.mp4'];
  }

  try {
    return await invoke<string[]>('pick_video_files');
  } catch (error) {
    throw normalizeAppError(error);
  }
}
