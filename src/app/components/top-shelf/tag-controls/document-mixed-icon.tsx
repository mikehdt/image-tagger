// Custom icon for mixed delete state - document with +/- symbol
interface DocumentMixedIconProps {
  className?: string;
}

export const DocumentMixedIcon = ({ className }: DocumentMixedIconProps) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    aria-hidden="true"
  >
    {/* Document outline (based on Heroicons DocumentIcon) */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
    {/* Plus symbol (top half) - larger and more visible */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.5 10.5h4m-2-2v4"
    />
    {/* Minus symbol (bottom half) - larger and more visible */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.5 15.5h4"
    />
  </svg>
);
