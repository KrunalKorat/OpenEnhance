import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/stores/appState';
import { History, Trash2, Folder, ExternalLink } from 'lucide-react';
import { formatBytes } from '@/lib/formatting';
import { revealInFolder, openOutput } from '@/lib/api';

export function HistoryScreen() {
  const { history, clearHistory, addToast, setActiveTab } = useAppStore();

  const handleOpenFolder = async (path: string) => {
    try {
      await revealInFolder(path);
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Could Not Open Folder',
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handlePlayVideo = async (path: string) => {
    try {
      await openOutput(path);
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Could Not Play Video',
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Enhancement History
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Log of completed, verified exports and output files saved locally.
          </p>
        </div>

        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} className="gap-2">
            <Trash2 className="w-3.5 h-3.5 text-text-muted" />
            Clear History
          </Button>
        )}
      </div>

      {/* History Items or Empty State */}
      {history.length === 0 ? (
        <EmptyState
          icon={<History className="w-6 h-6 text-accent-secondary" />}
          title="No Processed Videos Yet"
          description="Your enhancement history is empty. Completed video jobs will be stored locally with verified output dimensions and file sizes."
          actionLabel="Start Enhancing in Studio"
          onAction={() => setActiveTab('workspace')}
        />
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-control bg-status-success/10 text-status-success flex items-center justify-center font-bold text-xs border border-status-success/20">
                  {item.outputResolution}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {item.fileName}
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                    <span>From {item.sourceResolution}</span>
                    <span>→</span>
                    <span className="text-status-success font-medium">
                      {item.outputResolution}
                    </span>
                    <span>•</span>
                    <span>{formatBytes(item.fileSizeBytes)}</span>
                    <span>•</span>
                    <span>{item.completedAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenFolder(item.outputPath)}
                  className="gap-1.5"
                >
                  <Folder className="w-3.5 h-3.5" />
                  Show in Folder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlayVideo(item.outputPath)}
                  className="gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Play
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Persistence Note */}
      <Card className="bg-bg-sidebar/40 border-border-subtle text-xs text-text-muted flex items-center justify-between">
        <span>
          Persistent job history stored locally in %LOCALAPPDATA%\OpenEnhance\jobs.json.
        </span>
        <Badge variant="accent">Durable Store</Badge>
      </Card>
    </div>
  );
}
