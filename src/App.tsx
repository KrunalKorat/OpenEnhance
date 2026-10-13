import { useEffect, useState } from 'react';
import { getAppInfo, getSystemCapabilities } from '@/lib/api';
import type { AppInfo, SystemCapabilities } from '@/types/api';
import { EnvironmentStatus } from '@/components/EnvironmentStatus';
import {
  Sparkles,
  Layers,
  History,
  Boxes,
  Settings,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('workspace');

  const fetchEnvironment = async () => {
    setLoading(true);
    try {
      const [info, caps] = await Promise.all([getAppInfo(), getSystemCapabilities()]);
      setAppInfo(info);
      setCapabilities(caps);
    } catch (err) {
      console.error('Failed to query system capabilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironment();
  }, []);

  const navItems = [
    { id: 'workspace', label: 'Workspace', icon: Sparkles },
    { id: 'queue', label: 'Queue', icon: Layers },
    { id: 'history', label: 'History', icon: History },
    { id: 'models', label: 'Models', icon: Boxes },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-canvas text-text-primary">
      {/* Sidebar Navigation */}
      <aside className="w-56 bg-bg-sidebar border-r border-border-subtle flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / App Branding */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border-subtle">
            <div className="w-7 h-7 rounded-control bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-sm">
              OE
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight leading-none text-text-primary">
                OpenEnhance
              </span>
              <span className="text-[10px] text-text-muted mt-0.5">Local AI Video</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-control text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-bg-elevated text-accent-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Local-First & Privacy Badge */}
        <div className="p-3 border-t border-border-subtle">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
            <span>100% Local Processing No cloud telemetry</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border-subtle bg-bg-sidebar/50 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold capitalize text-text-primary">
              {activeTab}
            </h1>
            <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-bg-elevated border border-border-subtle">
              Phase 1 Foundation
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-status-success" />
              <span>Rust Core Ready</span>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              {/* Foundation Environment Diagnostics */}
              <EnvironmentStatus
                appInfo={appInfo}
                capabilities={capabilities}
                loading={loading}
                onRefresh={fetchEnvironment}
              />

              {/* Disabled feature placeholder notice adhering strictly to Phase 1 scope */}
              <div className="rounded-panel border border-dashed border-border-subtle p-8 text-center bg-bg-surface/30">
                <FolderOpen className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-60" />
                <h3 className="text-sm font-medium text-text-secondary">
                  Media Workspace Disabled (Phase 2 & 3 Scope)
                </h3>
                <p className="text-xs text-text-muted max-w-md mx-auto mt-1">
                  Video import, metadata inspection, and enhancement pipeline will be
                  established in subsequent phases. No dummy or simulated processing is
                  allowed per project rules.
                </p>
              </div>
            </div>
          )}

          {activeTab !== 'workspace' && (
            <div className="rounded-panel border border-border-subtle p-8 text-center bg-bg-surface">
              <h3 className="text-base font-medium text-text-primary capitalize">
                {activeTab} Screen
              </h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Scheduled for implementation in Phase 2 (Design System & UI Shell) and
                subsequent phases.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
