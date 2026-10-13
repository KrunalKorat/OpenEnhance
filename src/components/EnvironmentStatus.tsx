import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import type { AppInfo, SystemCapabilities } from '@/types/api';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  Video,
  FileCheck,
  RefreshCw,
  Copy,
  Info,
} from 'lucide-react';
import { useState } from 'react';

export interface EnvironmentStatusProps {
  appInfo: AppInfo | null;
  capabilities: SystemCapabilities | null;
  loading: boolean;
  onRefresh: () => void;
}

export function EnvironmentStatus({
  appInfo,
  capabilities,
  loading,
  onRefresh,
}: EnvironmentStatusProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = async () => {
    const diagnosticPayload = {
      appInfo,
      capabilities,
      timestamp: new Date().toISOString(),
    };
    await navigator.clipboard.writeText(JSON.stringify(diagnosticPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">
            Environment & System Diagnostics
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Phase 1 Foundation: verifying local runtime, codecs, GPU, and system
            dependencies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyDiagnostics}
            disabled={!capabilities}
            className="gap-2"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied' : 'Copy Diagnostics'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Grid of Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Core App Info */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Application Core
              </span>
              <Badge variant="accent">v{appInfo?.appVersion ?? '...'}</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Platform OS:</span>
                <span className="font-mono text-text-primary capitalize">
                  {appInfo?.os ?? '...'} ({appInfo?.architecture ?? '...'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">API Contract:</span>
                <span className="font-mono text-text-primary">
                  v{appInfo?.apiVersion ?? 1}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Storage Schema:</span>
                <span className="font-mono text-text-primary">
                  v{appInfo?.storageSchemaVersion ?? 1}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-1.5 text-xs text-text-muted">
            <Info className="w-3.5 h-3.5" />
            <span>Tauri 2 Rust desktop core initialized</span>
          </div>
        </Card>

        {/* FFmpeg & FFprobe Media Pipeline */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Media Pipeline
              </span>
              {capabilities?.ffmpegAvailable && capabilities?.ffprobeAvailable ? (
                <Badge variant="success">Ready</Badge>
              ) : (
                <Badge variant="warning">Missing Dependency</Badge>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-secondary">FFmpeg Encoder:</span>
                </div>
                {capabilities?.ffmpegAvailable ? (
                  <span className="inline-flex items-center gap-1 text-status-success font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Detected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-status-error font-medium">
                    <XCircle className="w-4 h-4" /> Not Found
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-secondary">FFprobe Inspector:</span>
                </div>
                {capabilities?.ffprobeAvailable ? (
                  <span className="inline-flex items-center gap-1 text-status-success font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Detected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-status-error font-medium">
                    <XCircle className="w-4 h-4" /> Not Found
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-text-muted truncate">
            {capabilities?.ffmpegVersion ?? 'Checking FFmpeg version...'}
          </div>
        </Card>

        {/* GPU & Vulkan Acceleration */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Hardware Acceleration
              </span>
              {capabilities?.vulkanAvailable ? (
                <Badge variant="success">Vulkan Enabled</Badge>
              ) : (
                <Badge variant="warning">Fallback Mode</Badge>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-secondary">Vulkan Driver:</span>
                </div>
                {capabilities?.vulkanAvailable ? (
                  <span className="inline-flex items-center gap-1 text-status-success font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-status-warning font-medium">
                    <AlertTriangle className="w-4 h-4" /> Unavailable
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Detected Device:</span>
                <span className="font-mono text-xs text-text-primary truncate max-w-[150px]">
                  {capabilities?.vulkanDevice ?? 'None'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-1.5 text-xs text-text-muted">
            <Info className="w-3.5 h-3.5" />
            <span>Real-ESRGAN Vulkan ncnn target</span>
          </div>
        </Card>
      </div>

      {/* Warnings & Notices */}
      {capabilities && capabilities.warnings.length > 0 && (
        <Card className="border-status-warning/40 bg-status-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-status-warning">
                System Capability Warnings
              </h3>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                {capabilities.warnings.map((warn, index) => (
                  <li key={index}>{warn}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Phase Status Banner */}
      <Card elevated className="border-accent-primary/20 bg-accent-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span className="text-sm font-semibold text-text-primary">
                Phase 1 Foundation Operational
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Repository structure, Tauri 2 Rust core, React frontend, TypeScript types,
              Vite dev server, and foundational checks are verified. Video enhancement
              actions remain disabled until Phase 4.
            </p>
          </div>
          <Badge variant="accent">Phase 1 Complete</Badge>
        </div>
      </Card>
    </div>
  );
}
