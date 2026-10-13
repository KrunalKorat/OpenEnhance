# OpenEnhance

**OpenEnhance is a proposed working name for a local-first, open-source AI video upscaling and restoration desktop app.** It aims to let users choose 1080p, 1440p, or 4K output and process footage on their own computer without paid APIs or a cloud backend.

> Project status: documentation / planning stage. Do not assume all features, commands, engines, or platform builds are implemented yet.

## Product goals

- Local processing by default; no account required.
- Selectable output: 1920×1080, 2560×1440, 3840×2160.
- AI enhancement for general footage, live action, anime and animation profiles as compatible models become available.
- NVIDIA GPU acceleration where supported, with validated fallback behavior where feasible.
- A polished desktop interface, reliable job queue, clear progress and practical diagnostics.

## Planned stack

- Tauri 2 + Rust for the native desktop core.
- React + TypeScript + Vite for the UI.
- Tailwind CSS and accessible component primitives for styling.
- FFmpeg/FFprobe for media inspection, stream mapping and encoding.
- Real-ESRGAN ncnn-Vulkan as a candidate frame-level AI upscaler.
- Video2X as a candidate video orchestration engine; engine choice must be confirmed after license and platform review.

The project should isolate processing tools behind an adapter. A still-image upscaling binary does not, by itself, provide a complete video processing pipeline; frame extraction, timing, audio, subtitles, reassembly and validation need to be handled by a video orchestrator or by the application.

## Documentation

- [`PRD.md`](PRD.md) — product requirements and MVP acceptance criteria.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system boundaries, processing pipeline, jobs, storage and security.
- [`DESIGN.md`](DESIGN.md) — visual tokens, screens, components and accessibility.
- [`API.md`](API.md) — proposed typed local Tauri command/event contract.
- [`RULES.md`](RULES.md) — implementation rules for contributors and coding agents.
- [`MEMORY.md`](MEMORY.md) — durable project context and current decisions.
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) — add and maintain before redistributing dependencies/models.

## Requirements

Install current supported versions of:

- Node.js LTS and pnpm (or the one package manager chosen for the repository).
- Rust toolchain supported by the selected Tauri release.
- Tauri's platform prerequisites for Windows, Linux or macOS.
- FFmpeg/FFprobe for local development and pipeline tests.
- Vulkan runtime/driver for the chosen GPU-accelerated engine path.

See the official Tauri prerequisites for the exact platform dependencies: https://v2.tauri.app/start/prerequisites/

The engine and model versions must be pinned by the repository once validated. Do not silently download executables or models as part of a job.

## Development workflow

```bash
# 1. Install dependencies
npm install

# 2. Run frontend tests (Vitest)
npm test

# 3. Run linting and formatting checks
npm run lint
npm run format:check

# 4. Build the web distribution
npm run build

# 5. Run Rust core unit tests
cd src-tauri
cargo test
cd ..

# 6. Build desktop binary
cd src-tauri
cargo build
cd ..

# 7. Launch Tauri desktop app in development
npm run tauri dev
```

Do not run a processing job until the engine and model have passed a capability check and a short end-to-end smoke test.

## First MVP workflow

1. Import a supported sample video.
2. Inspect input metadata using FFprobe.
3. Select 1080p, 1440p or 4K.
4. Run the verified Real-ESRGAN/Vulkan or Video2X adapter locally.
5. Reassemble/encode through a license-reviewed FFmpeg build.
6. Validate exact dimensions, decodability, duration and audio behavior.
7. Compare output and source, then review the log for diagnostics.

## Privacy and security

- The primary workflow must work offline after required engines/models are installed.
- No account, remote upload, or telemetry by default.
- Model/engine downloads, if implemented, must be explicit and checksum-verified.
- Frontend code must never have unrestricted shell access.
- Never concatenate user input into shell command strings.
- Do not delete or overwrite a user's source file.

## Licensing

No project-level `LICENSE` file should be added until the owner confirms the license strategy and all bundled components have been audited. Video2X is AGPL-3.0. The Real-ESRGAN ncnn-Vulkan repository is MIT-licensed, but model assets/binaries need their own verification. FFmpeg obligations depend on the exact build and enabled components.

Primary references:

- Video2X: https://github.com/k4yt3x/video2x
- Real-ESRGAN ncnn-Vulkan: https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan
- Real-ESRGAN models: https://github.com/xinntao/Real-ESRGAN
- FFmpeg legal details: https://ffmpeg.org/legal.html
- Tauri security: https://v2.tauri.app/security/

A `THIRD_PARTY_NOTICES.md` must identify exact versions/commits, checksums, licenses, source locations, and required notices for every redistributed component and model.

## Contributing

Read `RULES.md` and `MEMORY.md` before coding. Every new feature needs acceptance criteria, tests where practical, error states, and documentation updates. Keep the main branch buildable.

## Project status

Early planning. The documentation describes intended behavior, not a claim that the application already exists or works. Track implemented features in issues/PRs and update this README as commands and supported platforms are verified.
