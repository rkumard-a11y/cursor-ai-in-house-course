export function VerifiedBadge() {
  return (
    <span
      className="inline-flex shrink-0 text-violet-600 dark:text-violet-400"
      title="Verified account"
      aria-label="Verified account"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-3.8a.75.75 0 0 1 .04 1.06l-5.25 6a.75.75 0 0 1-1.08.02L8.47 12.53a.75.75 0 1 1 1.06-1.06l.522.522 4.7-5.38a.75.75 0 0 1 1.06-.04Z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  )
}
