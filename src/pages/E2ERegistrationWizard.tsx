/**
 * E2E-only multi-step registration demo. Open with: `/?e2e=registration`
 */
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react'

const LS_USERS = 'e2e_reg_wizard_users'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUBMIT_FAILURE_EMAIL = 'failure@registration.test'

type Step = 1 | 2 | 3

type FieldKey = 'fullName' | 'email' | 'password' | 'confirmPassword'

type Users = Record<string, { name: string }>

function loadUsers(): Users {
  try {
    const raw = localStorage.getItem(LS_USERS)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Users
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveUsers(users: Users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users))
}

function validateStep1(fullName: string, email: string): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {}
  const name = fullName.trim()
  if (!name) e.fullName = 'Full name is required.'
  else if (name.length < 2) e.fullName = 'Full name must be at least 2 characters.'
  else if (name.length > 80) e.fullName = 'Full name must be at most 80 characters.'
  const em = email.trim().toLowerCase()
  if (!em) e.email = 'Email is required.'
  else if (!EMAIL_RE.test(em)) e.email = 'Enter a valid email address.'
  return e
}

function validateStep2(password: string, confirmPassword: string): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {}
  if (!password) e.password = 'Password is required.'
  else if (password.length < 8) e.password = 'Password must be at least 8 characters.'
  else if (password.length > 64) e.password = 'Password must be at most 64 characters.'
  if (!confirmPassword) e.confirmPassword = 'Confirm your password.'
  else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.'
  return e
}

