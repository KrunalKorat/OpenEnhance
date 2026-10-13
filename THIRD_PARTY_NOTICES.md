# Third-Party Notices and Model Inventory

**Release blocker:** This file must be completed for the exact dependencies, binaries, codecs, and model files distributed in a release.

Do not treat the entries below as permission to redistribute every asset. Verify exact tags/commits, artifact source, license file, model-weight terms, and required notices.

## Planned components to review

| Component | Candidate purpose | Public source | Initial license note | Release action |
|---|---|---|---|---|
| Tauri 2 | Desktop shell | https://github.com/tauri-apps/tauri | Review exact crate/npm dependency licenses | Pin versions and include notices |
| React | UI framework | https://github.com/facebook/react | Verify exact package metadata/license | Include license inventory |
| FFmpeg / FFprobe | Media metadata and encoding | https://ffmpeg.org/ | LGPL by default; optional GPL components/build flags change obligations | Record exact configure flags, binaries and legal review |
| Video2X | Candidate video orchestration | https://github.com/k4yt3x/video2x | Repository is AGPL-3.0; verify pinned version | Review integration/distribution obligations before bundling |
| Real-ESRGAN ncnn-Vulkan | Candidate frame upscaling | https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan | Source repository lists MIT; model artifacts must be evaluated separately | Record binary source, model files and checksums |
| Real-ESRGAN model weights | AI inference | https://github.com/xinntao/Real-ESRGAN | Do not assume source-code license covers every downloaded asset | Verify exact model artifact terms |
| Real-CUGAN | Optional animation profile | https://github.com/nihui/realcugan-ncnn-vulkan | Verify repository and model terms at selected revision | Review before inclusion |
| Anime4K | Optional shader path | https://github.com/bloc97/Anime4K | Repository license has historically been MIT; verify chosen version/assets | Review before inclusion |
| RIFE | Optional frame interpolation | https://github.com/nihui/rife-ncnn-vulkan | Verify exact repository, model and binary terms | Review before inclusion |

## Verified Real-ESRGAN Engine Inventory (Phase 4 & 5)

| Field | Details |
|---|---|
| **Component** | Real-ESRGAN ncnn-Vulkan (NCNN Vulkan GPU AI Video & Image Upscaler) |
| **Upstream Release** | `v0.2.5.0` (`20220424-windows`) |
| **Source Repository** | https://github.com/xinntao/Real-ESRGAN / https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan |
| **Archive Artifact** | `realesrgan-ncnn-vulkan-20220424-windows.zip` |
| **Archive SHA-256** | `ABC02804E17982A3BE33675E4D471E91EA374E65B70167ABC09E31ACB412802D` |
| **Executable Name** | `realesrgan-ncnn-vulkan.exe` (SHA-256: `F507F5EC4E9A779C6F561C1420790F326888A9C1683416FE47F3CC5B98B35EE3`) |
| **Engine License** | BSD 3-Clause (NCNN) / MIT (Real-ESRGAN wrapper) |
| **Verified Models** | `realesrgan-x4plus` (4×, 67MB param/bin), `realesrgan-x4plus-anime` (4×, 17MB param/bin), `realesr-animevideov3` (2×, 3×, 4×, 2.5MB param/bin) |
| **Local Deployment** | Installed locally in `%LOCALAPPDATA%\OpenEnhance\engine` (outside Git repository tracking) |
| **Hardware Acceleration** | Vulkan discrete GPU (`NVIDIA GeForce RTX 3050 Laptop GPU`, Device ID: 1) |

## Required inventory fields for each redistributed artifact

- Component and purpose.
- Exact upstream URL and version/tag/commit.
- Artifact filename and SHA-256 checksum.
- Source code license and full license text/notice location.
- Model-weight/license terms, if applicable.
- Any attribution, source-offer, installation-information or corresponding-source obligations.
- Whether changes were made and where patches are maintained.
- Which installer/platform packages include the artifact.
- Date and reviewer for release sign-off.

## Official licensing references

- FFmpeg legal considerations: https://ffmpeg.org/legal.html
- Real-ESRGAN ncnn-Vulkan license file: https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan/blob/master/LICENSE
- Tauri security and capability model: https://v2.tauri.app/security/

This inventory is an engineering checklist, not legal advice. Get qualified review if the chosen combination creates uncertainty about license compatibility or redistribution obligations.
