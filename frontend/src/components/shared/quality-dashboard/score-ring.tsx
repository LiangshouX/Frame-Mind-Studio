interface ScoreRingProps {
  score: number
  max?: number
}

export function ScoreRing({ score, max = 100 }: ScoreRingProps) {
  const pct = Math.min(score / max, 1)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)
  const color = pct >= 0.8 ? 'var(--success)' : pct >= 0.6 ? 'var(--warning)' : 'var(--error)'

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-2xl font-bold -mt-16 mb-8">{score}</div>
      <div className="text-xs text-[var(--text-muted)]">总分</div>
    </div>
  )
}
