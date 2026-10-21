interface BrandLogoProps {
  className?: string;
}

/** Gold coin brand mark rendered as inline SVG (no external asset required). */
export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="brand-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FAE3A3" />
          <stop offset="50%" stopColor="#F2B93B" />
          <stop offset="100%" stopColor="#B87D12" />
        </linearGradient>
        <linearGradient id="brand-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#brand-gold)" />
      <rect x="2" y="2" width="36" height="18" rx="11" fill="url(#brand-shine)" opacity="0.5" />
      <path
        d="M11 26.5 L16.5 19 L21 23 L29 13"
        fill="none"
        stroke="#0B0F1A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="29" cy="13" r="2.4" fill="#0B0F1A" />
    </svg>
  );
}
