export function HawkMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      fill="none"
    >
      <path
        d="M8 40 L32 10 L56 40 L44 40 L32 24 L20 40 Z"
        fill="#f4f4f5"
      />
      <path
        d="M18 44 L32 28 L46 44 L38 44 L32 36 L26 44 Z"
        fill="#d4d4d8"
      />
      <path
        d="M32 22 L38 28 L48 18"
        stroke="#f4f4f5"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="36" cy="18" r="2.4" fill="#07080b" />
    </svg>
  );
}
