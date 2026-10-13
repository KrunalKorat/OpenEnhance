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

- Desktop shell/core: Tauri 2 + Rust (`openenhance_lib`).
- Frontend: React 19 + TypeScript + Vite.
- Package manager: npm (tested and verified on Windows development environment).
- Styling: Tailwind CSS configured with Design System tokens (`bg.canvas`, `bg.surface`, `accent.primary`, etc.).
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
- `THIRD_PARTY_NOTICES.md`: license and model inventory.

## Current stage

Phase 1 Complete (Repository Audit and Foundation).
- Tauri 2 + Rust desktop core initialized and verified (`get_app_info`, `get_system_capabilities`).
- React 19 + TypeScript + Vite frontend configured with Tailwind CSS design tokens.
- Folder structure established per `ARCHITECTURE.md`.
- Tests passing: 6 Rust unit tests (`cargo test`), 11 Vitest frontend tests (`npm test`).
- Formatting (`prettier`) and linting (`eslint --max-warnings 0`) configured and enforced.
- Development build confirmed: `npm run build` and `cargo build` pass cleanly.
- Application executable built at `src-tauri/target/debug/openenhance.exe`.

## Exact Next Phase

Phase 2 — Design System and UI Shell.
- Implement full design tokens, typography, spacing, surfaces, borders, and animations from `DESIGN.md`.
- Build application shell and complete navigation.
- Implement workspace, import screen, settings screen, queue screen, and history screen.
- Implement responsive layouts, dialogs, notifications, loading states, empty states, and error states.
- Ensure no major UI interactions are inert, while enhancement execution remains deferred to Phase 4.

## Decisions pending

- Final product name.
- Project license.
- Whether Video2X is included as an orchestrator or the app owns frame orchestration around a frame-level engine.
- Whether models are bundled or downloaded on demand.
- Exact pinned engine/model versions, checksums, platform matrix, FFmpeg build and codecs.
- Minimum GPU memory and supported driver requirements.
