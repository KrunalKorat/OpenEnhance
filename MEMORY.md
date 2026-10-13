# Project Memory

This file stores durable project context for future contributors and coding agents. Update it when project decisions materially change. It is not a task log.

## Product identity

- Working name: **OpenEnhance**. Name is provisional; check availability/trademarks before public release.
- Product: free/open-source local-first desktop AI video enhancement and upscaling software.
- User-facing targets: 1080p (1920×1080), 1440p (2560×1440), and 4K (3840×2160).
- Core workflow: import → inspect → choose profile/resolution → process locally → validate → preview/export.
- No paid APIs, cloud processing dependency, account, subscription, or telemetry in the MVP.

## GitHub Repository & Distribution

- Repository URL: `https://github.com/KrunalKorat/OpenEnhance`
- Visibility: Public
- Primary branch: `master`
- Remote configuration: `origin https://github.com/KrunalKorat/OpenEnhance.git`
- Initial published commit SHA: `5b1fc9c`
- Authentication: GitHub CLI (`gh version 2.102.0`) authenticated as `KrunalKorat`.

## Target platforms and hardware

- Desired desktop platforms: Windows, Linux, macOS.
- Primary acceleration target: NVIDIA GPU, with Vulkan as the first backend candidate.
- Platform support must be validated separately; do not promise NVIDIA GPU acceleration on macOS.
- CPU fallback should be offered where a tested engine path exists, with clear performance warnings.

## Verified Toolchain & Environment

- OS: Windows 11 (x86_64)
- Node.js: `v24.19.0`
- Package manager: npm `11.17.0`
- Rust toolchain: rustc `1.98.1` / cargo `1.98.1`
- Tauri: Tauri 2 CLI `2.12.2` / core `2.12.3`
- GitHub CLI: `gh 2.102.0`
- Media tools: FFmpeg `N-125875-g5d4d3bdc61-20260731` and FFprobe on system PATH
- Vite development server: `http://localhost:1420/` (watch configuration excludes `**/src-tauri/**` to prevent Windows DLL lock conflicts)

## Current technical direction

- Desktop shell/core: Tauri 2 + Rust (`openenhance_lib`).
- Frontend: React 19 + TypeScript + Vite.
- Styling: Tailwind CSS configured with Design System tokens (`bg.canvas`, `bg.sidebar`, `bg.surface`, `bg.elevated`, `accent.primary`, `accent.secondary`, `status.success`, `status.warning`, `status.error`).
- Component library: Custom accessible primitives (`Card`, `Badge`, `Button`, `Modal`, `SegmentedControl`, `EmptyState`, `Toast`, `Sidebar`, `Header`).
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
- `README.md`: project summary, prerequisites, and developer workflow.
- `THIRD_PARTY_NOTICES.md`: license and model inventory.

## Phase Status Summary

- **Phase 1 — Repository Audit and Foundation:** COMPLETE & VERIFIED.
  - Rust core commands `get_app_info` and `get_system_capabilities` verified.
  - Passing: 6 Rust unit tests (`cargo test`).
  - Base TypeScript models and API client verified.
- **Phase 2 — Design System and UI Shell:** COMPLETE & VERIFIED.
  - Full design system tokens and responsive desktop layout.
  - Workspace / Enhancement Studio screen (`WorkspaceScreen.tsx`).
  - Video Import screen with interactive drop-zone and storage checks (`ImportScreen.tsx`).
  - Batch Queue screen with concurrency indicators and status badges (`QueueScreen.tsx`).
  - Enhancement History screen with file sizes, filters, and open-folder actions (`HistoryScreen.tsx`).
  - Settings screen with hardware diagnostics, storage preferences, and worker bounds (`SettingsScreen.tsx`).
  - Accessible modals (`Modal.tsx`, `KeyboardHelpDialog.tsx`, `AboutDialog.tsx`).
  - Toast notification system (`Toast.tsx`).
  - Passing: 17 Vitest tests across 7 test files (`npm test`).
  - Clean linting (`npm run lint`) and Prettier formatting (`npm run format:check`).
  - Web production build built cleanly in 3.12s (`npm run build`).
  - Desktop executable verified running via `npm run tauri dev`.

