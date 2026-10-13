# Product Requirements Document (PRD)

**Project:** OpenEnhance *(working name; perform name/trademark checks before public release)*  
**Document status:** Initial specification v0.1  
**Product type:** Open-source local-first desktop application  
**Primary outcome:** Let users enhance and upscale video on their own computer without paid APIs or a cloud backend.

## 1. Product summary

OpenEnhance is a desktop video restoration and upscaling application for Windows, Linux, and macOS. Users import video, select an output resolution (1080p, 1440p, or 4K), choose an enhancement profile, process the video locally, compare results, and export the finished file.

The product prioritizes visual quality over raw speed. It must use real processing engines and real progress information; the application must never simulate enhancement, progress, GPU support, or completion.

## 2. Problem statement

Many video enhancement applications are paid, rely on cloud processing, impose quotas, or expose a technical interface that is difficult for casual users. OpenEnhance aims to provide a clear desktop workflow backed by open-source tools, without requiring a hosted account or a paid API key.

## 3. Goals

1. Provide a polished desktop user experience for video upscaling and restoration.
2. Support selectable output dimensions of 1920×1080, 2560×1440, and 3840×2160.
3. Run processing locally using installed or bundled open-source engines and models.
4. Prioritize NVIDIA GPU acceleration where supported, with clear capability detection and a fallback path where feasible.
5. Support live-action footage, anime, animation, and general video through configurable profiles.
6. Preserve audio, aspect ratio, frame rate, and subtitle tracks where the selected pipeline can do so reliably.
7. Provide transparent job state, actual progress, actionable errors, and reproducible diagnostics.
8. Keep source videos on the user's machine by default.
9. Publish build instructions, third-party notices, model provenance, and license information.

## 4. Non-goals for MVP

- Cloud processing, user accounts, subscriptions, payment processing, analytics, or remote video upload.
- Training new AI models from scratch.
- Guaranteeing that AI reconstructs real detail missing from the source.
- Real-time preview at full 4K on all hardware.
- Guaranteed hardware acceleration on every GPU, driver, OS, or virtual machine.
- A timeline editor intended to replace a full nonlinear video editor.
- DRM bypass or removal of protections from media the user is not authorized to process.

## 5. Target users

- Creators restoring older or compressed footage.
- Gamers enhancing gameplay recordings.
- Anime and animation viewers.
- Hobbyists who prefer offline tools and open-source software.
- Technical users who want model and export controls without managing a complex CLI.

## 6. Primary user journey

1. User launches the app. The app displays detected capabilities and any missing optional components.
2. User imports one or more video files using a file picker or drag-and-drop.
3. The app inspects each input using metadata tools and displays source dimensions, duration, frame rate, audio, and estimated output requirements.
4. User selects a target resolution (1080p, 1440p, or 4K), content profile, enhancement model, quality preset, output codec, and destination.
5. The app validates the configuration, available disk space, model availability, and supported GPU/driver path.
6. The user starts a job. The application shows real job state, current stage, progress when measurable, elapsed time, and an ETA only when enough information exists.
7. On completion, the app verifies the output file and offers preview, comparison, open-folder, and retry options.

## 7. Functional requirements

### P0 — required for first usable release

- Import video through file picker and drag-and-drop.
- Inspect file metadata and reject unsupported or malformed inputs with readable errors.
- Choose exact target output dimensions: 1920×1080, 2560×1440, 3840×2160.
- Support aspect-ratio preservation with letterboxing/pillarboxing or an explicitly configured crop; never stretch silently.
- Provide at least one working AI profile using a verified model and engine.
- Run local frame/video processing and final encoding with no paid service.
- Preserve source audio by default when technically supported; explicitly communicate if audio/subtitles cannot be preserved.
- Show job states: queued, preparing, running, cancelling, cancelled, succeeded, failed.
- Show true progress from engine/encoder telemetry where available; use indeterminate progress otherwise.
- Allow cancellation, safe retry, and selection of output directory.
- Keep the UI responsive while processing.
- Check paths, free disk space, model files, and engine availability before starting.
- Include logs that can be copied or exported, with sensitive local paths redacted in shareable diagnostics by default.

### P1 — target after end-to-end pipeline is stable

- Multi-file queue with configurable bounded concurrency.
- Before/after preview with synchronized playback where feasible.
- Job history and saved preferences using local storage.
- Real-CUGAN or another license-reviewed animation profile.
- Hardware/performance settings and model manager.
- Output codec/quality controls (for example H.264/H.265/AV1 only when the encoder is available and license-reviewed).
- Resume/recover interrupted jobs when the intermediate format and job state permit it.

