import { memo } from 'react';

type SchedulerSparklineProps = {
  /** Normalised values 0-1, typically 16 points */
  curve: number[];
  width?: number;
  height?: number;
  className?: string;
};

const SchedulerSparklineComponent = ({
  curve,
  width = 60,
  height = 16,
  className = '',
}: SchedulerSparklineProps) => {
  if (curve.length < 2) return null;

  const padding = 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = curve
    .map((value, i) => {
      const x = padding + (i / (curve.length - 1)) * innerWidth;
      const y = padding + (1 - value) * innerHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`inline-block ${className}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SchedulerSparkline = memo(SchedulerSparklineComponent);
