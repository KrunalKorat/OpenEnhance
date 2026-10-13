import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ContentProfile, FitMode, OutputPreset, QualityPreset } from '@/types/api';
import type { AppPreferences } from '@/types/settings';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
}

export interface QueueItemData {
  id: string;
  fileName: string;
  inputResolution: string;
  targetPreset: OutputPreset;
  profile: ContentProfile;
  stage: string;
  status: 'queued' | 'preparing' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress?: number;
  elapsedMs?: number;
}

export interface HistoryItemData {
  id: string;
  fileName: string;
  sourceResolution: string;
  outputResolution: string;
  completedAt: string;
  outputPath: string;
  status: 'succeeded' | 'failed';
  fileSizeBytes: number;
}

interface AppContextValue {
  activeTab: 'workspace' | 'import' | 'queue' | 'history' | 'settings';
  setActiveTab: (tab: 'workspace' | 'import' | 'queue' | 'history' | 'settings') => void;
  outputPreset: OutputPreset;
  setOutputPreset: (preset: OutputPreset) => void;
  profile: ContentProfile;
  setProfile: (profile: ContentProfile) => void;
  quality: QualityPreset;
  setQuality: (quality: QualityPreset) => void;
  fitMode: FitMode;
  setFitMode: (mode: FitMode) => void;
  container: 'mp4' | 'mkv';
  setContainer: (container: 'mp4' | 'mkv') => void;
  audioPolicy: 'preserve' | 'remove' | 'select';
  setAudioPolicy: (policy: 'preserve' | 'remove' | 'select') => void;
  subtitlePolicy: 'preserve-supported' | 'remove' | 'select';
  setSubtitlePolicy: (policy: 'preserve-supported' | 'remove' | 'select') => void;
  preferences: AppPreferences;
  updatePreferences: (partial: Partial<AppPreferences>) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  queue: QueueItemData[];
  history: HistoryItemData[];
  clearHistory: () => void;
  isKeyboardHelpOpen: boolean;
  setIsKeyboardHelpOpen: (open: boolean) => void;
  isAboutOpen: boolean;
  setIsAboutOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<
    'workspace' | 'import' | 'queue' | 'history' | 'settings'
  >('workspace');
  const [outputPreset, setOutputPreset] = useState<OutputPreset>('4k');
  const [profile, setProfile] = useState<ContentProfile>('general');
  const [quality, setQuality] = useState<QualityPreset>('high');
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [container, setContainer] = useState<'mp4' | 'mkv'>('mp4');
  const [audioPolicy, setAudioPolicy] = useState<'preserve' | 'remove' | 'select'>(
    'preserve'
  );
  const [subtitlePolicy, setSubtitlePolicy] = useState<
    'preserve-supported' | 'remove' | 'select'
  >('preserve-supported');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: 'dark',
    defaultOutputFolder: 'C:\\Users\\Videos\\Enhanced',
    tempDirectory: 'C:\\Users\\AppData\\Local\\Temp\\OpenEnhance',
    concurrencyLimit: 1,
    autoCleanTemp: true,
    prefersReducedMotion: false,
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updatePreferences = (partial: Partial<AppPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
    addToast({
      type: 'success',
      title: 'Preferences Updated',
      description: 'Settings have been updated for this session.',
      duration: 3000,
    });
  };

  // Sample queue items for Phase 2 UI Demonstration (without simulating fake enhancement)
  const [queue] = useState<QueueItemData[]>([]);

  // History list with clear function
  const [history, setHistory] = useState<HistoryItemData[]>([]);

  const clearHistory = () => {
    setHistory([]);
    addToast({
      type: 'info',
      title: 'History Cleared',
      description: 'Completed job history has been reset.',
    });
  };

  // Keyboard shortcut listener for '?'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '?' || (e.key === '/' && e.ctrlKey)) &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsKeyboardHelpOpen(true);
      } else if (e.key === 'Escape') {
        setIsKeyboardHelpOpen(false);
        setIsAboutOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        outputPreset,
        setOutputPreset,
        profile,
        setProfile,
        quality,
        setQuality,
        fitMode,
        setFitMode,
        container,
        setContainer,
        audioPolicy,
        setAudioPolicy,
        subtitlePolicy,
        setSubtitlePolicy,
        preferences,
        updatePreferences,
        toasts,
        addToast,
        removeToast,
        queue,
        history,
        clearHistory,
        isKeyboardHelpOpen,
        setIsKeyboardHelpOpen,
        isAboutOpen,
        setIsAboutOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
