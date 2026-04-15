import { useMemo } from 'react'

type AvatarSize = 'sm' | 'md' | 'lg'

const sizeClass: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

const ringClass: Record<'online' | 'away' | 'offline' | 'none', string> = {
  online: 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950',
  away: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950',
  offline: 'ring-2 ring-slate-300 ring-offset-2 ring-offset-white dark:ring-slate-600 dark:ring-offset-slate-950',
  none: '',
}

export type AvatarProps = {
  name: string
  src?: string
  size?: AvatarSize
  status?: 'online' | 'away' | 'offline' | 'none'
  className?: string
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ name, src, size = 'md', status = 'none', className = '' }: AvatarProps) {
  const initials = useMemo(() => initialsFromName(name), [name])
  const ring = ringClass[status]

  if (src) {
    return (
      <span className={`relative inline-flex shrink-0 rounded-full ${ring} ${className}`}>
        <img
          src={src}
          alt=""
          className={`rounded-full object-cover ${sizeClass[size]}`}
        />
        <span className="sr-only">{name}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200 ${sizeClass[size]} ${ring} ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  )
}
