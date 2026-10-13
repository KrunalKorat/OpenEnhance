import { useAppStore } from '@/stores/appState';
import {
  Sparkles,
  UploadCloud,
  Layers,
  History,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Info,
} from 'lucide-react';

export function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    setIsKeyboardHelpOpen,
    setIsAboutOpen,
    queue,
  } = useAppStore();

  const navItems = [
    { id: 'workspace' as const, label: 'Workspace', icon: Sparkles },
    { id: 'import' as const, label: 'Import', icon: UploadCloud },
    {
      id: 'queue' as const,
      label: 'Queue',
      icon: Layers,
      badge: queue.length > 0 ? queue.length : undefined,
    },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-bg-sidebar border-r border-border-subtle flex flex-col justify-between shrink-0 transition-all duration-200 z-10 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div>
        {/* App Branding */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-border-subtle">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-control bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
              OE
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm tracking-tight leading-none text-text-primary truncate">
                  OpenEnhance
                </span>
                <span className="text-[10px] text-text-muted mt-0.5 truncate">
                  Local AI Studio
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 rounded-control text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
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
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-control text-sm font-medium transition-colors ${
                  sidebarCollapsed
                    ? 'justify-center p-2.5'
                    : 'gap-3 px-3 py-2 justify-between'
                } ${
                  isActive
                    ? 'bg-bg-elevated text-accent-primary font-semibold shadow-sm border border-border-subtle/40'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent-primary' : ''}`}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>

                {!sidebarCollapsed && item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-accent-primary/20 text-accent-primary font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation & Privacy Badge */}
      <div className="p-2 border-t border-border-subtle space-y-1">
        <button
          onClick={() => setIsKeyboardHelpOpen(true)}
          title={sidebarCollapsed ? 'Keyboard Shortcuts (?)' : undefined}
          className={`w-full flex items-center rounded-control text-xs text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors ${
            sidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          {!sidebarCollapsed && <span>Shortcuts (?)</span>}
        </button>

        <button
          onClick={() => setIsAboutOpen(true)}
          title={sidebarCollapsed ? 'About OpenEnhance' : undefined}
          className={`w-full flex items-center rounded-control text-xs text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors ${
            sidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5'
          }`}
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          {!sidebarCollapsed && <span>About</span>}
        </button>

        {!sidebarCollapsed && (
          <div className="pt-2 px-1 border-t border-border-subtle/60 flex items-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
            <span className="truncate">Local-first • No cloud</span>
          </div>
        )}
      </div>
    </aside>
  );
}
