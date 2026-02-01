type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex w-full items-center rounded-sm shadow-md inset-shadow-xs shadow-white inset-shadow-slate-300 dark:shadow-slate-600/50 dark:inset-shadow-slate-800">
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        const roundedClasses = isFirst
          ? 'rounded-l-sm'
          : isLast
            ? 'rounded-r-sm'
            : '';

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-auto cursor-pointer items-center px-2 py-1 transition-colors ${roundedClasses} ${
              isSelected
                ? 'z-10 bg-white shadow-sm shadow-slate-300 dark:bg-slate-500 dark:inset-shadow-xs dark:shadow-slate-800 dark:inset-shadow-slate-400'
                : 'hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
