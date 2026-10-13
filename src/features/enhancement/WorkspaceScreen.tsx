import { useAppStore } from '@/stores/appState';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import type { ContentProfile, OutputPreset, QualityPreset } from '@/types/api';
import { OUTPUT_DIMENSIONS } from '@/types/api';
import { Sparkles, Sliders, Film, Video, Layers, HelpCircle, Folder } from 'lucide-react';

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
  } = useAppStore();

  const handleEnhanceClick = () => {
    addToast({
      type: 'warning',
      title: 'No Video Selected',
      description: 'Import a video clip via the Import tab to begin enhancement.',
      duration: 5000,
    });
    setActiveTab('import');
  };

  const currentDimensions = OUTPUT_DIMENSIONS[outputPreset];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Left/Main Column: Preview & Workspace Viewport */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <Card className="flex flex-col min-h-[460px] p-0 overflow-hidden relative group">
          {/* Viewport Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-sidebar/40">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-text-secondary" />
              <span className="text-xs font-semibold text-text-primary">
                Preview & Comparison Studio
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">100% Fit</Badge>
              <Badge variant="accent">
                {currentDimensions.width}×{currentDimensions.height}
              </Badge>
            </div>
          </div>

          {/* Viewport Center Canvas / Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-canvas/50">
            <div className="w-16 h-16 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-muted mb-4 shadow-lg">
              <Video className="w-7 h-7 opacity-70" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              No Video Loaded in Studio
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed">
              Import a video to preview footage, inspect streams, and run AI enhancement.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('import')}
              className="mt-5 gap-2"
            >
              <Folder className="w-4 h-4 text-accent-primary" />
              Choose or Drop Video
            </Button>
          </div>

          {/* Viewport Footer Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-subtle bg-bg-sidebar/30 text-xs text-text-muted">
            <div className="flex items-center gap-3">
              <span>Aspect: Auto-detect</span>
              <span>•</span>
              <span>
                Audio: {audioPolicy === 'preserve' ? 'Preserve source' : 'Mute'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Split comparison ready after import</span>
            </div>
          </div>
        </Card>
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
            <Badge variant="default">Vulkan Model</Badge>
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

        {/* Primary Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleEnhanceClick}
            className="w-full gap-2 shadow-lg shadow-accent-primary/20 text-sm font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            Enhance Video
          </Button>
          <p className="text-[11px] text-text-muted text-center mt-2">
            Inference engine connects in Phase 4. All processing is 100% local.
          </p>
        </div>
      </div>
    </div>
  );
}
