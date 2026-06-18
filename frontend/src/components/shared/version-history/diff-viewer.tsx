interface DiffViewerProps {
  fromVersion: number
  toVersion: number
  diff: unknown
}

export function DiffViewer({ fromVersion, toVersion, diff }: DiffViewerProps) {
  return (
    <div className="p-4">
      <div className="text-xs text-[var(--text-muted)] mb-3">
        对比 v{fromVersion} → v{toVersion}
      </div>
      <div className="text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap">
        {JSON.stringify(diff, null, 2)}
      </div>
    </div>
  )
}
