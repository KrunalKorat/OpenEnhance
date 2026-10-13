import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  ContentProfile,
  FitMode,
  OutputPreset,
  QualityPreset,
  EngineStatus,
  EnhancementResult,
} from '@/types/api';
import type { AppPreferences } from '@/types/settings';
import type { MediaInfo } from '@/types/media';
import type { JobSummary, RecoverAction } from '@/types/jobs';
import {
  inspectMedia,
  generateThumbnail,
  getEngineStatus,
  runEnhancement,
  createJob,
  listJobs,
  cancelJob,
  pauseJob,
  resumeJob,
  retryJob,
  removeJob,
  clearCompletedJobs,
  startQueue,
  pauseQueue,
  recoverJobs,
  processQueueStep,
} from '@/lib/api';

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

  // Media Inspection & Video Import state
  currentMedia: MediaInfo | null;
  setCurrentMedia: (media: MediaInfo | null) => void;
  importedVideos: MediaInfo[];
  isInspecting: boolean;
  inspectionError: string | null;
  importVideoByPath: (path: string) => Promise<boolean>;
  clearCurrentMedia: () => void;

  // Phase 4 & 5 AI Engine & Export state
  engineStatus: EngineStatus | null;
  isEnhancing: boolean;
  enhancementProgress: { stage: string; percent: number; message: string } | null;
  lastEnhancementResult: EnhancementResult | null;
  startEnhancement: () => Promise<boolean>;
  dismissEnhancementResult: () => void;

  // Phase 6 Persistent Queue state & actions
  jobs: JobSummary[];
  isQueueRunning: boolean;
  fetchJobs: () => Promise<void>;
  addCurrentToQueue: () => Promise<JobSummary | null>;
  cancelJobAction: (jobId: string) => Promise<void>;
  pauseJobAction: (jobId: string) => Promise<void>;
  resumeJobAction: (jobId: string) => Promise<void>;
  retryJobAction: (jobId: string) => Promise<void>;
  removeJobAction: (jobId: string) => Promise<void>;
  clearCompletedAction: () => Promise<void>;
  toggleQueueRunningAction: () => Promise<void>;
  recoverJobsAction: (action: RecoverAction, jobId?: string) => Promise<void>;
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

  // Phase 3 Media state
  const [currentMedia, setCurrentMedia] = useState<MediaInfo | null>(null);
  const [importedVideos, setImportedVideos] = useState<MediaInfo[]>([]);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

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

  // Import video by path and run real FFprobe inspection & thumbnail extraction
  const importVideoByPath = async (path: string): Promise<boolean> => {
    if (!path.trim()) {
      addToast({
        type: 'error',
        title: 'Invalid Path',
        description: 'File path cannot be empty.',
      });
      return false;
    }

    if (currentMedia?.path === path) {
      addToast({
        type: 'info',
        title: 'Already Loaded',
        description: `"${currentMedia.fileName}" is already loaded in the studio.`,
      });
      setActiveTab('workspace');
      return true;
    }

    setIsInspecting(true);
    setInspectionError(null);

    try {
      const media = await inspectMedia(path);

      // Attempt thumbnail generation in background without blocking
      try {
        const thumbUrl = await generateThumbnail(path);
        media.thumbnailUrl = thumbUrl;
      } catch {
        // Thumbnail failure is non-fatal for inspection
      }

      setCurrentMedia(media);
      setImportedVideos((prev) => {
        const filtered = prev.filter((item) => item.path !== media.path);
        return [media, ...filtered];
      });

      addToast({
        type: 'success',
        title: 'Video Inspected',
        description: `${media.fileName} (${media.width}×${media.height}, ${media.videoCodec ?? 'video'})`,
      });

      setActiveTab('workspace');
      return true;
    } catch (err: unknown) {
      const errMsg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to inspect media file';
      setInspectionError(errMsg);
      addToast({
        type: 'error',
        title: 'Inspection Failed',
        description: errMsg,
        duration: 6000,
      });
      return false;
    } finally {
      setIsInspecting(false);
    }
  };

  const clearCurrentMedia = () => {
    setCurrentMedia(null);
    setInspectionError(null);
  };

  // Phase 4 & 5 AI Engine & Enhancement state
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancementProgress, setEnhancementProgress] = useState<{
    stage: string;
    percent: number;
    message: string;
  } | null>(null);
  const [lastEnhancementResult, setLastEnhancementResult] =
    useState<EnhancementResult | null>(null);

  useEffect(() => {
    getEngineStatus()
      .then(setEngineStatus)
      .catch(() => {});
  }, []);

  const dismissEnhancementResult = () => {
    setLastEnhancementResult(null);
  };

  const startEnhancement = async (): Promise<boolean> => {
    if (!currentMedia) {
      addToast({
        type: 'warning',
        title: 'No Video Selected',
        description: 'Please import a video first.',
      });
      return false;
    }

    setIsEnhancing(true);
    setEnhancementProgress({
      stage: 'probing',
      percent: 5,
      message: 'Inspecting media streams with FFprobe...',
    });

    try {
      const modelMap: Record<ContentProfile, string> = {
        general: 'realesrgan-x4plus',
        'live-action': 'realesrgan-x4plus',
        anime: 'realesrgan-x4plus-anime',
        animation: 'realesr-animevideov3',
      };
      const modelId = modelMap[profile] || 'realesrgan-x4plus';

      const baseName = currentMedia.fileName.replace(/\.[^/.]+$/, '');
      const inputDir = currentMedia.path.includes('\\')
        ? currentMedia.path.substring(0, currentMedia.path.lastIndexOf('\\'))
        : currentMedia.path.substring(0, currentMedia.path.lastIndexOf('/'));
      const ext = container === 'mkv' ? 'mkv' : 'mp4';
      const outputFolder = preferences.defaultOutputFolder || inputDir;
      const outputPath = `${outputFolder}\\${baseName}_${outputPreset}_enhanced.${ext}`;

      setEnhancementProgress({
        stage: 'upscaling',
        percent: 30,
        message: `Running Real-ESRGAN Vulkan inference (${modelId})...`,
      });

      const result = await runEnhancement({
        inputPath: currentMedia.path,
        outputPath,
        outputPreset,
        modelId,
        qualityPreset: quality,
        fitMode,
        container,
        audioPolicy,
        subtitlePolicy,
      });

      setLastEnhancementResult(result);
      await fetchJobs();

      addToast({
        type: 'success',
        title: 'Enhancement Complete',
        description: `Verified output: ${result.actualWidth}×${result.actualHeight} (${outputPreset.toUpperCase()})`,
        duration: 8000,
      });

      return true;
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Enhancement failed';
      addToast({
        type: 'error',
        title: 'Enhancement Failed',
        description: msg,
        duration: 8000,
      });
      return false;
    } finally {
      setIsEnhancing(false);
      setEnhancementProgress(null);
    }
  };

  // Phase 6 Persistent Job Queue State
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [isQueueRunning, setIsQueueRunning] = useState<boolean>(true);

  const fetchJobs = async () => {
    try {
      const list = await listJobs();
      setJobs(list);
    } catch (err) {
      console.error('Failed to list persistent jobs:', err);
    }
  };

  const addCurrentToQueue = async (): Promise<JobSummary | null> => {
    if (!currentMedia) {
      addToast({
        type: 'warning',
        title: 'No Media Selected',
        description: 'Please import or select a video first.',
      });
      return null;
    }

    const modelMap: Record<ContentProfile, string> = {
      general: 'realesrgan-x4plus',
      'live-action': 'realesrgan-x4plus',
      anime: 'realesrgan-x4plus-anime',
      animation: 'realesr-animevideov3',
    };
    const modelId = modelMap[profile] || 'realesrgan-x4plus';

    const baseName = currentMedia.fileName.replace(/\.[^/.]+$/, '');
    const inputDir = currentMedia.path.includes('\\')
      ? currentMedia.path.substring(0, currentMedia.path.lastIndexOf('\\'))
      : currentMedia.path.substring(0, currentMedia.path.lastIndexOf('/'));
    const ext = container === 'mkv' ? 'mkv' : 'mp4';
    const outputFolder = preferences.defaultOutputFolder || inputDir;
    const outputPath = `${outputFolder}\\${baseName}_${outputPreset}_enhanced.${ext}`;

    try {
      const created = await createJob({
        inputPath: currentMedia.path,
        outputPath,
        fileName: currentMedia.fileName,
        inputWidth: currentMedia.width,
        inputHeight: currentMedia.height,
        fps:
          currentMedia.frameRateNumerator && currentMedia.frameRateDenominator
            ? currentMedia.frameRateNumerator / currentMedia.frameRateDenominator
            : undefined,
        durationSecs: currentMedia.durationMs
          ? currentMedia.durationMs / 1000
          : undefined,
        resolutionPreset: outputPreset,
        model: modelId,
        encoder: 'libx264',
        qualityPreset: quality,
        fitMode,
        container,
        audioPolicy,
        subtitlePolicy,
      });

      await fetchJobs();
      addToast({
        type: 'success',
        title: 'Job Added to Queue',
        description: `${currentMedia.fileName} queued for ${outputPreset.toUpperCase()} (${modelId})`,
      });
      return created;
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to add job to queue';
      addToast({
        type: 'error',
        title: 'Queue Error',
        description: msg,
      });
      return null;
    }
  };

  const cancelJobAction = async (jobId: string) => {
    try {
      await cancelJob(jobId);
      await fetchJobs();
      addToast({
        type: 'info',
        title: 'Job Cancelled',
        description: `Job ${jobId.slice(0, 8)} cancellation requested.`,
      });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Cancellation failed';
      addToast({ type: 'error', title: 'Cancel Error', description: msg });
    }
  };

  const pauseJobAction = async (jobId: string) => {
    try {
      await pauseJob(jobId);
      await fetchJobs();
      addToast({
        type: 'info',
        title: 'Job Paused',
        description: `Job ${jobId.slice(0, 8)} paused at next safe checkpoint.`,
      });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Pause failed';
      addToast({ type: 'error', title: 'Pause Error', description: msg });
    }
  };

  const resumeJobAction = async (jobId: string) => {
    try {
      await resumeJob(jobId);
      await fetchJobs();
      addToast({
        type: 'info',
        title: 'Job Resumed',
        description: `Job ${jobId.slice(0, 8)} resumed.`,
      });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Resume failed';
      addToast({ type: 'error', title: 'Resume Error', description: msg });
    }
  };

  const retryJobAction = async (jobId: string) => {
    try {
      await retryJob(jobId);
      await fetchJobs();
      addToast({
        type: 'info',
        title: 'Job Retrying',
        description: `Job ${jobId.slice(0, 8)} returned to queue.`,
      });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Retry failed';
      addToast({ type: 'error', title: 'Retry Error', description: msg });
    }
  };

  const removeJobAction = async (jobId: string) => {
    try {
      await removeJob(jobId);
      await fetchJobs();
      addToast({
        type: 'info',
        title: 'Job Removed',
        description: 'Job removed from queue.',
      });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Remove failed';
      addToast({ type: 'error', title: 'Remove Error', description: msg });
    }
  };

  const clearCompletedAction = async () => {
    try {
      await clearCompletedJobs();
      await fetchJobs();
      addToast({
        type: 'info',
        title: 'Queue Cleaned',
        description: 'Completed and cancelled jobs cleared without removing files.',
      });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Clear failed';
      addToast({ type: 'error', title: 'Clear Error', description: msg });
    }
  };

  const toggleQueueRunningAction = async () => {
    try {
      if (isQueueRunning) {
        await pauseQueue();
        setIsQueueRunning(false);
        addToast({
          type: 'info',
          title: 'Queue Paused',
          description: 'Job queue processing has been paused.',
        });
      } else {
        await startQueue();
        setIsQueueRunning(true);
        addToast({
          type: 'info',
          title: 'Queue Started',
          description: 'Job queue processing is now active.',
        });
      }
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Toggle failed';
      addToast({ type: 'error', title: 'Queue Error', description: msg });
    }
  };

  const recoverJobsAction = async (action: RecoverAction, jobId?: string) => {
    try {
      const affected = await recoverJobs(action, jobId);
      await fetchJobs();
      addToast({
        type: 'success',
        title: 'Recovery Handled',
        description: `Applied ${action} to ${affected.length} interrupted job(s).`,
      });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Recovery failed';
      addToast({ type: 'error', title: 'Recovery Error', description: msg });
    }
  };

  // Convert persistent jobs into backward-compatible views for existing UI
  const queue: QueueItemData[] = jobs
    .filter((j) => j.state !== 'completed')
    .map((j) => ({
      id: j.id,
      fileName: j.fileName,
      inputResolution: `${j.inputWidth}×${j.inputHeight}`,
      targetPreset: j.resolutionPreset as OutputPreset,
      profile: j.model as ContentProfile,
      stage: (j.stage as string) || 'queued',
      status: (j.state === 'running' || j.state === 'finalizing'
        ? 'running'
        : j.state === 'completed'
          ? 'succeeded'
          : j.state === 'failed'
            ? 'failed'
            : j.state === 'cancelled'
              ? 'cancelled'
              : 'queued') as QueueItemData['status'],
      progress: j.progressPercent,
      elapsedMs: undefined,
    }));

  const history: HistoryItemData[] = jobs
    .filter((j) => j.state === 'completed')
    .map((j) => ({
      id: j.id,
      fileName: j.fileName,
      sourceResolution: `${j.inputWidth}×${j.inputHeight}`,
      outputResolution: j.resolutionPreset.toUpperCase(),
      completedAt: j.completedAt
        ? new Date(j.completedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
      outputPath: j.outputPath || '',
      status: 'succeeded',
      fileSizeBytes: 0,
    }));

  const clearHistory = () => {
    clearCompletedAction();
  };

  // Initial fetch and background queue ticker
  useEffect(() => {
    fetchJobs();

    const interval = setInterval(async () => {
      const hasPendingOrActive = jobs.some((j) =>
        [
          'queued',
          'preparing',
          'running',
          'finalizing',
          'pausing',
          'cancelling',
        ].includes(j.state)
      );
      if (hasPendingOrActive && isQueueRunning) {
        try {
          await processQueueStep();
          await fetchJobs();
        } catch {
          // ignore background step errors
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobs, isQueueRunning]);

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
        currentMedia,
        setCurrentMedia,
        importedVideos,
        isInspecting,
        inspectionError,
        importVideoByPath,
        clearCurrentMedia,
        engineStatus,
        isEnhancing,
        enhancementProgress,
        lastEnhancementResult,
        startEnhancement,
        dismissEnhancementResult,
        jobs,
        isQueueRunning,
        fetchJobs,
        addCurrentToQueue,
        cancelJobAction,
        pauseJobAction,
        resumeJobAction,
        retryJobAction,
        removeJobAction,
        clearCompletedAction,
        toggleQueueRunningAction,
        recoverJobsAction,
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
