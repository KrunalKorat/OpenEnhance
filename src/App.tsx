import { useEffect, useState } from 'react';
import { AppProvider, useAppStore } from '@/stores/appState';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ToastContainer } from '@/components/Toast';
import { KeyboardHelpDialog } from '@/components/KeyboardHelpDialog';
import { AboutDialog } from '@/components/AboutDialog';

import { WorkspaceScreen } from '@/features/enhancement/WorkspaceScreen';
import { ImportScreen } from '@/features/import/ImportScreen';
import { QueueScreen } from '@/features/queue/QueueScreen';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

import { getSystemCapabilities } from '@/lib/api';
import type { SystemCapabilities } from '@/types/api';

function AppContent() {
  const { activeTab, setActiveTab } = useAppStore();
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);

  useEffect(() => {
    getSystemCapabilities()
      .then((caps) => setCapabilities(caps))
      .catch((err) => console.error('Capabilities probe error:', err));
  }, []);

  // Keyboard navigation for tab switching: 1 -> Workspace, 2 -> Import, 3 -> Queue, 4 -> History, 5 -> Settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      switch (e.key) {
        case '1':
          setActiveTab('workspace');
          break;
        case '2':
          setActiveTab('import');
          break;
        case '3':
          setActiveTab('queue');
          break;
        case '4':
          setActiveTab('history');
          break;
        case '5':
          setActiveTab('settings');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-canvas text-text-primary">
      {/* Sidebar Navigation Shell */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          vulkanAvailable={capabilities?.vulkanAvailable}
          vulkanDevice={capabilities?.vulkanDevice}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'workspace' && <WorkspaceScreen />}
          {activeTab === 'import' && <ImportScreen />}
          {activeTab === 'queue' && <QueueScreen />}
          {activeTab === 'history' && <HistoryScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </main>
      </div>

      {/* Dialogs and Overlays */}
      <KeyboardHelpDialog />
      <AboutDialog />
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
