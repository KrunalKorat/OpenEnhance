import type {
  AppError,
  ContentProfile,
  FitMode,
  JobStage,
  JobState,
  OutputPreset,
  QualityPreset,
} from './api';

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
  state: JobState;
  stage?: JobStage;
  progressPercent?: number;
  progressMode: 'determinate' | 'indeterminate';
  currentFile?: string;
  inputPath: string;
  outputPath: string;
  sourceWidth?: number;
  sourceHeight?: number;
  targetWidth: number;
  targetHeight: number;
  startedAt?: string;
  updatedAt: string;
  elapsedMs?: number;
  estimatedRemainingMs?: number;
  attempt: number;
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
