export interface AudioTrackInfo {
  index: number;
  codec?: string;
  language?: string;
  channels?: number;
  sampleRate?: number;
}

export interface SubtitleTrackInfo {
  index: number;
  codec?: string;
  language?: string;
  title?: string;
}

export interface MediaInfo {
  path: string;
  fileName: string;
  container?: string;
  durationMs?: number;
  width: number;
  height: number;
  frameRateNumerator?: number;
  frameRateDenominator?: number;
  averageFrameRate?: number;
  variableFrameRate?: boolean;
  videoCodec?: string;
  pixelFormat?: string;
  bitrate?: number;
  fileSizeBytes: number;
  displayAspectRatio?: string;
  sampleAspectRatio?: string;
  frameCount?: number;
  rotation?: number;
  audioTracks: AudioTrackInfo[];
  subtitleTracks: SubtitleTrackInfo[];
  thumbnailUrl?: string;
}
