'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <h2 className="font-display text-xl font-bold mb-3">出错了</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded hover:bg-[var(--accent-dark)]"
        >
          重试
        </button>
      </div>
    </div>
  )
}
