export default function Logo({ size = 36, withWordmark = true, variant = 'light', className = '' }) {
  const isDark = variant === 'dark'
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <rect width="40" height="40" rx="11" fill={isDark ? '#1F2433' : '#14171F'} />
        <rect x="4" y="4" width="8" height="8" rx="2" fill="#2B84F5" />
        <rect x="14" y="4" width="8" height="8" rx="2" fill="#262C3D" />
        <rect x="24" y="4" width="8" height="8" rx="2" fill="#2B84F5" />
        <path
          d="M9 26.5c0-1.2.5-2.3 1.3-3.1l1.9-4.2A3 3 0 0 1 15 17.4h10a3 3 0 0 1 2.8 1.9l1.9 4.2c.8.8 1.3 1.9 1.3 3.1v3.4a1.6 1.6 0 0 1-1.6 1.6h-1a1.6 1.6 0 0 1-1.6-1.6v-.9H12.2v.9a1.6 1.6 0 0 1-1.6 1.6h-1A1.6 1.6 0 0 1 8 29.9v-3.4Z"
          fill="#2B84F5"
        />
        <circle cx="13.5" cy="27" r="1.7" fill="#14171F" />
        <circle cx="26.5" cy="27" r="1.7" fill="#14171F" />
      </svg>
      {withWordmark && (
        <p className={`font-display text-[15px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-ink-900'}`}>
          NexoraTaxis
        </p>
      )}
    </div>
  )
}
