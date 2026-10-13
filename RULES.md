# Project Rules for Contributors and Coding Agents

These rules are mandatory unless a maintainer explicitly changes them.

## 1. Source of truth

- Read `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `API.md`, and `MEMORY.md` before making cross-cutting changes.
- Do not treat proposed functionality as implemented unless code and tests prove it.
- If an implementation decision changes, update the relevant documentation in the same change.
- Do not ask the user to restate information already present in the repository docs.

## 2. Phase discipline

- Implement one planned phase at a time unless explicitly instructed otherwise.
- Before starting a phase, inspect the repository and report existing state internally in the task notes; do not overwrite working code blindly.
- After a phase, run the relevant tests/build and provide a precise summary of changed files, checks run, failures, and remaining work.
- Never claim a phase is complete if core acceptance criteria remain unverified.
- Do not fabricate progress to satisfy a requested phase count. If a capability depends on external hardware or a driver that is unavailable, state the limitation and provide a repeatable manual validation step.

## 3. Code quality

- Use TypeScript strict mode and typed Rust APIs.
- Avoid `any`, unchecked casts, global mutable state, and duplicate sources of truth unless justified and documented.
- Prefer small modules with explicit responsibility and stable interfaces.
- Keep UI components focused; separate rendering, application state, native commands and processing orchestration.
- Do not add an abstraction without a concrete use case, but keep the AI engine behind an adapter interface.
- Pin dependencies and external tool versions. Avoid floating versions in release builds.
- Do not suppress compiler/linter warnings globally to make builds pass.
- Never leave merge-conflict markers, commented-out broken code, fake implementations, or empty click handlers in the finished phase.

## 4. UI and design

- Follow `DESIGN.md` tokens and interaction patterns.
- Every control must work, or be disabled with a visible explanation.
- Never use fake progress, fake GPU status, fake benchmark results, fake media details, or a simulated successful export in production paths.
- Use realistic fixtures only in explicitly labeled demos and tests.
- Include loading, empty, error, cancellation and success states for async workflows.
- Keep long jobs off the UI thread and test keyboard navigation, focus, contrast, resizing and reduced motion.

## 5. Video correctness

- A selected output resolution must be validated against the exported file after processing.
- Preserve aspect ratio unless the user explicitly selects crop or stretch; never stretch silently.
- Preserve audio and subtitle streams by default when supported. If preservation is not supported, disclose the behavior before processing.
- Preserve frame timing unless a user opts into interpolation or a necessary transformation is explicitly communicated.
- Do not treat an image upscaler as a complete video engine without frame extraction, order/timestamp management, audio mapping, reassembly and validation.
- Never promise that AI can recreate authentic detail not present in a source.
- Use temporary directories and bounded queues; never decode an entire long video into memory.
- Validate output existence, file size, decodability, expected dimensions and duration before marking the job successful.

## 6. Process and filesystem security

- All file/process operations go through Rust commands with typed arguments.
- Do not expose unrestricted shell/process APIs to React.
- Never build shell command strings from user-supplied paths or options. Use argument arrays and a narrow executable allowlist.
- Validate paths and enforce safe temp/output handling. Avoid path traversal and symlink surprises.
- Do not overwrite source files. Avoid overwriting output files without an explicit user decision.
- Do not automatically delete source files or user-selected outputs.
- Keep Tauri permissions least-privilege and review capability files after adding plugins.
- Treat media metadata, filenames, stderr and downloaded model metadata as untrusted input.

## 7. Network and privacy

- Core workflow must not require a backend, account, analytics, or paid API.
- Network access may be used only for explicitly initiated model/engine downloads or optional update checks approved by the maintainer.
- Verify downloaded artifacts with a trusted checksum/signature where available; never execute unverified downloads.
- No telemetry by default. Any future telemetry requires a separate privacy decision and explicit disclosure/consent.
- Shareable diagnostics should redact local user directory names and never include video frames.

## 8. AI model and dependency governance

- Record model name, publisher, exact version/revision, source URL, checksum, license and redistribution status.
- Do not ship a model until its weight license and training/data usage terms have been reviewed sufficiently for the intended distribution.
- Record each bundled executable and its source commit/version and license.
- Maintain `THIRD_PARTY_NOTICES.md` and comply with source/notices obligations.
- Verify FFmpeg's exact build flags and license before redistribution.
- Do not assume a repository's code license automatically covers model weights, datasets, logos or downloaded assets.

## 9. Testing gates

- Add tests for path validation, job state transitions, resolution planning and error mapping.
- Test success, failure, cancellation and retry flows.
- Use tiny local fixtures for deterministic CI checks; keep large benchmarks separate.
- Test on each OS before claiming that OS is supported.
- Run formatter, linter, typecheck, unit tests and build for the changed surface.
- State exactly which checks ran and which require hardware/manual validation.

## 10. Change and release management

- Keep changes scoped. Do not rewrite unrelated working components.
- Preserve existing public API contracts unless migration is included.
- Update `API.md` when commands, events, data types or error codes change.
- Update `MEMORY.md` only with durable project decisions/current facts; do not store secrets, credentials, personal file paths or transient logs.
- Add release notes and known issues for externally visible changes.
- Do not tag or publish a release until license notices, checksums, platform smoke tests and clean-install testing pass.

## 11. Honest reporting

Every handoff must distinguish:
- Implemented and tested.
- Implemented but not tested on required hardware/platform.
- Planned, stubbed or simulated.
- Blocked by an external dependency.

Never claim “fully working,” “perfect,” “4K quality guaranteed,” or “cross-platform supported” without matching evidence.
