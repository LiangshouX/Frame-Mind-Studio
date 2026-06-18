'use client'

import type { ProviderInfo } from '@/types/settings'
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react'

interface ModelProviderCardProps {
  provider: ProviderInfo
  onClick: () => void
}

export function ModelProviderCard({ provider, onClick }: ModelProviderCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 card hover:ring-1 hover:ring-[var(--border)] transition-all text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--surface)] flex items-center justify-center text-lg font-bold text-[var(--text-muted)]">
          {provider.name.charAt(0)}
        </div>
        <div>
          <div className="text-base font-bold">{provider.name}</div>
          <div className="text-sm text-[var(--text-muted)] mt-0.5">{provider.id}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`badge ${provider.configured ? 'badge-success' : 'badge-default'}`}
        >
          {provider.configured ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              已配置
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              未配置
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
      </div>
    </button>
  )
}
