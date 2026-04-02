interface BadgeProps {
  icon: string
  name: string
  description?: string
  size?: 'sm' | 'md'
}

export default function Badge({ icon, name, description, size = 'md' }: BadgeProps) {
  if (size === 'sm') {
    return (
      <span
        title={description ? `${name}: ${description}` : name}
        className="inline-flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full px-2 py-0.5 text-xs text-[var(--text-primary)]"
      >
        <span>{icon}</span>
        <span className="hidden sm:inline">{name}</span>
      </span>
    )
  }

  return (
    <div
      title={description}
      className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
        {description && <p className="text-xs text-[var(--text-secondary)]">{description}</p>}
      </div>
    </div>
  )
}
