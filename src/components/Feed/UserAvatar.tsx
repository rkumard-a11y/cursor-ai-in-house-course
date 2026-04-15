import { useMemo } from 'react'

type UserAvatarProps = {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
} as const

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function UserAvatar({ name, src, size = 'md', className = '' }: UserAvatarProps) {
  const initials = useMemo(() => initialsFromName(name), [name])
  const ring = 'ring-2 ring-white dark:ring-slate-900'

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover ${ring} ${className}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-bold text-white shadow-inner ${ring} ${sizeClasses[size]} ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  )
}
