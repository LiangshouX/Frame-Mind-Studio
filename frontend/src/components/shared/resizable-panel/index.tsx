'use client'

import { useCallback, useRef, useState, useEffect } from 'react'

interface ResizablePanelProps {
  children: React.ReactNode
  /** 初始宽度 (px)，默认 480 */
  defaultWidth?: number
  /** 最小宽度 (px)，默认 320 */
  minWidth?: number
  /** 最大宽度 (px)，默认视口 60% */
  maxWidth?: number
  /** 存储 key，用于 localStorage 持久化 */
  storageKey?: string
  /** 侧边方向：left = 拖拽手柄在左侧（面板在右侧），right = 在右侧 */
  side?: 'left' | 'right'
  className?: string
}

/**
 * 可拖拽调整宽度的面板容器。
 * 左/右侧有细窄拖拽条，hover 时高亮，拖拽时实时反馈。
 */
export function ResizablePanel({
  children,
  defaultWidth = 480,
  minWidth = 320,
  maxWidth,
  storageKey,
  side = 'left',
  className = '',
}: ResizablePanelProps) {
  const resolvedMax = maxWidth ?? Math.floor(window.innerWidth * 0.6)
  const clampWidth = useCallback(
    (w: number) => Math.max(minWidth, Math.min(resolvedMax, w)),
    [minWidth, resolvedMax]
  )

  const [width, setWidth] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) return clampWidth(Number(saved))
    }
    return clampWidth(defaultWidth)
  })

  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  // 保存宽度到 localStorage
  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, String(width))
  }, [width, storageKey])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setDragging(true)
      startX.current = e.clientX
      startWidth.current = width
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [width]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      const delta = side === 'left' ? startX.current - e.clientX : e.clientX - startX.current
      setWidth(clampWidth(startWidth.current + delta))
    },
    [dragging, side, clampWidth]
  )

  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  const handleSide = side === 'left' ? 'left-0' : 'right-0'

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 拖拽手柄 */}
      <div
        className={`absolute top-0 ${handleSide} h-full w-1.5 cursor-col-resize z-10 group/handle select-none touch-none`}
        onPointerDown={handlePointerDown}
      >
        {/* 可视反馈条 */}
        <div
          className={`absolute inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} w-px transition-colors duration-150 ${
            dragging
              ? 'bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]'
              : 'bg-transparent group-hover/handle:bg-[var(--accent)]/50'
          }`}
        />
        {/* 拖拽指示器：三条竖线 */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-0' : 'right-0'} flex flex-col items-center gap-0.5 opacity-0 group-hover/handle:opacity-100 transition-opacity ${
            dragging ? '!opacity-100' : ''
          }`}
        >
          <span className="block w-px h-3 rounded-full bg-[var(--text-muted)]" />
          <span className="block w-px h-3 rounded-full bg-[var(--text-muted)]" />
          <span className="block w-px h-3 rounded-full bg-[var(--text-muted)]" />
        </div>
      </div>

      {/* 内容 */}
      <div className="h-full">{children}</div>
    </div>
  )
}
