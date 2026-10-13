import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/stores/appState';
import {
  Layers,
  Play,
  Pause,
  Trash2,
  Cpu,
  RotateCcw,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export function QueueScreen() {
  const {
    jobs,
    isQueueRunning,
    toggleQueueRunningAction,
    clearCompletedAction,
    cancelJobAction,
    pauseJobAction,
    resumeJobAction,
    retryJobAction,
    removeJobAction,
    recoverJobsAction,
    preferences,
    setActiveTab,
  } = useAppStore();

  const activeJobs = jobs.filter(
    (j) => !['completed', 'failed', 'cancelled'].includes(j.state)
  );
  const interruptedJobs = jobs.filter(
    (j) => j.canRecover || j.state === 'interrupted' || j.state === 'recoverable'
  );

  const getBadgeVariant = (state: string) => {
    switch (state) {
      case 'completed':
        return 'success';
      case 'running':
      case 'finalizing':
        return 'accent';
      case 'failed':
      case 'interrupted':
        return 'error';
      case 'paused':
      case 'pausing':
      case 'recoverable':
        return 'warning';
      case 'cancelled':
      case 'cancelling':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Queue Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Batch Processing Queue
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Durable SQLite/JSON persistent job storage with bounded concurrency and crash
            recovery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isQueueRunning ? 'secondary' : 'primary'}
            size="sm"
            onClick={toggleQueueRunningAction}
            className="gap-2"
          >
            {isQueueRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause Queue
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Start Queue
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCompletedAction}
            className="gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-text-muted" />
            Clear Finished
          </Button>
        </div>
      </div>

      {/* Crash Recovery Notification Banner */}
      {interruptedJobs.length > 0 && (
        <Card className="border-status-warning/40 bg-status-warning/10 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Interrupted Jobs Detected ({interruptedJobs.length})
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Previous execution ended unexpectedly. Intermediate files were verified
                  to protect existing source files.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => recoverJobsAction('resume')}
                className="gap-1.5 text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                Resume Safe Checkpoints
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => recoverJobsAction('retry')}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => recoverJobsAction('discard')}
                className="gap-1.5 text-xs text-text-muted hover:text-status-error"
              >
                Discard
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Queue Concurrency Status Strip */}
      <Card className="flex items-center justify-between py-3 px-4 bg-bg-sidebar/50">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Cpu className="w-4 h-4 text-accent-secondary" />
            <span>Worker Concurrency:</span>
            <span className="font-mono text-text-primary font-medium">
              {preferences.concurrencyLimit} Active Job (Protected GPU Memory)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{activeJobs.length} Active / Pending</Badge>
          <Badge variant={isQueueRunning ? 'success' : 'warning'}>
            {isQueueRunning ? 'Worker Active' : 'Queue Paused'}
          </Badge>
        </div>
      </Card>

      {/* Queue Items or Empty State */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6 text-accent-primary" />}
          title="No Jobs in Queue"
          description="Your enhancement queue is currently empty. Import a video and add it to the queue to begin background processing."
          actionLabel="Go to Studio"
          onAction={() => setActiveTab('workspace')}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-control bg-bg-elevated flex items-center justify-center font-mono text-xs font-semibold text-accent-primary shrink-0">
                    {job.resolutionPreset.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <span>{job.fileName}</span>
                      <span className="font-mono text-[10px] text-text-muted">
                        #{job.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                      <span>
                        {job.inputWidth}×{job.inputHeight}
                      </span>
                      <span>→</span>
                      <span className="text-accent-secondary font-medium">
                        {job.resolutionPreset.toUpperCase()}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{job.model}</span>
                      {job.fps ? <span>• {job.fps.toFixed(1)} fps</span> : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(job.state)} className="capitalize">
                    {job.state}
                  </Badge>
                </div>
              </div>

              {/* Progress and Stage Details */}
              <div className="space-y-1.5 bg-bg-surface/50 p-3 rounded border border-border-subtle/50 text-xs">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    {job.state === 'running' ? (
                      <Sparkles className="w-3.5 h-3.5 text-accent-primary animate-pulse" />
                    ) : job.state === 'completed' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                    )}
                    <span>Stage: {job.stage}</span>
                  </span>
                  <span className="font-mono font-medium text-text-primary">
                    {job.progressPercent.toFixed(1)}%
                    {job.totalFrames && job.totalFrames > 0 ? (
                      <span className="text-text-muted font-normal ml-1">
                        ({job.processedFrames ?? 0} / {job.totalFrames} frames)
                      </span>
                    ) : null}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.state === 'completed'
                        ? 'bg-status-success'
                        : job.state === 'failed' || job.state === 'interrupted'
                          ? 'bg-status-error'
                          : 'bg-accent-primary'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, job.progressPercent))}%`,
                    }}
                  />
                </div>

                {/* Error Banner if any */}
                {job.errorMessage && (
                  <div className="text-[11px] text-status-error font-mono bg-status-error/10 p-2 rounded border border-status-error/20 mt-2">
                    {job.errorMessage}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-text-muted font-mono truncate max-w-sm">
                  {job.outputPath
                    ? `Output: ${job.outputPath}`
                    : `Input: ${job.inputPath}`}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Pause / Resume */}
                  {['running', 'preparing'].includes(job.state) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pauseJobAction(job.id)}
                      className="gap-1 text-xs h-7 px-2"
                    >
                      <Pause className="w-3 h-3" />
                      Pause
                    </Button>
                  )}
                  {job.state === 'paused' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => resumeJobAction(job.id)}
                      className="gap-1 text-xs h-7 px-2"
                    >
                      <Play className="w-3 h-3" />
                      Resume
                    </Button>
                  )}

                  {/* Retry */}
                  {['failed', 'cancelled', 'interrupted', 'recoverable'].includes(
                    job.state
                  ) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => retryJobAction(job.id)}
                      className="gap-1 text-xs h-7 px-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry
                    </Button>
                  )}

                  {/* Cancel */}
                  {['queued', 'preparing', 'running', 'pausing', 'paused'].includes(
                    job.state
                  ) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelJobAction(job.id)}
                      className="gap-1 text-xs h-7 px-2 text-text-muted hover:text-status-error"
                    >
                      <XCircle className="w-3 h-3" />
                      Cancel
                    </Button>
                  )}

                  {/* Remove */}
                  {!['running', 'preparing', 'finalizing'].includes(job.state) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeJobAction(job.id)}
                      className="gap-1 text-xs h-7 px-2 text-text-muted hover:text-status-error"
                      title="Remove from Queue"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
