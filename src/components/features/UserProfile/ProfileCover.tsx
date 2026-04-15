type ProfileCoverProps = {
  bannerUrl?: string
  bannerAlt?: string
}

export function ProfileCover({
  bannerUrl,
  bannerAlt = '',
}: ProfileCoverProps) {
  if (bannerUrl) {
    return (
      <div className="relative h-28 w-full bg-slate-200 sm:h-36 dark:bg-slate-800">
        <img
          src={bannerUrl}
          alt={bannerAlt}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className="h-28 w-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 sm:h-36"
      aria-hidden
    />
  )
}
