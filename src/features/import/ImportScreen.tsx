import { useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAppStore } from '@/stores/appState';
import { pickVideoFiles } from '@/lib/api';
import { formatBytes, formatDuration, formatFrameRate } from '@/lib/formatting';
import type { MediaInfo } from '@/types/media';
import {
  UploadCloud,
  FileVideo,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Play,
  Film,
  Clock,
  Layers,
} from 'lucide-react';

export function ImportScreen() {
  const {
    addToast,
    setActiveTab,
    importVideoByPath,
    isInspecting,
    importedVideos,
    currentMedia,
    setCurrentMedia,
  } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    for (const file of files) {
      // In Tauri desktop environment, dropped File objects expose the absolute system path.
      const rawPath = (file as unknown as { path?: string }).path || file.name;
      await importVideoByPath(rawPath);
    }
  };

  const handleBrowseFiles = async () => {
    try {
      const paths = await pickVideoFiles();
      if (!paths || paths.length === 0) return;

      for (const p of paths) {
        await importVideoByPath(p);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast({
        type: 'error',
        title: 'File Picker Error',
        description: msg,
      });
    }
  };

  const handleSelectMediaForStudio = (media: MediaInfo) => {
    setCurrentMedia(media);
    setActiveTab('workspace');
    addToast({
      type: 'info',
      title: 'Loaded into Studio',
      description: `"${media.fileName}" is ready for target resolution and profile configuration.`,
      duration: 3000,
    });
  };

  const supportedFormats = ['MP4', 'MKV', 'MOV', 'WebM', 'AVI'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">
          Import Video Footage
        </h2>
        <p className="text-sm text-text-secondary mt-0.5">
          Select or drag-and-drop local video files to inspect streams, codecs, and
          prepare enhancement.
        </p>
      </div>

      {/* Main Drag-and-Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-card border-2 border-dashed p-10 transition-all text-center flex flex-col items-center justify-center relative ${
          isDragging
            ? 'border-accent-primary bg-accent-primary/10 scale-[1.01]'
            : 'border-border-subtle bg-bg-surface/30 hover:border-border-subtle/80 hover:bg-bg-surface/50'
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent-primary mb-4 shadow-md">
          {isInspecting ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-text-primary">
          {isInspecting
            ? 'Inspecting Media Streams...'
            : 'Drag and drop video files here'}
        </h3>
        <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed">
          {isInspecting
            ? 'Invoking FFprobe and extracting frame thumbnail...'
            : 'Files stay 100% on your computer. Native file dialog and drag-and-drop support all common video containers.'}
        </p>

        <Button
          variant="primary"
          size="md"
          onClick={handleBrowseFiles}
          disabled={isInspecting}
          className="mt-6 gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Browse Video Files
        </Button>

        {/* Supported Formats Tags */}
        <div className="flex items-center gap-2 mt-8 flex-wrap justify-center">
          <span className="text-xs text-text-muted">Supported containers:</span>
          {supportedFormats.map((fmt) => (
            <Badge key={fmt} variant="default" className="font-mono text-[11px]">
              {fmt}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recently Inspected / Imported Videos List */}
      {importedVideos.length > 0 && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-semibold text-text-primary">
                Imported Media ({importedVideos.length})
              </h3>
            </div>
            <span className="text-xs text-text-muted">
              Click any clip to load into Enhancement Studio
            </span>
          </div>

          <div className="divide-y divide-border-subtle">
            {importedVideos.map((video) => {
              const isActive = currentMedia?.path === video.path;
              return (
                <div
                  key={video.path}
                  className={`py-3.5 flex items-center justify-between gap-4 transition-colors rounded-lg px-2 ${
                    isActive ? 'bg-accent-primary/5' : 'hover:bg-bg-elevated/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Thumbnail or File Icon */}
                    <div className="w-16 h-10 rounded bg-black/60 border border-border-subtle overflow-hidden shrink-0 flex items-center justify-center relative">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileVideo className="w-5 h-5 text-text-muted" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary truncate">
                          {video.fileName}
                        </span>
                        {isActive && (
                          <Badge variant="accent" className="text-[10px] py-0">
                            Active in Studio
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-text-muted mt-1 font-mono">
                        <span>
                          {video.width}×{video.height}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-text-muted" />
                          {formatDuration(video.durationMs ?? 0)}
                        </span>
                        <span>•</span>
                        <span>
                          {formatFrameRate(
                            video.frameRateNumerator,
                            video.frameRateDenominator,
                            video.averageFrameRate
                          )}
                        </span>
                        <span>•</span>
                        <span>{video.videoCodec?.toUpperCase() ?? 'VIDEO'}</span>
                        <span>•</span>
                        <span>{formatBytes(video.fileSizeBytes)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={isActive ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleSelectMediaForStudio(video)}
                      className="gap-1.5 text-xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {isActive ? 'View in Studio' : 'Load in Studio'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Auxiliary Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Local Storage & Privacy */}
        <Card>
          <div className="flex items-center gap-2 mb-2 text-status-success font-medium text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Strictly Local Processing</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            OpenEnhance never transmits frames, metadata, or telemetry to external
            servers. All FFprobe inspection runs locally.
          </p>
        </Card>

        {/* Disk Space & Temporary Requirements */}
        <Card>
          <div className="flex items-center gap-2 mb-2 text-accent-secondary font-medium text-xs">
            <HardDrive className="w-4 h-4" />
            <span>Disk Space Validation</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Temporary frames require approximately 3–5× source file size during AI
            upscaling. Thumbnails are cached safely.
          </p>
        </Card>

        {/* Codec & Stream Preservation */}
        <Card>
          <div className="flex items-center gap-2 mb-2 text-accent-primary font-medium text-xs">
            <Layers className="w-4 h-4" />
            <span>Stream Preservation</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Multi-track audio and supported subtitles are detected and mapped by default
            for output container remuxing.
          </p>
        </Card>
      </div>

      {/* Phase 3 Scope Notice */}
      <Card elevated className="border-accent-primary/20 bg-accent-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-text-primary">
                Phase 3 Video Import & Metadata Engine Active
              </h4>
              <p className="text-[11px] text-text-secondary mt-0.5">
                FFprobe metadata extraction, fractional frame rate parsing, audio/subtitle
                stream inspection, and FFmpeg thumbnail caching are fully operational.
              </p>
            </div>
          </div>
          <Badge variant="accent">Phase 3 Complete</Badge>
        </div>
      </Card>
    </div>
  );
}
