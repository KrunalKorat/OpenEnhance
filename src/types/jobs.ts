import type {
  AppError,
  ContentProfile,
  FitMode,
  JobStage,
  JobState,
  OutputPreset,
  QualityPreset,
} from './api';

export type RecoverAction = 'resume' | 'restart' | 'retry' | 'discard';

export interface CreateJobRequest {
  inputPath: string;
  outputPath: string;
  outputPreset?: string;
  resolutionPreset?: string;
  modelId?: string;
  model?: string;
  qualityPreset?: string;
  fitMode?: string;
  container?: string;
  audioPolicy?: string;
  subtitlePolicy?: string;
  targetWidth?: number;
  targetHeight?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  fileName?: string;
  inputWidth?: number;
  inputHeight?: number;
  fps?: number;
  durationSecs?: number;
  encoder?: string;
}

export interface EnhancementSettings {
  outputPreset: OutputPreset;
  modelId: string;
  profile: ContentProfile;
  quality: QualityPreset;
  fitMode: FitMode;
  outputPath: string;
  outputContainer: 'mp4' | 'mkv';
  videoCodec: string;
  qualityValue?: number;
  audioPolicy: 'preserve' | 'remove' | 'select';
  subtitlePolicy: 'preserve-supported' | 'remove' | 'select';
  preserveFrameRate: boolean;
  overwriteExisting: boolean;
}

export interface JobSummary {
  jobId: string;
  id: string;
  state: JobState;
  stage?: JobStage | string;
  progressPercent: number;
  progressMode: 'determinate' | 'indeterminate';
  currentFile?: string;
  fileName: string;
  inputPath: string;
  outputPath: string;
  outputPreset: string;
  resolutionPreset: string;
  model: string;
  modelId: string;
  sourceWidth?: number;
  sourceHeight?: number;
  inputWidth?: number;
  inputHeight?: number;
  targetWidth: number;
  targetHeight: number;
  startedAt?: string;
  createdAt?: string;
  completedAt?: string;
  updatedAt: string;
  elapsedMs?: number;
  estimatedRemainingMs?: number;
  attempt: number;
  processedFrames?: number;
  totalFrames?: number;
  fps?: number;
  errorMessage?: string;
  errorCode?: string;
  isRecoverable: boolean;
  canRecover: boolean;
  error?: AppError;
}

export interface JobEstimate {
  targetWidth: number;
  targetHeight: number;
  estimatedOutputBytes?: number;
  estimatedTemporaryBytes?: number;
  requiredFreeBytes?: number;
  estimatedDurationMs?: number;
  confidence: 'low' | 'medium' | 'high';
  warnings: string[];
}
