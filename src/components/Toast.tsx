import { useAppStore } from '@/stores/appState';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-status-error shrink-0" />,
    info: <Info className="w-4 h-4 text-accent-primary shrink-0" />,
  };

  const borders = {
    success: 'border-status-success/40',
    warning: 'border-status-warning/40',
    error: 'border-status-error/40',
    info: 'border-accent-primary/40',
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-control bg-bg-elevated border ${borders[toast.type]} shadow-xl text-text-primary animate-in slide-in-from-bottom-2 duration-150`}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold leading-tight">{toast.title}</h4>
            {toast.description && (
              <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
