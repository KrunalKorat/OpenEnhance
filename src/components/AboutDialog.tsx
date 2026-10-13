import { Modal } from './Modal';
import { useAppStore } from '@/stores/appState';
import { Badge } from './Badge';
import { Shield, Cpu, Code2 } from 'lucide-react';

export function AboutDialog() {
  const { isAboutOpen, setIsAboutOpen } = useAppStore();

  return (
    <Modal
      isOpen={isAboutOpen}
      onClose={() => setIsAboutOpen(false)}
      title="About OpenEnhance"
      description="Free, open-source, local-first AI video enhancement desktop application."
      maxWidth="lg"
    >
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <div className="font-semibold text-text-primary text-base">OpenEnhance</div>
            <div className="text-xs text-text-muted">v0.1.0 • Desktop Edition</div>
          </div>
          <Badge variant="accent">Open Source</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-control bg-bg-elevated border border-border-subtle">
            <div className="flex items-center gap-1.5 text-xs text-accent-primary font-medium mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Local-First</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Zero cloud uploads, telemetry, or account requirements.
            </p>
          </div>

          <div className="p-3 rounded-control bg-bg-elevated border border-border-subtle">
            <div className="flex items-center gap-1.5 text-xs text-accent-secondary font-medium mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>Vulkan AI</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              GPU acceleration via native Vulkan & Real-ESRGAN engine.
            </p>
          </div>

          <div className="p-3 rounded-control bg-bg-elevated border border-border-subtle">
            <div className="flex items-center gap-1.5 text-xs text-status-success font-medium mb-1">
              <Code2 className="w-3.5 h-3.5" />
              <span>Stack</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Tauri 2, Rust core, React 19, TypeScript, and FFmpeg.
            </p>
          </div>
        </div>

        <div className="text-xs text-text-muted space-y-2 pt-2">
          <p>
            Developed with transparency: No fake progress bars, no simulated AI, and
            strict output validation.
          </p>
          <p>
            Third-party notices and licenses are documented in{' '}
            <code className="text-text-primary bg-bg-canvas px-1.5 py-0.5 rounded border border-border-subtle font-mono">
              THIRD_PARTY_NOTICES.md
            </code>
            .
          </p>
        </div>
      </div>
    </Modal>
  );
}
