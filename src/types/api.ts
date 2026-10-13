export type AppErrorCode =
  | 'INVALID_ARGUMENT'
  | 'PATH_NOT_ALLOWED'
  | 'INPUT_UNREADABLE'
  | 'UNSUPPORTED_MEDIA'
  | 'ENGINE_MISSING'
  | 'ENGINE_UNAVAILABLE'
  | 'MODEL_MISSING'
  | 'MODEL_UNVERIFIED'
  | 'GPU_UNAVAILABLE'
  | 'GPU_OUT_OF_MEMORY'
  | 'INSUFFICIENT_DISK_SPACE'
  | 'JOB_NOT_FOUND'
  | 'JOB_STATE_INVALID'
  | 'PROCESS_START_FAILED'
  | 'PROCESS_CANCELLED'
  | 'ENCODE_FAILED'
  | 'OUTPUT_VALIDATION_FAILED'
  | 'PERMISSION_DENIED'
  | 'IO_ERROR'
  | 'INTERNAL_ERROR';

export interface AppError {
  code: AppErrorCode;
  message: string;
  stage?: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  correlationId?: string;
}

export type OutputPreset = '1080p' | '1440p' | '4k';
export type JobState =
  | 'queued'
  | 'preparing'
  | 'running'
  | 'cancelling'
  | 'cancelled'
  | 'succeeded'
  | 'failed';
export type JobStage =
  | 'validating'
  | 'probing'
  | 'preparing'
  | 'upscaling'
  | 'resizing'
  | 'encoding'
  | 'verifying'
  | 'cleanup';
export type FitMode = 'contain' | 'crop';
export type ContentProfile = 'general' | 'live-action' | 'anime' | 'animation';
export type QualityPreset = 'balanced' | 'high' | 'maximum';

export interface AppInfo {
  appVersion: string;
  apiVersion: number;
  os: 'windows' | 'linux' | 'macos' | 'unknown';
  architecture: string;
  storageSchemaVersion: number;
}

export interface ModelCapability {
  modelId: string;
  installed: boolean;
  verified: boolean;
  licenseUrl?: string;
}

export interface EngineCapabilities {
  engineId: string;
  engineVersion: string;
  available: boolean;
  platform: string;
  acceleration: 'vulkan' | 'cuda' | 'cpu' | 'unknown';
  deviceName?: string;
  models: ModelCapability[];
  supportsCancellation: boolean;
  supportsProgress: boolean;
  supportedOperations: Array<'upscale' | 'interpolate' | 'denoise'>;
  warnings: string[];
}

export interface SystemCapabilities {
  os: string;
  architecture: string;
  ffmpegAvailable: boolean;
  ffmpegVersion?: string;
  ffprobeAvailable: boolean;
  ffprobeVersion?: string;
  vulkanAvailable: boolean;
  vulkanDevice?: string;
  engines: EngineCapabilities[];
  warnings: string[];
}

export const OUTPUT_DIMENSIONS = {
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
} as const;
