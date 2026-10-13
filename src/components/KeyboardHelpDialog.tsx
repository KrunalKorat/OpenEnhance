import { Modal } from './Modal';
import { useAppStore } from '@/stores/appState';

export function KeyboardHelpDialog() {
  const { isKeyboardHelpOpen, setIsKeyboardHelpOpen } = useAppStore();

  const shortcuts = [
    { key: '1 - 5', desc: 'Switch navigation tabs (Workspace, Import, Queue, etc.)' },
    { key: '?', desc: 'Toggle keyboard shortcuts dialog' },
    { key: 'Esc', desc: 'Close dialogs and overlays' },
    { key: 'Ctrl + /', desc: 'Open shortcuts' },
  ];

  return (
    <Modal
      isOpen={isKeyboardHelpOpen}
      onClose={() => setIsKeyboardHelpOpen(false)}
      title="Keyboard Shortcuts"
      description="Quick accessibility navigation throughout OpenEnhance."
      maxWidth="md"
    >
      <div className="space-y-3">
        {shortcuts.map((sc, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-border-subtle last:border-none"
          >
            <span className="text-sm text-text-secondary">{sc.desc}</span>
            <kbd className="px-2 py-1 text-xs font-mono font-medium rounded-control bg-bg-elevated border border-border-subtle text-text-primary">
              {sc.key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
