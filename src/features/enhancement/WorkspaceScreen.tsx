import { useAppStore } from '@/stores/appState';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import type { ContentProfile, OutputPreset, QualityPreset } from '@/types/api';
import { OUTPUT_DIMENSIONS } from '@/types/api';
import {
  formatBytes,
  formatDuration,
  formatFrameRate,
  formatBitrate,
} from '@/lib/formatting';
import { pickVideoFiles, openOutput, revealInFolder } from '@/lib/api';
import {
  Sparkles,
  Sliders,
  Film,
  Video,
  Layers,
  HelpCircle,
  Folder,
  Loader2,
  AlertCircle,
  Volume2,
  Subtitles,
  FileVideo,
  X,
  RefreshCw,
  Info,
  CheckCircle2,
  Play,
  PlusCircle,
} from 'lucide-react';

export function WorkspaceScreen() {
  const {
    outputPreset,
    setOutputPreset,
    profile,
    setProfile,
    quality,
    setQuality,
    fitMode,
    setFitMode,
    container,
    setContainer,
    audioPolicy,
    setAudioPolicy,
    addToast,
    setActiveTab,
    currentMedia,
    isInspecting,
    inspectionError,
    importVideoByPath,
    clearCurrentMedia,
    engineStatus,
    isEnhancing,
    enhancementProgress,
    lastEnhancementResult,
    startEnhancement,
    dismissEnhancementResult,
    addCurrentToQueue,
  } = useAppStore();

  const handleEnhanceClick = async () => {
    if (!currentMedia) {
      addToast({
        type: 'warning',
        title: 'No Video Selected',
        description: 'Import a video clip via the Import tab to begin enhancement.',
        duration: 5000,
      });
      setActiveTab('import');
      return;
    }

    if (isEnhancing) {
      return;
    }

    await startEnhancement();
  };

  const handleBrowseVideo = async () => {
    try {
      const files = await pickVideoFiles();
      if (files.length > 0) {
        await importVideoByPath(files[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast({
        type: 'error',
        title: 'Failed to Open File',
        description: msg,
      });
    }
  };

  const currentDimensions = OUTPUT_DIMENSIONS[outputPreset];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Left/Main Column: Preview & Workspace Viewport */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <Card className="flex flex-col min-h-[460px] p-0 overflow-hidden relative group">
          {/* Viewport Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-sidebar/40">
            <div className="flex items-center gap-2 min-w-0">
              <Film className="w-4 h-4 text-text-secondary shrink-0" />
              <span className="text-xs font-semibold text-text-primary truncate">
                {currentMedia ? currentMedia.fileName : 'Preview & Comparison Studio'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentMedia ? (
                <>
                  <Badge variant="default">
                    {currentMedia.width}×{currentMedia.height}
                  </Badge>
                  <Badge variant="accent">
                    → {currentDimensions.width}×{currentDimensions.height}
                  </Badge>
                </>
              ) : (
                <>
                  <Badge variant="default">100% Fit</Badge>
                  <Badge variant="accent">
                    {currentDimensions.width}×{currentDimensions.height}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Viewport Center Canvas: Inspecting Loading State */}
          {isInspecting && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-canvas/50">
              <div className="w-16 h-16 rounded-full bg-bg-surface border border-accent-primary/40 flex items-center justify-center text-accent-primary mb-4 shadow-lg animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Inspecting Video Streams...
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed">
                Invoking FFprobe to extract stream codecs, fractional frame rate, audio
                channels, and generating representative preview frame.
              </p>
            </div>
          )}

          {/* Viewport Center Canvas: Inspection Error State */}
          {!isInspecting && inspectionError && !currentMedia && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-canvas/50">
              <div className="w-16 h-16 rounded-full bg-status-error/10 border border-status-error/30 flex items-center justify-center text-status-error mb-4 shadow-lg">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Media Inspection Failed
              </h3>
              <p className="text-xs text-status-error max-w-md mt-1.5 leading-relaxed bg-status-error/5 p-2 rounded border border-status-error/20 font-mono">
                {inspectionError}
              </p>
              <div className="flex items-center gap-3 mt-5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBrowseVideo}
                  className="gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Another Video
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('import')}>
                  Go to Import
                </Button>
              </div>
            </div>
          )}

          {/* Viewport Center Canvas: Loaded Video with Thumbnail Preview */}
          {!isInspecting && currentMedia && (
            <div className="flex-1 flex flex-col bg-bg-canvas/70">
              <div className="relative aspect-video max-h-[380px] w-full bg-black/80 flex items-center justify-center overflow-hidden border-b border-border-subtle group/preview">
                {currentMedia.thumbnailUrl ? (
                  <img
                    src={currentMedia.thumbnailUrl}
                    alt={currentMedia.fileName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-text-muted">
                    <FileVideo className="w-12 h-12 opacity-60 mb-2" />
                    <span className="text-xs font-mono">Thumbnail unavailable</span>
                  </div>
                )}

                {/* Overlaid Badges on Thumbnail */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="bg-black/70 backdrop-blur-sm text-text-primary text-[10px]"
                  >
                    {currentMedia.width}×{currentMedia.height}
                  </Badge>
                  {currentMedia.videoCodec && (
                    <Badge
                      variant="accent"
                      className="bg-accent-primary/80 backdrop-blur-sm text-[10px]"
                    >
                      {currentMedia.videoCodec.toUpperCase()}
                    </Badge>
                  )}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="bg-black/70 backdrop-blur-sm text-text-primary text-[10px]"
                  >
                    {formatDuration(currentMedia.durationMs ?? 0)}
                  </Badge>
                  <button
                    onClick={clearCurrentMedia}
                    title="Remove from Studio"
                    className="p-1.5 rounded-full bg-black/70 hover:bg-black text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="bg-black/70 backdrop-blur-sm text-[10px]"
                  >
                    {formatFrameRate(
                      currentMedia.frameRateNumerator,
                      currentMedia.frameRateDenominator,
                      currentMedia.averageFrameRate
                    )}
                  </Badge>
                  {currentMedia.pixelFormat && (
                    <Badge
                      variant="default"
                      className="bg-black/70 backdrop-blur-sm text-[10px]"
                    >
                      {currentMedia.pixelFormat}
                    </Badge>
                  )}
                </div>

                {/* Active Enhancement Progress Overlay */}
                {isEnhancing && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-accent-primary/10 border border-accent-primary/40 flex items-center justify-center text-accent-primary mb-3 shadow-xl">
                      <Loader2 className="w-7 h-7 animate-spin" />
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="accent">Real AI Enhancement Active</Badge>
                      <Badge variant="default">
                        {engineStatus?.gpuDevice ?? 'NVIDIA Vulkan Backend'}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mt-1">
                      {enhancementProgress?.stage === 'probing' &&
                        'Inspecting media streams...'}
                      {enhancementProgress?.stage === 'extracting' &&
                        'Extracting frames with FFmpeg...'}
                      {enhancementProgress?.stage === 'upscaling' &&
                        'Running Real-ESRGAN Vulkan AI inference...'}
                      {enhancementProgress?.stage === 'assembling' &&
                        'Assembling & encoding final video...'}
                      {enhancementProgress?.stage === 'validating' &&
                        'Verifying output with FFprobe...'}
                      {!enhancementProgress?.stage &&
                        'Processing video with Real-ESRGAN...'}
                    </h3>
                    <p className="text-xs text-text-secondary max-w-sm mt-1 leading-relaxed font-mono">
                      {enhancementProgress?.message ||
                        'Processing frames with NVIDIA Tensor/Vulkan acceleration...'}
                    </p>
                    <div className="w-full max-w-xs mt-3.5 bg-bg-surface/80 rounded-full h-1.5 overflow-hidden border border-border-subtle">
                      <div
                        className="bg-accent-primary h-full transition-all duration-300"
                        style={{
                          width: `${Math.max(5, Math.min(100, enhancementProgress?.percent ?? 15))}%`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-text-muted mt-2 font-mono">
                      {enhancementProgress?.percent ?? 0}% completed • Dedicated GPU
                      Pipeline
                    </div>
                  </div>
                )}

                {/* Quick overlay change action button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBrowseVideo}
                    className="shadow-lg gap-2"
                  >
                    <Folder className="w-3.5 h-3.5 text-accent-primary" />
                    Change Video
                  </Button>
                </div>
              </div>

              {/* Stream Specs & Inspection Breakdown */}
              <div className="p-4 space-y-3 bg-bg-surface/30">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                    <div className="text-[10px] text-text-muted">Aspect Ratio</div>
                    <div className="font-semibold text-text-primary mt-0.5 font-mono">
                      {currentMedia.displayAspectRatio ?? 'Auto'}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                    <div className="text-[10px] text-text-muted">File Size</div>
                    <div className="font-semibold text-text-primary mt-0.5 font-mono">
                      {formatBytes(currentMedia.fileSizeBytes)}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                    <div className="text-[10px] text-text-muted">Bitrate</div>
                    <div className="font-semibold text-text-primary mt-0.5 font-mono">
                      {formatBitrate(currentMedia.bitrate)}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                    <div className="text-[10px] text-text-muted">Frames</div>
                    <div className="font-semibold text-text-primary mt-0.5 font-mono">
                      {currentMedia.frameCount ? `${currentMedia.frameCount}` : 'Auto'}
                    </div>
                  </div>
                </div>

                {/* Audio and Subtitle Tracks List */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-border-subtle text-xs">
                  <div className="flex-1 flex items-start gap-2 min-w-0">
                    <Volume2 className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-text-muted">Audio Streams</div>
                      {currentMedia.audioTracks.length > 0 ? (
                        <div className="text-text-secondary truncate mt-0.5">
                          {currentMedia.audioTracks.map((a, idx) => (
                            <span key={a.index}>
                              {idx > 0 && ', '}
                              {a.codec?.toUpperCase() ?? 'Audio'} ({a.channels ?? 2}ch
                              {a.sampleRate ? `, ${a.sampleRate}Hz` : ''})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-text-muted italic mt-0.5">None detected</div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex items-start gap-2 min-w-0">
                    <Subtitles className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-text-muted">Subtitle Tracks</div>
                      {currentMedia.subtitleTracks.length > 0 ? (
                        <div className="text-text-secondary truncate mt-0.5">
                          {currentMedia.subtitleTracks.map((s, idx) => (
                            <span key={s.index}>
                              {idx > 0 && ', '}
                              {s.codec?.toUpperCase() ?? 'Sub'}
                              {s.language ? ` [${s.language}]` : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-text-muted italic mt-0.5">None embedded</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Viewport Center Canvas / Empty State */}
          {!isInspecting && !inspectionError && !currentMedia && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-canvas/50">
              <div className="w-16 h-16 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-muted mb-4 shadow-lg">
                <Video className="w-7 h-7 opacity-70" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                No Video Loaded in Studio
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed">
                Import a video to preview footage, inspect streams, and run AI
                enhancement.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBrowseVideo}
                  className="gap-2"
                >
                  <Folder className="w-4 h-4" />
                  Choose Video File
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('import')}
                  className="gap-2"
                >
                  Open Import Hub
                </Button>
              </div>
            </div>
          )}

          {/* Viewport Footer Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-subtle bg-bg-sidebar/30 text-xs text-text-muted">
            <div className="flex items-center gap-3">
              <span>Aspect: {currentMedia?.displayAspectRatio ?? 'Auto-detect'}</span>
              <span>•</span>
              <span>
                Audio: {audioPolicy === 'preserve' ? 'Preserve source' : 'Mute'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>
                {currentMedia
                  ? 'Inspection verified'
                  : 'Split comparison ready after import'}
              </span>
            </div>
          </div>
        </Card>

        {/* Verified Export Result Card */}
        {lastEnhancementResult && (
          <Card className="p-4 bg-status-success/10 border border-status-success/30 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-status-success/20 text-status-success flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    AI Enhancement & Export Verified
                  </h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Verified by FFprobe: {lastEnhancementResult.actualWidth}×
                    {lastEnhancementResult.actualHeight} (
                    {lastEnhancementResult.videoCodec?.toUpperCase() ?? 'H264'})
                  </p>
                </div>
              </div>
              <button
                onClick={dismissEnhancementResult}
                className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                <div className="text-[10px] text-text-muted font-sans">Resolution</div>
                <div className="font-semibold text-status-success mt-0.5">
                  {lastEnhancementResult.actualWidth}×{lastEnhancementResult.actualHeight}
                </div>
              </div>
              <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                <div className="text-[10px] text-text-muted font-sans">File Size</div>
                <div className="font-semibold text-text-primary mt-0.5">
                  {formatBytes(lastEnhancementResult.fileSizeBytes)}
                </div>
              </div>
              <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                <div className="text-[10px] text-text-muted font-sans">Duration</div>
                <div className="font-semibold text-text-primary mt-0.5">
                  {formatDuration(lastEnhancementResult.durationMs ?? 0)}
                </div>
              </div>
              <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                <div className="text-[10px] text-text-muted font-sans">Audio Streams</div>
                <div className="font-semibold text-text-primary mt-0.5">
                  {lastEnhancementResult.audioTracksCount > 0
                    ? `${lastEnhancementResult.audioTracksCount} Preserved`
                    : 'Muted'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => openOutput(lastEnhancementResult.outputPath)}
                className="gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Enhanced Video
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => revealInFolder(lastEnhancementResult.outputPath)}
                className="gap-2"
              >
                <Folder className="w-3.5 h-3.5" />
                Reveal in Folder
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissEnhancementResult}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Right Column: Enhancement Configuration Panels */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Output Resolution Panel */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-semibold text-text-primary">
                Target Resolution
              </h3>
            </div>
            <span className="text-xs font-mono text-accent-secondary">
              {currentDimensions.width} × {currentDimensions.height}
            </span>
          </div>

          <SegmentedControl<OutputPreset>
            value={outputPreset}
            onChange={setOutputPreset}
            ariaLabel="Output Resolution Presets"
            options={[
              { value: '1080p', label: '1080p', sublabel: '1920×1080' },
              { value: '1440p', label: '1440p', sublabel: '2560×1440' },
              { value: '4k', label: '4K', sublabel: '3840×2160' },
            ]}
          />
        </Card>

        {/* AI Model Profile Selection */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Content Profile</h3>
            </div>
            <Badge variant="default">
              {engineStatus?.gpuDevice ? `${engineStatus.gpuDevice}` : 'Vulkan Model'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: 'general',
                label: 'General Video',
                desc: 'Balanced detail restoration',
              },
              { id: 'live-action', label: 'Live Action', desc: 'Natural film texture' },
              { id: 'anime', label: 'Anime & 2D', desc: 'Sharp lines & clean fills' },
              {
                id: 'animation',
                label: '3D CGI / Gaming',
                desc: 'Vibrant edge recovery',
              },
            ].map((p) => {
              const isSelected = profile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProfile(p.id as ContentProfile)}
                  className={`p-3 rounded-control text-left border transition-all ${
                    isSelected
                      ? 'bg-bg-elevated border-accent-primary text-text-primary shadow-sm'
                      : 'bg-bg-canvas/60 border-border-subtle text-text-secondary hover:border-border-subtle/80 hover:text-text-primary'
                  }`}
                >
                  <div className="text-xs font-semibold">{p.label}</div>
                  <div className="text-[10px] text-text-muted mt-0.5 leading-snug">
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Quality Presets & Export Settings */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">
                Quality & Export
              </h3>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">
                Quality Preset
              </label>
              <SegmentedControl<QualityPreset>
                size="sm"
                value={quality}
                onChange={setQuality}
                ariaLabel="Quality Presets"
                options={[
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'high', label: 'High Quality' },
                  { value: 'maximum', label: 'Maximum' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Container
                </label>
                <SegmentedControl<'mp4' | 'mkv'>
                  size="sm"
                  value={container}
                  onChange={setContainer}
                  options={[
                    { value: 'mp4', label: 'MP4' },
                    { value: 'mkv', label: 'MKV' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Aspect Fit
                </label>
                <SegmentedControl<'contain' | 'crop'>
                  size="sm"
                  value={fitMode}
                  onChange={setFitMode}
                  options={[
                    { value: 'contain', label: 'Letterbox' },
                    { value: 'crop', label: 'Crop Fit' },
                  ]}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
              <span>Audio Policy:</span>
              <button
                onClick={() =>
                  setAudioPolicy(audioPolicy === 'preserve' ? 'remove' : 'preserve')
                }
                className="font-medium text-accent-primary hover:underline"
              >
                {audioPolicy === 'preserve'
                  ? 'Preserve Original Audio'
                  : 'Mute Audio Track'}
              </button>
            </div>
          </div>
        </Card>

        {/* Primary Action Buttons */}
        <div className="pt-2">
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="lg"
              disabled={!currentMedia || isEnhancing || isInspecting}
              onClick={handleEnhanceClick}
              className="flex-1 gap-2 shadow-lg shadow-accent-primary/20 text-sm font-semibold"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enhancing Video (Vulkan AI)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Enhance Video
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              disabled={!currentMedia || isEnhancing || isInspecting}
              onClick={async () => {
                const job = await addCurrentToQueue();
                if (job) {
                  setActiveTab('queue');
                }
              }}
              title="Add to Persistent Queue"
              className="gap-2 text-sm font-semibold px-4"
            >
              <PlusCircle className="w-4 h-4" />
              Queue
            </Button>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted text-center mt-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              {currentMedia
                ? isEnhancing
                  ? 'Real-ESRGAN Vulkan engine actively upscaling video frames...'
                  : 'Hardware-accelerated Vulkan pipeline with Real-ESRGAN.'
                : 'Import video to unlock enhancement pipeline.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