### P2 — optional later features

- RIFE or another validated frame interpolation engine.
- Batch presets and watched folders (opt-in only).
- Advanced noise reduction, deblocking, color controls, and sharpening stages.
- Optional portable build with model downloads initiated explicitly by the user.

## 8. Output resolution and image quality rules

- The chosen output dimensions are the final authority; an AI model's native scaling factor must not override the requested dimensions.
- If the model produces a larger intermediate, resize to the exact target dimensions using a documented high-quality resampling filter.
- Default behavior preserves aspect ratio. Any crop or padding is shown to the user before processing.
- If the source already exceeds the selected target, downscale it; do not run AI upscaling by default unless the user explicitly requests a restoration pass.
- Do not label an output “true 4K detail” or promise detail recovery. Upscaling increases pixel dimensions, while perceived improvements depend on source quality, model, and hardware.
- Preserve source frame rate by default. Frame interpolation is a separate optional feature and must not be silently enabled.

## 9. Supported formats

The actual supported formats depend on the packaged FFmpeg build. The UI may advertise formats only after capability detection. Common desired inputs include MP4, MOV, MKV, WebM, and common audio/subtitle streams. Desired outputs include MP4 and MKV. Format claims must be validated against the actual build configuration and legal obligations.

## 10. Performance and reliability targets

- UI remains interactive during media inspection and processing.
- Memory use is bounded through controlled frame/stream queues and temporary storage; avoid loading an entire video into RAM.
- Never begin a large job without checking estimated temporary disk demand where the estimate is possible.
- ETA is hidden or labeled “estimating” when telemetry is insufficient.
- Failures include the stage, safe diagnostic details, and a suggested next action.
- Quality and speed are benchmarked on a small reproducible corpus across representative GPUs and OSes before release claims are made.

No universal processing-speed target is promised for MVP; AI 4K processing is highly hardware- and model-dependent.

## 11. Privacy and security

- No account, telemetry, or remote upload in MVP.
- Media paths and thumbnails stay local.
- Network access is limited to explicitly triggered model/engine downloads and update checks only if added later; downloads require visible consent.
- Frontend code must not receive unrestricted shell/process execution.
- Native commands validate all user paths and all process arguments; invoke executables without shell-string concatenation.
- Use least-privilege Tauri capabilities and scoped sidecar permissions.
- Never auto-delete source files. Temporary data may be removed only when safe and documented.

## 12. Accessibility and UX

- Keyboard-accessible controls, visible focus states, semantic labels, and sufficient contrast.
- Status uses text/icons as well as color.
- Respect reduced-motion preferences.
- Display unit labels and dimensions unambiguously.
- Errors should be concise, actionable, and copyable.

## 13. Licensing and distribution

The application is intended to be open source. The final project license is not considered locked until dependency and bundling review is complete. Video2X is AGPL-3.0; Real-ESRGAN-ncnn-vulkan source is MIT-licensed, while model assets and bundled binaries must be checked individually. FFmpeg license obligations depend on the exact build and enabled components. Do not redistribute a binary or model until its license, notices, source obligations, and redistribution rights are recorded in `THIRD_PARTY_NOTICES.md`.

Official references:
- Video2X: https://github.com/k4yt3x/video2x
- Real-ESRGAN ncnn Vulkan: https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan
- Real-ESRGAN: https://github.com/xinntao/Real-ESRGAN
- FFmpeg license information: https://ffmpeg.org/legal.html
- Tauri security: https://v2.tauri.app/security/

This section is an engineering checklist, not legal advice.

## 14. MVP acceptance criteria

MVP is accepted only when all are true:

- A clean installation launches without a developer environment.
- A user can import a supported clip and see valid metadata.
- A real AI engine processes an input clip locally.
- The user can export exact 1080p, 1440p, or 4K dimensions.
- Output plays correctly and audio is preserved when supported by the chosen pipeline.
- The app reports accurate job state and useful errors.
- Processing does not freeze the UI or require a network connection after required dependencies/models are installed.
- All shipped executable/model/license notices have been reviewed.
- Clean build and smoke tests pass on each OS claimed as supported.

## 15. Open decisions

- Final product name and trademark check.
- Project-level license after engine integration decision.
- Initial engine strategy: Video2X as orchestrator versus a custom frame pipeline around ncnn-vulkan. Keep this behind an adapter.
- Whether models are bundled or user-downloaded on first use.
- Exact FFmpeg build and codecs.
- Minimum OS versions, GPU memory guidance, and supported driver matrix.
- Whether installers include engines by default or offer an optional component download.
