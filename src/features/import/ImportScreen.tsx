import { useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAppStore } from '@/stores/appState';
import {
  UploadCloud,
  FileVideo,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';

export function ImportScreen() {
  const { addToast, setActiveTab } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addToast({
        type: 'info',
        title: 'File Drop Detected',
        description: `Selected "${files[0].name}". Full metadata inspection activates in Phase 3.`,
        duration: 4000,
      });
      setActiveTab('workspace');
    }
  };

  const handleBrowseFiles = () => {
    addToast({
      type: 'info',
      title: 'File Picker Triggered',
      description:
        'System native file picker is scheduled for Phase 3 integration with FFprobe.',
      duration: 4000,
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
        className={`rounded-card border-2 border-dashed p-12 transition-all text-center flex flex-col items-center justify-center ${
          isDragging
            ? 'border-accent-primary bg-accent-primary/10 scale-[1.01]'
            : 'border-border-subtle bg-bg-surface/30 hover:border-border-subtle/80 hover:bg-bg-surface/50'
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent-primary mb-4 shadow-md">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">
          Drag and drop video files here
        </h3>
        <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed">
          Files stay 100% on your computer. Supports single files or batches for queue
          processing.
        </p>

        <Button
          variant="primary"
          size="md"
          onClick={handleBrowseFiles}
          className="mt-6 gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Browse Video Files
        </Button>

        {/* Supported Formats Tags */}
        <div className="flex items-center gap-2 mt-8 flex-wrap justify-center">
          <span className="text-xs text-text-muted">Supported formats:</span>
          {supportedFormats.map((fmt) => (
            <Badge key={fmt} variant="default" className="font-mono text-[11px]">
              {fmt}
            </Badge>
          ))}
        </div>
      </div>

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
            servers.
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
            upscaling.
          </p>
        </Card>

        {/* Codec & Stream Preservation */}
        <Card>
          <div className="flex items-center gap-2 mb-2 text-accent-primary font-medium text-xs">
            <FileVideo className="w-4 h-4" />
            <span>Stream Preservation</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Multi-track audio and supported subtitles are preserved by default using
            FFmpeg.
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
                Phase 2 UI Drag-and-Drop Interactive Shell Complete
              </h4>
              <p className="text-[11px] text-text-secondary mt-0.5">
                FFprobe binary metadata extraction and video stream decoding will be
                connected in Phase 3.
              </p>
            </div>
          </div>
          <Badge variant="accent">Phase 2 Shell</Badge>
        </div>
      </Card>
    </div>
  );
}
