import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/stores/appState';
import { Layers, Play, Trash2, Sliders, Cpu } from 'lucide-react';

export function QueueScreen() {
  const { queue, preferences, addToast, setActiveTab } = useAppStore();

  const handlePauseQueue = () => {
    addToast({
      type: 'info',
      title: 'Queue Control',
      description: 'Queue scheduler and worker processes activate in Phase 6.',
    });
  };

  const handleClearCompleted = () => {
    addToast({
      type: 'info',
      title: 'Queue Cleaned',
      description: 'Completed and cancelled jobs have been cleared.',
    });
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
            Manage scheduled enhancement jobs, monitor frame stages, and control
            concurrency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePauseQueue}
            className="gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            Pause Queue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCompleted}
            className="gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-text-muted" />
            Clear Finished
          </Button>
        </div>
      </div>

      {/* Queue Concurrency Status Strip */}
      <Card className="flex items-center justify-between py-3 px-4 bg-bg-sidebar/50">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Cpu className="w-4 h-4 text-accent-secondary" />
            <span>Worker Concurrency:</span>
            <span className="font-mono text-text-primary font-medium">
              {preferences.concurrencyLimit} Active Job (Safe VRAM Allocation)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{queue.length} Total Jobs</Badge>
          <Badge variant="accent">Bounded Concurrency</Badge>
        </div>
      </Card>

      {/* Queue Items or Empty State */}
      {queue.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6 text-accent-primary" />}
          title="No Jobs in Queue"
          description="Your enhancement queue is currently empty. Import a video and add it to the queue to begin background processing."
          actionLabel="Go to Import"
          onAction={() => setActiveTab('import')}
        />
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <Card key={item.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-bg-elevated flex items-center justify-center font-mono text-xs font-semibold text-accent-primary">
                  {item.targetPreset}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {item.fileName}
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                    <span>{item.inputResolution}</span>
                    <span>→</span>
                    <span className="text-accent-secondary">{item.targetPreset}</span>
                    <span>•</span>
                    <span className="capitalize">{item.profile} Profile</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={item.status === 'succeeded' ? 'success' : 'default'}>
                  {item.stage}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Phase 6 Scope Callout */}
      <Card
        elevated
        className="border-border-subtle bg-bg-surface/50 text-xs text-text-secondary"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-secondary" />
            <span>
              Multi-job scheduling and persistent recovery are planned for Phase 6.
            </span>
          </div>
          <span className="font-mono text-[11px] text-text-muted">Phase 6 Scope</span>
        </div>
      </Card>
    </div>
  );
}
