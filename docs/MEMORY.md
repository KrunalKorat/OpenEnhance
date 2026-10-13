# Project Memory

This file stores durable project context for future contributors and coding agents. Update it when project decisions materially change. It is not a task log.

## Product identity

- Working name: **OpenEnhance**. Name is provisional; check availability/trademarks before public release.
- Product: free/open-source local-first desktop AI video enhancement and upscaling software.
- User-facing targets: 1080p (1920×1080), 1440p (2560×1440), and 4K (3840×2160).
- Core workflow: import → inspect → choose profile/resolution → process locally → validate → preview/export.
- No paid APIs, cloud processing dependency, account, subscription, or telemetry in the MVP.

## Target platforms and hardware

- Desired desktop platforms: Windows, Linux, macOS.
- Primary acceleration target: NVIDIA GPU, with Vulkan as the first backend candidate.
- Platform support must be validated separately; do not promise NVIDIA GPU acceleration on macOS.
- CPU fallback should be offered where a tested engine path exists, with clear performance warnings.

## Current technical direction

- Desktop shell/core: Tauri 2 + Rust.
- Frontend: React + TypeScript + Vite.
- Styling: Tailwind CSS plus accessible component primitives.
- Media metadata/export: FFprobe and FFmpeg.
- Candidate upscaler: Real-ESRGAN ncnn-Vulkan.
- Candidate whole-video orchestration: Video2X.
- Keep all inference/orchestration details behind an engine adapter.
- Do not assume a frame/image upscaler can directly process video; frame extraction, timestamps, audio/subtitle mapping, reassembly and output validation must be handled.
- Keep inference outside the frontend thread; use bounded queues and temporary storage.

## Non-negotiable product rules

1. The selected target dimensions must be checked against the actual exported file.
2. Preserve aspect ratio by default; cropping/padding must be explicit.
3. Preserve audio and subtitles where the pipeline supports them and disclose unsupported cases.
4. Do not silently change frame rate or enable interpolation.
5. Progress, GPU status and export success must be real, not simulated.
6. No network upload or telemetry by default.
7. Frontend must not have unrestricted process/shell access.
8. Never overwrite or delete source video.
9. Downloaded executables/models require explicit action and verification.
10. Clearly distinguish planned features from tested features.

## Licensing posture

- Project license has not been finalized.
- Video2X repository is AGPL-3.0; assess implications before integrating/bundling.
- Real-ESRGAN-ncnn-Vulkan source repository is MIT-licensed; verify model weights and distributed binaries separately.
- FFmpeg license obligations depend on build configuration and enabled components.
- Maintain exact versions, checksums, attribution and notices in `THIRD_PARTY_NOTICES.md`.
- No legal conclusion should be inferred from this summary; re-check exact release artifacts.

## Documentation map

- `PRD.md`: requirements, priorities and acceptance criteria.
- `ARCHITECTURE.md`: boundaries, adapters, pipeline and security.
- `DESIGN.md`: UI patterns, tokens and accessibility.
- `API.md`: local command/event contract.
- `RULES.md`: implementation and release standards.
- `README.md`: project summary and developer workflow.

## Current stage

Planning/specification stage. The documents are proposals, not evidence that a codebase, installer, engine integration or end-to-end workflow already exists.

## Decisions pending

- Final product name.
- Project license.
- Whether Video2X is included as an orchestrator or the app owns frame orchestration around a frame-level engine.
- Whether models are bundled or downloaded on demand.
- Exact pinned engine/model versions, checksums, platform matrix, FFmpeg build and codecs.
- Minimum GPU memory and supported driver requirements.

## How to update this file

Only add durable decisions, verified technical facts, and major current constraints. Do not add credentials, secrets, personal information, raw logs, ephemeral bug notes, or speculative claims. Include the related PR/issue and date for meaningful decision changes when the repository begins tracking them.
