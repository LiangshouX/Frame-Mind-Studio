'use client'

import { useState } from 'react'
import type { ConnectivityTestResult, TestResultStatus } from '@/types/settings'
import { Loader2, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react'

interface ConnectivityTestButtonProps {
  onTest: () => Promise<ConnectivityTestResult>
  lastResult?: TestResultStatus
  disabled?: boolean
}

const STATUS_CONFIG: Record<TestResultStatus, { icon: typeof CheckCircle; color: string; bg: string }> = {
  SUCCESS: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  AUTH_FAILED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  NETWORK_ERROR: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  TIMEOUT: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  UNKNOWN_ERROR: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  UNTESTED: { icon: Zap, color: 'text-[var(--text-muted)]', bg: '' },
}

export function ConnectivityTestButton({ onTest, lastResult, disabled }: ConnectivityTestButtonProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ConnectivityTestResult | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    try {
      const res = await onTest()
      setResult(res)
    } catch {
      setResult({
        result: 'UNKNOWN_ERROR',
        message: '测试请求失败',
        tested_at: new Date().toISOString(),
      })
    } finally {
      setTesting(false)
    }
  }

  const displayResult = result
  const status = displayResult?.result || lastResult || 'UNTESTED'
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNTESTED
  const Icon = config.icon

  return (
    <div className="space-y-2">
      <button
        onClick={handleTest}
        disabled={disabled || testing}
        className="btn btn-secondary flex items-center gap-2"
      >
        {testing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            测试中...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            测试连接
          </>
        )}
      </button>

      {displayResult && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${config.bg}`}>
          <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
          <span className={config.color}>{displayResult.message}</span>
        </div>
      )}

      {!displayResult && lastResult && lastResult !== 'UNTESTED' && (
        <div className={`flex items-center gap-2 text-xs ${config.color}`}>
          <Icon className="h-3 w-3" />
          <span>上次测试: {lastResult === 'SUCCESS' ? '成功' : '失败'}</span>
        </div>
      )}
    </div>
  )
}
