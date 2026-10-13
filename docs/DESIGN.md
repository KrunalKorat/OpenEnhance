# Design System and UX Specification

**Design direction:** premium, restrained, dark creative workstation.  
**Core principle:** the interface feels sophisticated but never hides system status or important processing controls behind decoration.

## 1. Experience goals

- Make the first enhancement job understandable without a tutorial.
- Place import, output resolution, model profile, and start action in the primary workflow.
- Show the source and output clearly and allow direct visual comparison.
- Keep controls stable during processing; communicate disabled states and why an action is unavailable.
- Make long jobs feel predictable through real stage/progress information.
- Respect reduced-motion preferences and keyboard navigation.

## 2. Visual language

### Color tokens

| Token | Suggested value | Usage |
|---|---|---|
| `bg.canvas` | `#101218` | Main app background |
| `bg.sidebar` | `#151922` | Navigation/sidebar |
| `bg.surface` | `#1A202B` | Cards and work panels |
| `bg.elevated` | `#222A38` | Popovers and elevated controls |
| `border.subtle` | `#30394A` | Dividers and boundaries |
| `text.primary` | `#F4F6FA` | Main text |
| `text.secondary` | `#A9B2C2` | Secondary information |
| `text.muted` | `#7D8798` | Hints, metadata |
| `accent.primary` | `#7C8CFF` | Primary actions, selected states |
| `accent.secondary` | `#48C6D9` | GPU/processing indicators |
| `status.success` | `#49C995` | Completed state |
| `status.warning` | `#F2B45D` | Warning state |
| `status.error` | `#FF727C` | Errors and failure |

Check contrast against actual rendered states; these are starting tokens, not a completed WCAG audit. Do not rely on color alone to communicate status.

### Typography

- UI font: Inter or a system sans-serif fallback.
- Use tabular numerals for time, progress, dimensions and file sizes.
- Screen titles: 22–28 px; section headings: 15–18 px; normal controls/body: 13–15 px; supporting labels: 11–12 px.
- Avoid tiny text for critical settings, warnings, model licenses, or output quality information.

### Shape, depth and motion

- Corner radius: 8 px for controls, 12 px for panels, 16 px for large empty states.
- Use subtle boundaries more than heavy shadows. Glass effects may be used sparingly on floating panels, not on every surface.
- Motion: 120–220 ms for hover/focus/panel transitions; no looping decorative animation while processing.
- Respect `prefers-reduced-motion` and expose a setting if the framework supports it.

## 3. Application shell

Desktop layout suggestion:

- Left sidebar: 224 px when expanded; navigation and recent projects.
- Header: active workspace, current engine status, settings.
- Main content: responsive split panel with source/compare viewer and configuration panel.
- Bottom/secondary drawer: job queue and logs; can collapse but job state remains visible.
- Minimum viable viewport: design and test around 1024×700; smaller windows should scroll without clipping primary actions.

### Navigation

1. Workspace
2. Queue
3. History
4. Models
5. Settings

Use descriptive labels in addition to icons. A first-run screen should emphasize “Import video”; do not show an empty dashboard full of meaningless metrics.

## 4. Primary screens

### A. Workspace / empty state

- Large drop zone with “Choose video” primary action.
- Supported format note based on the actual FFmpeg build.
- Small local-processing/privacy line.
- Recent jobs only when history exists.

### B. Import and inspection

Show thumbnail/preview, file name, source resolution, duration, frame rate, aspect ratio, audio/subtitle indicators, and warnings. Avoid starting a lengthy AI job before metadata validation finishes.

### C. Enhancement studio

- Source preview with fit/zoom controls.
- Before/after split slider when a real output preview is available.
- Output resolution segmented control: 1080p, 1440p, 4K.
- Content profile: General / Live action / Anime / Animation, but only show a profile when a compatible model is installed and validated.
- Model selection with name, model version, local availability, and concise trade-off notes.
- Quality preset: Balanced / High quality / Maximum quality, mapped to real engine settings. Never treat a UI label as an actual setting unless it changes engine configuration.
- Export controls: output folder, format/codec, quality, audio and subtitles.
- Primary button: “Enhance video”. Button disabled with a visible reason if prerequisites are missing.

### D. Processing queue

For every job show thumbnail, filename, input → output resolution, selected profile, stage, elapsed time, progress or indeterminate indicator, and pause/cancel only if actually supported. Cancellation should confirm if there is a risk of losing recoverable intermediate data.

### E. Completion and error

Success: preview, open output, open folder, compare, show export information.  
Failure: plain-language reason, stage, retry if safe, details/log affordance. Do not claim success until output validation is complete.

### F. Models/settings

Show installed models, version, checksum/verification status, size, origin, license link, and remove/re-download action. Network downloads must be explicit, visible, cancellable, and checksum-verified. Display GPU/backend availability and fallbacks.

## 5. Components

- `AppShell`, `SidebarNav`, `TopBar`, `DropZone`, `MediaMetadataCard`
- `VideoPreview`, `ComparisonSlider`, `ResolutionSelector`, `ProfileSelector`
- `ModelCard`, `QualityPresetSelector`, `ExportSettingsPanel`
- `QueueItem`, `ProgressDisplay`, `JobStageBadge`, `JobLogDrawer`
- `StorageWarning`, `CapabilityStatus`, `ModelDownloadDialog`, `ConfirmDialog`
- `EmptyState`, `ErrorPanel`, `Toast`, `KeyboardHelp`

Use a consistent component API and semantic button/input components. Avoid building a separate one-off style for every screen.

## 6. Interaction states

Every asynchronous operation needs states for idle, loading, success, empty, unavailable, and failure where relevant. Examples:

- Engine check: checking → ready / unavailable / needs update.
- Model: not installed → downloading → verifying → ready / failed.
- Job: queued → preparing → running → cancelling → cancelled / succeeded / failed.
- Preview: loading → ready / unsupported / failed.

Progress values should be real. If the underlying tool only provides stderr text without structured progress, parse conservatively and fall back to a stage-based indeterminate indicator.

## 7. Accessibility checklist

- All actions available by keyboard.
- Focus order follows visual order and focus ring is visible.
- Labels are programmatically associated with controls.
- Dialogs trap focus appropriately and return focus on close.
- Contrast checked for text, icons, focus rings, disabled and hover states.
- Errors and completion changes are announced to assistive technology where possible.
- Do not use animation to convey essential information without an equivalent static indication.
- Avoid status information expressed only by color or position.

## 8. Responsive behavior

- At wide desktop widths, use a 60/40 split for preview/configuration.
- At smaller widths, stack preview and settings; pin primary action where it does not obscure content.
- Sidebar may collapse to icon-plus-tooltip navigation only when labels remain accessible.
- Queue and logs should be resizable/collapsible, and should not force the main content to an unusable height.

## 9. UI quality gates

- No clipped controls, overlapping panels, placeholder “live” statistics, or fake preview imagery in production.
- Every clickable control performs a real action or is clearly disabled with a reason.
- Loading states have a clear exit on success/failure/cancellation.
- Test dark theme contrast, keyboard-only flow, window resizing, long filenames, unusual aspect ratios, and error dialogs.
