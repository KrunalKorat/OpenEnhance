export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex p-1 bg-bg-canvas border border-border-subtle rounded-control w-full gap-1"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex flex-col items-center justify-center rounded-[6px] font-medium transition-all duration-150 ${
              size === 'sm' ? 'py-1 px-2 text-xs' : 'py-2 px-3 text-sm'
            } ${
              isSelected
                ? 'bg-bg-elevated text-accent-primary shadow-sm border border-border-subtle/80 font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/50'
            }`}
          >
            <span>{opt.label}</span>
            {opt.sublabel && (
              <span className="text-[10px] text-text-muted mt-0.5 font-normal">
                {opt.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
