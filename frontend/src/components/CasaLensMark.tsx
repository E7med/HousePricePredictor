export function CasaLensMark({ className = 'brand-mark' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1.25" y="1.25" width="29.5" height="29.5" rx="8" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M8.4 18.2 16 11.6l7.6 6.6v6.2H8.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19.2" r="3.35" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="16" cy="19.2" r="1.15" fill="currentColor" />
    </svg>
  )
}
