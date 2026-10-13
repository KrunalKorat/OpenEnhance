# Local API Contract (Tauri Commands and Events)

**Status:** Proposed contract v1.0. This is an internal frontend ↔ native-core API, not a remote HTTP API. No network API server is required.

## 1. Contract principles

- React invokes typed commands exposed by the Tauri Rust core.
- Rust validates every argument and owns path/process access.
- The frontend cannot invoke arbitrary binaries or provide raw command strings.
- Long-running work is started as a job and observed through events plus query commands.
- Payload fields use camelCase at the JS boundary; Rust types can use idiomatic snake_case internally with serialization attributes.
- Every command resolves with a typed payload or rejects with a stable error envelope.
- API version: `1` for this initial proposed contract.

## 2. Standard error envelope

```ts
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
  message: string;       // Safe, user-facing summary
  stage?: string;
  retryable: boolean;
  details?: Record<string, unknown>; // Sanitized; never raw secrets
  correlationId?: string;
}
```

Do not expose unbounded stderr or sensitive OS details in routine UI payloads. Full local logs can be opened/exported separately.

## 3. Core types

```ts
export type OutputPreset = '1080p' | '1440p' | '4k';
export type JobState =
  | 'queued' | 'preparing' | 'running' | 'cancelling'
  | 'cancelled' | 'succeeded' | 'failed';
export type JobStage =
  | 'validating' | 'probing' | 'preparing' | 'upscaling'
  | 'resizing' | 'encoding' | 'verifying' | 'cleanup';
export type FitMode = 'contain' | 'crop';
export type ContentProfile = 'general' | 'live-action' | 'anime' | 'animation';
export type QualityPreset = 'balanced' | 'high' | 'maximum';

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
  audioTracks: Array<{ index: number; codec?: string; language?: string; channels?: number }>;
  subtitleTracks: Array<{ index: number; codec?: string; language?: string }>;
}

export interface EnhancementSettings {
  outputPreset: OutputPreset;
  modelId: string;
  profile: ContentProfile;
  quality: QualityPreset;
  fitMode: FitMode;
  outputPath: string;
  outputContainer: 'mp4' | 'mkv';
  videoCodec: string;          // Must be checked against installed FFmpeg build
  qualityValue?: number;       // Defined per codec; do not treat as universal bitrate/CRF
  audioPolicy: 'preserve' | 'remove' | 'select';
  subtitlePolicy: 'preserve-supported' | 'remove' | 'select';
  preserveFrameRate: boolean;
  overwriteExisting: boolean;
}

export interface JobSummary {
  jobId: string;
  state: JobState;
  stage?: JobStage;
  progressPercent?: number;   // Omit when not defensible; never fake progress
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

export interface EngineCapabilities {
  engineId: string;
  engineVersion: string;
  available: boolean;
  platform: string;
  acceleration: 'vulkan' | 'cuda' | 'cpu' | 'unknown';
  deviceName?: string;
  models: Array<{ modelId: string; installed: boolean; verified: boolean; licenseUrl?: string }>;
  supportsCancellation: boolean;
  supportsProgress: boolean;
  supportedOperations: Array<'upscale' | 'interpolate' | 'denoise'>;
  warnings: string[];
}
```

## 4. Commands

### `get_app_info()`

Returns app version, API version, OS/architecture and storage schema version.

```ts
interface AppInfo {
  appVersion: string;
  apiVersion: 1;
  os: 'windows' | 'linux' | 'macos' | 'unknown';
  architecture: string;
  storageSchemaVersion: number;
}
```

### `get_system_capabilities()`

Detects installed engine(s), supported acceleration backend(s), device info where available, FFmpeg/FFprobe availability, and warnings. Capability detection must come from actual runtime probes, not hardcoded assumptions.

### `inspect_media({ path })`

Validates a user-selected path, probes media metadata, and returns `MediaInfo`. This command should not start AI processing.

### `estimate_job({ inputPath, settings })`

Returns a resource estimate. Be conservative; estimates may be unavailable.

```ts
interface JobEstimate {
  targetWidth: number;
  targetHeight: number;
  estimatedOutputBytes?: number;
  estimatedTemporaryBytes?: number;
  requiredFreeBytes?: number;
  estimatedDurationMs?: number;
  confidence: 'low' | 'medium' | 'high';
  warnings: string[];
}
```

