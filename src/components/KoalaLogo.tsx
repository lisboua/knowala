interface KoalaLogoProps {
  className?: string
}

export default function KoalaLogo({ className }: KoalaLogoProps) {
  return (
    <svg
      viewBox="0 0 32 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left ear */}
      <circle cx="8.5" cy="7" r="5.5" stroke="currentColor" strokeWidth="2.2" />

      {/* Right ear */}
      <circle cx="23.5" cy="7" r="5.5" stroke="currentColor" strokeWidth="2.2" />

      {/* Head */}
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2.2" />

      {/* Body */}
      <ellipse cx="16" cy="32" rx="9" ry="8" stroke="currentColor" strokeWidth="2.2" />

      {/* Right arm raised — elbow out, paw resting near chin (thinking pose) */}
      <path
        d="M 22,27 C 27,23 27,18 21,20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Paw near chin */}
      <circle cx="20.5" cy="20.5" r="1.8" fill="currentColor" />

      {/* Eyes */}
      <circle cx="13" cy="14.5" r="1.2" fill="currentColor" />
      <circle cx="19" cy="14.5" r="1.2" fill="currentColor" />

      {/* Nose — grande, característica do coala */}
      <ellipse cx="16" cy="18" rx="2.8" ry="1.8" fill="currentColor" />

      {/* Left foot */}
      <ellipse cx="11" cy="39" rx="3.5" ry="2" stroke="currentColor" strokeWidth="2" />

      {/* Right foot */}
      <ellipse cx="21" cy="39" rx="3.5" ry="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
