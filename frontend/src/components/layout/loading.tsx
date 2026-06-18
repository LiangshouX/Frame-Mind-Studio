export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-pulse text-[var(--text-muted)] text-sm">加载中...</div>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-[var(--text-muted)] text-sm">加载中...</div>
    </div>
  )
}
