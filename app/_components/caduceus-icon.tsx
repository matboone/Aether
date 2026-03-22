interface CaduceusIconProps {
  size?: number;
  className?: string;
}

export function CaduceusIcon({ size = 24, className }: CaduceusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Staff */}
      <rect x="30" y="12" width="4" height="44" rx="2" />
      {/* Base */}
      <rect x="24" y="54" width="16" height="4" rx="2" />
      {/* Top orb */}
      <circle cx="32" cy="8" r="4" />
      {/* Left wing */}
      <path d="M28 14c-3-2-8-5-14-3 1 3 5 5 8 5l6-2Z" />
      <path d="M26 11c-3-3-9-6-16-3 1 4 6 6 10 5l6-2Z" />
      {/* Right wing */}
      <path d="M36 14c3-2 8-5 14-3-1 3-5 5-8 5l-6-2Z" />
      <path d="M38 11c3-3 9-6 16-3-1 4-6 6-10 5l-6-2Z" />
      {/* Left snake */}
      <path
        d="M32 18c-5 0-10 3-10 7s5 7 10 7 10 3 10 7-5 7-10 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Right snake */}
      <path
        d="M32 18c5 0 10 3 10 7s-5 7-10 7-10 3-10 7 5 7 10 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
