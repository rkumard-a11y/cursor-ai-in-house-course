type ProfileBioProps = {
  bioText: string
  descId: string
}

export function ProfileBio({ bioText, descId }: ProfileBioProps) {
  if (bioText) {
    return (
      <p
        id={descId}
        className="mt-5 max-w-2xl text-center text-sm leading-relaxed text-slate-700 sm:text-left dark:text-slate-300"
      >
        {bioText}
      </p>
    )
  }

  return (
    <p
      id={descId}
      className="mt-5 text-center text-sm italic text-slate-400 sm:text-left dark:text-slate-500"
    >
      No bio yet.
    </p>
  )
}
