'use client'

import { useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export function BackendOffline() {
  const [checking, setChecking] = useState(false)

  const handleRetry = async () => {
    setChecking(true)
    try { const res = await fetch('http://localhost:8080/actuator/health', { signal: AbortSignal.timeout(5000) }); if (res.ok) window.location.reload() } catch {} finally { setChecking(false) }
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[100] flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <WifiOff className="h-16 w-16 mx-auto mb-8 text-[var(--text-muted)]" />
        <h2 className="font-display text-2xl font-bold mb-4 text-[var(--text-primary)]">后端服务不可用</h2>
        <p className="text-base text-[var(--text-secondary)] mb-8 leading-relaxed">
          无法连接到后端服务。请检查 Docker 容器是否正常运行。<br />已编辑的内容已保存在本地，恢复连接后可继续工作。
        </p>
        <button onClick={handleRetry} disabled={checking} className="btn btn-primary text-base px-8 py-3">
          <RefreshCw className={`h-5 w-5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? '检查中...' : '重试连接'}
        </button>
      </div>
    </div>
  )
}
