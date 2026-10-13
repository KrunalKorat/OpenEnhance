import { invoke } from '@tauri-apps/api/core';
import type { AppError, AppInfo, SystemCapabilities } from '@/types/api';

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
