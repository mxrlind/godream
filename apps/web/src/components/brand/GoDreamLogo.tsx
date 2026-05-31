interface GoDreamLogoProps {
  size?: number;
  className?: string;
}

export function GoDreamLogo({ size = 32, className = '' }: GoDreamLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* House/dream shape base */}
      <path
        d="M16 3L28 12V29H4V12L16 3Z"
        fill="url(#godream-grad)"
        opacity="0.15"
      />
      {/* Roof stroke */}
      <path
        d="M16 3L28 12"
        stroke="#00e5ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 3L4 12"
        stroke="#00e5ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Left wall */}
      <path
        d="M4 12V29"
        stroke="#00e5ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Right wall */}
      <path
        d="M28 12V29"
        stroke="#00e5ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Floor */}
      <path
        d="M4 29H28"
        stroke="#00e5ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Star / dream spark inside */}
      <circle cx="16" cy="19" r="4" fill="#00e5ff" opacity="0.9" />
      <circle cx="16" cy="19" r="2" fill="#7c5cff" />
      {/* Shine dot top of star */}
      <circle cx="16" cy="8" r="1.5" fill="#00e5ff" />
      <defs>
        <linearGradient id="godream-grad" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#7c5cff" />
        </linearGradient>
      </defs>
    </svg>
  );
}