### `list_models()`

Returns installed/available model records, including version, source, checksum status, license URL and disk size. The app must not report a model verified unless the checksum matches a trusted manifest.

### `create_job({ inputPath, settings })`

Validates the input, output destination, model/runtime, dimension plan, free disk space and option compatibility. Creates a queued job and returns `{ job: JobSummary }`. It must not mark a job running until the worker actually starts.

### `list_jobs({ includeCompleted, limit, cursor? })`

Returns local jobs ordered by newest update, with pagination if required.

### `get_job({ jobId })`

Returns current job state and the latest safe error details.

### `cancel_job({ jobId })`

Requests cancellation. Resolves when the cancellation request is accepted, not necessarily when the subprocess has terminated. Final `cancelled` state arrives via event/query. Reject if cancellation is unsupported or the job is already terminal.

### `pause_job({ jobId })`

Requests cooperative pausing of a running job at the next safe frame boundary or checkpoint.

### `resume_job({ jobId })`

Resumes a paused job from its validated checkpoint.

### `remove_job({ jobId })`

Deletes a non-active job entry from the persistent queue without modifying output files.

### `clear_completed_jobs()`

Removes completed and cancelled jobs from persistent storage while keeping all generated media intact.

### `start_queue()` / `pause_queue()`

Controls global queue processing worker execution.

### `recover_jobs({ action, jobId? })`

Executes startup crash recovery with action `'resume'`, `'restart'`, or `'discard'`.

### `open_output({ path })`

Opens a verified output file using the operating system's registered application. Restrict the action to user-selected/verified output paths and never pass arbitrary schemes to a shell.

### `reveal_in_folder({ path })`

Reveals an output in the platform's file manager after path validation.

### `get_preferences()` / `save_preferences({ preferences })`

Read/write versioned non-sensitive local preferences. Validate all values; never persist credentials or API keys because the MVP has no paid API integration.

### `export_diagnostics({ jobId? })`

Creates a local diagnostics bundle containing sanitized logs, app/engine versions, stage timings and error codes. Exclude video bytes, thumbnails, and full personal paths by default. Show the destination to the user.

## 5. Events

Suggested event names are stable strings; add/remove fields only with a documented API versioning decision.

### `job://updated`

```ts
interface JobUpdatedEvent { job: JobSummary }
```

Emitted when state, stage, progress, or error changes. Throttle high-frequency progress events to avoid overwhelming the UI.

### `job://log`

```ts
interface JobLogEvent {
  jobId: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  stage?: JobStage;
  message: string; // sanitized, bounded length
}
```

### `system://capabilities-changed`

Emitted when engine/model/device capability status changes, such as after a user installs a model or changes backend configuration.

### `model://download-progress` (optional future capability)

Only if explicit model downloading is implemented. Include model ID, received/total bytes where known, state, and verification result. Downloads must be user initiated and cancellable.

## 6. Resolution mapping

```ts
export const OUTPUT_DIMENSIONS = {
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4k':    { width: 3840, height: 2160 },
} as const;
```

The backend must recompute/validate the dimensions; never trust frontend constants as a security or correctness boundary. For non-16:9 input, `fitMode` determines contain/pad or crop behavior, but output dimensions remain exact.

## 7. Security contract

- Paths are selected/authorized through the native file picker or validated by Rust.
- Frontend does not invoke `Command.create()` with user-controlled executable names or arbitrary arguments.
- Sidecar allowlists and argument validators are configured narrowly.
- Do not expose a generic `run_command(command: string)` function.
- No remote API, token, credential, or telemetry endpoint is part of API v1.
- Process stdout/stderr parsing must cap payload sizes and sanitize control characters.

## 8. Versioning

- Any breaking command or event change requires an API version bump and updated `API.md`.
- Additive optional fields are preferred over changing existing field semantics.
- Write serialization/deserialization tests for all request/response DTOs.
- UI wrappers live in `src/lib/api`; no scattered raw `invoke()` calls across feature components.

## 9. Contract status

These types and commands are a design contract and must be implemented/adjusted against the actual Tauri version. This file does not claim that all handlers currently exist.