- **Phase 3 — Video Import and Metadata:** COMPLETE & VERIFIED.
  - Native file picker via `rfd` (Rust OS dialog) supporting multi-file selection with video format filters.
  - Drag-and-drop file ingestion supporting filesystem path resolution in desktop and webview contexts.
  - Safe FFprobe binary execution with argument vector (no shell interpolation).
  - Comprehensive metadata parsing: dimensions, duration, fractional frame rate (e.g. `30000/1001`), average/nominal fps, VFR detection, SAR/DAR, video codec, pixel format, audio tracks (channels, sample rate, codec, language), subtitle tracks, rotation, container, and file size.
  - Real thumbnail generation via FFmpeg with application-managed disk cache in `%TEMP%/openenhance_thumbnails/<sha256>.jpg` and base64 data URL delivery.
  - UI updates: `WorkspaceScreen` displays preview frame, resolution badges, duration, fps, bitrate, audio tracks, and stream specs. `ImportScreen` displays dropzone, native browse action, and recently inspected video items.
  - Automated tests: 27 Vitest tests across 8 test suites (`npm test`), 11 Rust tests (`cargo test` including real media integration test with FFprobe and FFmpeg).
  - Quality assurance: ESLint 0 warnings, Prettier check clean, Vite production bundle build clean (`npm run build`).

- **Phase 4 — AI Engine Integration:** COMPLETE & VERIFIED.
  - Upstream `xinntao/Real-ESRGAN` ncnn-Vulkan binary (`20220424-windows`, SHA-256: `ABC02804E17982A3BE33675E4D471E91EA374E65B70167ABC09E31ACB412802D`) provisioned into `%LOCALAPPDATA%\OpenEnhance\engine` (outside Git tracking).
  - Hardware & Vulkan diagnostics: Enumerated devices via `vulkaninfo`. Detected `GPU 0: Intel UHD Graphics` and `GPU 1: NVIDIA GeForce RTX 3050 Laptop GPU`. Discrete NVIDIA GPU explicitly prioritized for hardware tensor/CUDA core Vulkan inference (`-g 1`).
  - Real-ESRGAN adapter implemented in `src-tauri/src/engines/realesrgan.rs`: safe process execution with argument vector, model verification, single frame inference, directory batch upscaling, and structured status reporting.
  - Verified real inference smoke test: real test image upscaled with `realesrgan-x4plus` model on NVIDIA RTX 3050 in under 2 seconds.

- **Phase 5 — Resolution & Export Controls:** COMPLETE & VERIFIED.
  - Resolution Planner (`src-tauri/src/pipeline/resolution.rs`): supports exact 1080p (`1920×1080`), 1440p (`2560×1440`), and 4K (`3840×2160`) targets with `contain` (letterbox pad) and `crop` (center crop) aspect ratio strategies. Downscales when input exceeds target resolution.
  - Video Enhancement Pipeline (`src-tauri/src/pipeline/export.rs`): managed workspaces in `%LOCALAPPDATA%\OpenEnhance\temp\<job_id>`, frame extraction via FFmpeg, genuine AI frame upscaling via `RealEsrganAdapter`, reassembly into MP4/MKV with documented CRF quality presets (`maximum`: CRF 16, `high`: CRF 20, `balanced`: CRF 23), audio preservation by default, and subtitle stream mapping.
  - Output validation: strict FFprobe inspection checking file existence, non-zero size, decodable media streams, exact target width and height, duration, and audio stream presence.
  - Desktop integration: `open_output` launches system default media player, `reveal_in_folder` highlights file in Windows Explorer.
  - UI integration: `WorkspaceScreen.tsx` displays live enhancement progress overlay with stage reporting and NVIDIA RTX Vulkan badge, and displays verified output card on completion. `HistoryScreen.tsx` supports Play and Show in Folder.
  - Verification suite: 24 Rust unit and end-to-end integration tests passing (`cargo test`), 32 Vitest frontend tests passing (`npm test`), 0 ESLint warnings, Prettier check clean, Vite production build clean.

## Exact Next Phase

Phase 6 — Job Queue & Reliability.
- Persistent SQLite / JSON local job queue and state store.
- Batch scheduling, pause/resume, concurrency bounds, and crash recovery.
- Resumable frame processing checkpoints for long-running video tasks.

Stop after Phase 5. Phase 6 begins only on explicit user instruction.


