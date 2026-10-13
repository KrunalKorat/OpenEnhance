import { useAppStore } from '@/stores/appState';
import { Badge } from './Badge';
import { Button } from './Button';
import { Cpu, HelpCircle, Settings as SettingsIcon } from 'lucide-react';

export function Header({
  vulkanAvailable,
  vulkanDevice,
}: {
  vulkanAvailable?: boolean;
  vulkanDevice?: string;
}) {
  const { activeTab, setActiveTab, setIsKeyboardHelpOpen } = useAppStore();

  const titleMap = {
    workspace: 'Enhancement Studio',
    import: 'Import Footage',
    queue: 'Batch Queue',
    history: 'Processing History',
    settings: 'Settings & Hardware',
  };

  return (
    <header className="h-14 border-b border-border-subtle bg-bg-sidebar/50 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-text-primary tracking-tight">
          {titleMap[activeTab]}
        </h1>
        <Badge variant="default" className="text-[11px] font-mono">
          Phase 2 UI Shell
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Hardware status badge */}
        <button
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-bg-surface border border-border-subtle hover:border-border-subtle/80 text-xs transition-colors"
          title="Hardware Acceleration Status"
        >
          <Cpu className="w-3.5 h-3.5 text-accent-secondary" />
          <span className="text-text-secondary text-[11px] hidden sm:inline">
            {vulkanAvailable ? (vulkanDevice ?? 'Vulkan GPU') : 'Vulkan Active'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
        </button>

        {/* Shortcuts button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsKeyboardHelpOpen(true)}
          className="p-1.5 text-text-muted hover:text-text-primary"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>

        {/* Quick settings link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('settings')}
          className="p-1.5 text-text-muted hover:text-text-primary"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
