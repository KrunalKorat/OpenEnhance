import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAppStore } from '@/stores/appState';
import { getAppInfo, getSystemCapabilities } from '@/lib/api';
import type { AppInfo, SystemCapabilities } from '@/types/api';
import { Cpu, Video, HardDrive, Copy, RefreshCw, Info } from 'lucide-react';

export function SettingsScreen() {
  const { preferences, updatePreferences, setIsAboutOpen, addToast } = useAppStore();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchCapabilities = async () => {
    setLoading(true);
    try {
      const [info, caps] = await Promise.all([getAppInfo(), getSystemCapabilities()]);
      setAppInfo(info);
      setCapabilities(caps);
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapabilities();
  }, []);

  const handleCopyDiagnostics = async () => {
    const diagnosticPayload = {
      appInfo,
      capabilities,
      timestamp: new Date().toISOString(),
    };
    await navigator.clipboard.writeText(JSON.stringify(diagnosticPayload, null, 2));
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Diagnostics Copied',
      description: 'System specifications copied to your clipboard.',
      duration: 3000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Settings & Hardware Diagnostics
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Configure local storage directories, concurrency bounds, and check GPU
            capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAboutOpen(true)}
            className="gap-2"
          >
            <Info className="w-3.5 h-3.5" />
            About OpenEnhance
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCapabilities}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Diagnostics
          </Button>
        </div>
      </div>

      {/* Hardware & Acceleration Status */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-accent-secondary" />
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Hardware Acceleration & Runtime
              </h3>
              <p className="text-xs text-text-secondary">
                Vulkan GPU detection and FFmpeg media pipeline inspection.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyDiagnostics}
            className="gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied' : 'Copy Diagnostics'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Vulkan */}
          <div className="p-3.5 rounded-control bg-bg-surface border border-border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary font-medium">
                  Vulkan GPU Backend
                </span>
                {capabilities?.vulkanAvailable ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="warning">Fallback</Badge>
                )}
              </div>
              <div className="font-mono text-xs text-text-primary">
                {capabilities?.vulkanDevice ?? 'No Vulkan GPU device detected'}
              </div>
            </div>
            <div className="mt-3 text-[11px] text-text-muted">
              Used by Real-ESRGAN ncnn Vulkan engine
            </div>
          </div>

          {/* FFmpeg */}
          <div className="p-3.5 rounded-control bg-bg-surface border border-border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary font-medium">
                  FFmpeg / FFprobe
                </span>
                {capabilities?.ffmpegAvailable && capabilities?.ffprobeAvailable ? (
                  <Badge variant="success">Available</Badge>
                ) : (
                  <Badge variant="error">Missing</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Video className="w-4 h-4 text-text-secondary" />
                <span className="font-mono text-text-primary truncate">
                  {capabilities?.ffmpegAvailable
                    ? 'FFmpeg Encoder Found'
                    : 'FFmpeg Not Found'}
                </span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-text-muted truncate">
              {capabilities?.ffmpegVersion ?? 'Checking FFmpeg...'}
            </div>
          </div>
        </div>
      </Card>

      {/* Storage and Processing Preferences */}
      <Card>
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border-subtle">
          <HardDrive className="w-5 h-5 text-accent-primary" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Storage & Performance
            </h3>
            <p className="text-xs text-text-secondary">
              Configure directories and set worker execution parameters.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {/* Default Output Directory */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Default Export Directory
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={preferences.defaultOutputFolder ?? ''}
                className="flex-1 bg-bg-canvas border border-border-subtle rounded-control px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'info',
                    title: 'Folder Selector',
                    description: 'Native directory picker activates in Phase 5.',
                  })
                }
              >
                Change
              </Button>
            </div>
          </div>

          {/* Concurrency Limit */}
          <div className="pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-medium text-text-primary">
                  Worker Concurrency Limit
                </label>
                <p className="text-[11px] text-text-muted">
                  Max number of parallel videos processed simultaneously (1 is recommended
                  to avoid VRAM exhaustion).
                </p>
              </div>
              <Badge variant="accent">{preferences.concurrencyLimit} Worker</Badge>
            </div>

            <div className="flex gap-2">
              {[1, 2, 3, 4].map((limit) => (
                <button
                  key={limit}
                  onClick={() => updatePreferences({ concurrencyLimit: limit })}
                  className={`flex-1 py-1.5 px-3 rounded-control text-xs font-mono font-medium border transition-all ${
                    preferences.concurrencyLimit === limit
                      ? 'bg-accent-primary text-white border-accent-primary font-bold'
                      : 'bg-bg-canvas border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-clean cache toggle */}
          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-text-primary">
                Auto-clean Temporary Frames
              </div>
              <div className="text-[11px] text-text-muted">
                Automatically deletes intermediate extracted frames after successful
                encoding.
              </div>
            </div>
            <button
              onClick={() =>
                updatePreferences({ autoCleanTemp: !preferences.autoCleanTemp })
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                preferences.autoCleanTemp ? 'bg-status-success' : 'bg-bg-elevated'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  preferences.autoCleanTemp ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced motion toggle */}
          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-text-primary">
                Respect Reduced Motion
              </div>
              <div className="text-[11px] text-text-muted">
                Disables animated transitions for accessibility.
              </div>
            </div>
            <button
              onClick={() =>
                updatePreferences({
                  prefersReducedMotion: !preferences.prefersReducedMotion,
                })
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                preferences.prefersReducedMotion ? 'bg-accent-primary' : 'bg-bg-elevated'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  preferences.prefersReducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