export function E2ERegistrationWizard() {
  const formId = useId()
  const fullNameId = `${formId}-fullName`
  const emailId = `${formId}-email`
  const passwordId = `${formId}-password`
  const confirmId = `${formId}-confirm`

  const [step, setStep] = useState<Step>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  /** Avoid the same pointer-up activating "Complete" immediately after "Next" (layout swap). */
  const [finalSubmitEnabled, setFinalSubmitEnabled] = useState(false)

  useEffect(() => {
    if (step !== 3) {
      setFinalSubmitEnabled(false)
      return
    }
    const id = window.setTimeout(() => setFinalSubmitEnabled(true), 150)
    return () => window.clearTimeout(id)
  }, [step])

  const clearFieldError = useCallback((key: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const goNext = useCallback(() => {
    setFormError(null)
    if (step === 1) {
      const err = validateStep1(fullName, email)
      setFieldErrors(err)
      if (Object.keys(err).length > 0) return
      setStep(2)
      return
    }
    if (step === 2) {
      const err = validateStep2(password, confirmPassword)
      setFieldErrors(err)
      if (Object.keys(err).length > 0) return
      setStep(3)
    }
  }, [step, fullName, email, password, confirmPassword])

  const goPrevious = useCallback(() => {
    setFormError(null)
    setFieldErrors({})
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }, [step])

  const onFinalSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      setFormError(null)
      const err = { ...validateStep1(fullName, email), ...validateStep2(password, confirmPassword) }
      if (Object.keys(err).length > 0) {
        setFieldErrors(err)
        return
      }
      const em = email.trim().toLowerCase()
      if (em === SUBMIT_FAILURE_EMAIL) {
        setFormError('Registration could not be completed. Please try again later.')
        return
      }
      const users = loadUsers()
      if (users[em]) {
        setFormError('An account with this email already exists.')
        return
      }
      users[em] = { name: fullName.trim() }
      saveUsers(users)
      setSuccess(true)
    },
    [fullName, email, password, confirmPassword],
  )

  const resetWizard = useCallback(() => {
    setStep(1)
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFieldErrors({})
    setFormError(null)
    setSuccess(false)
  }, [])

  const stepLabels = useMemo(
    () => [
      { n: 1 as const, label: 'Account' },
      { n: 2 as const, label: 'Security' },
      { n: 3 as const, label: 'Review' },
    ],
    [],
  )

  if (success) {
    return (
      <div
        className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
        data-testid="e2e-registration-app"
      >
        <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <div
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/40"
            role="status"
            aria-live="polite"
            data-testid="registration-success"
          >
            <h1 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100" data-testid="registration-success-heading">
              You&apos;re registered
            </h1>
            <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
              Welcome, {fullName.trim()}. A confirmation was sent to {email.trim()}.
            </p>
            <button
              type="button"
              data-testid="registration-start-over"
              className="mt-6 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
              onClick={resetWizard}
            >
              Register another account
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
      data-testid="e2e-registration-app"
    >
      <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">E2E harness</p>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Multi-step registration</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <nav aria-label="Registration progress" className="mb-8">
          <ol className="flex flex-wrap gap-2 text-sm" data-testid="registration-step-indicator">
            {stepLabels.map(({ n, label }) => (
              <li
                key={n}
                className={`rounded-full px-3 py-1 font-medium ${
                  step === n
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
                aria-current={step === n ? 'step' : undefined}
                data-testid={`registration-step-${n}`}
              >
                {n}. {label}
              </li>
            ))}
          </ol>
        </nav>

        {formError ? (
          <div
            className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100"
            role="alert"
            aria-live="assertive"
            data-testid="registration-form-error"
          >
            {formError}
          </div>
        ) : null}

        <section
          aria-labelledby={`${formId}-step-heading`}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          data-testid="registration-step-panel"
        >
          <h2 id={`${formId}-step-heading`} className="text-xl font-semibold">
            {step === 1 ? 'Account details' : null}
            {step === 2 ? 'Choose a password' : null}
            {step === 3 ? 'Review and submit' : null}
          </h2>

          <form className="mt-6 space-y-4" onSubmit={step === 3 ? onFinalSubmit : (e) => e.preventDefault()} noValidate>
            {step === 1 ? (
              <>
                <div>
                  <label className="text-sm font-semibold" htmlFor={fullNameId}>
                    Full name
                  </label>
                  <input
                    id={fullNameId}
                    data-testid="reg-wizard-full-name"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      clearFieldError('fullName')
                    }}
                    aria-invalid={fieldErrors.fullName ? 'true' : undefined}
                    aria-describedby={fieldErrors.fullName ? `${fullNameId}-error` : undefined}
                    autoComplete="name"
                  />
                  {fieldErrors.fullName ? (
                    <p id={`${fullNameId}-error`} className="mt-1 text-sm text-rose-600 dark:text-rose-400" role="alert">
                      {fieldErrors.fullName}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor={emailId}>
                    Email
                  </label>
                  <input
                    id={emailId}
                    data-testid="reg-wizard-email"
                    type="email"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearFieldError('email')
                    }}
                    aria-invalid={fieldErrors.email ? 'true' : undefined}
                    aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
                    autoComplete="email"
                  />
                  {fieldErrors.email ? (
                    <p id={`${emailId}-error`} className="mt-1 text-sm text-rose-600 dark:text-rose-400" role="alert">
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div>
                  <label className="text-sm font-semibold" htmlFor={passwordId}>
                    Password
                  </label>
                  <input
                    id={passwordId}
                    data-testid="reg-wizard-password"
                    type="password"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearFieldError('password')
                    }}
                    aria-invalid={fieldErrors.password ? 'true' : undefined}
                    aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
                    autoComplete="new-password"
                  />
                  {fieldErrors.password ? (
                    <p id={`${passwordId}-error`} className="mt-1 text-sm text-rose-600 dark:text-rose-400" role="alert">
                      {fieldErrors.password}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor={confirmId}>
                    Confirm password
                  </label>
                  <input
                    id={confirmId}
                    data-testid="reg-wizard-confirm"
                    type="password"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      clearFieldError('confirmPassword')
                    }}
                    aria-invalid={fieldErrors.confirmPassword ? 'true' : undefined}
                    aria-describedby={fieldErrors.confirmPassword ? `${confirmId}-error` : undefined}
                    autoComplete="new-password"
                  />
                  {fieldErrors.confirmPassword ? (
                    <p id={`${confirmId}-error`} className="mt-1 text-sm text-rose-600 dark:text-rose-400" role="alert">
                      {fieldErrors.confirmPassword}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <dl className="space-y-3 text-sm" data-testid="registration-review">
                <div>
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">Full name</dt>
                  <dd data-testid="registration-review-name">{fullName.trim()}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">Email</dt>
                  <dd data-testid="registration-review-email">{email.trim()}</dd>
                </div>
              </dl>
            ) : null}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  data-testid="registration-back"
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-600"
                  onClick={goPrevious}
                >
                  Previous
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}
              {step < 3 ? (
                <button
                  type="button"
                  data-testid="registration-next"
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 dark:bg-violet-500 sm:ml-auto"
                  onClick={goNext}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  data-testid="registration-submit"
                  disabled={!finalSubmitEnabled}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 sm:ml-auto"
                >
                  Complete registration
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
