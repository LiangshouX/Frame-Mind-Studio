'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ResizablePanelGroupProps {
  direction?: 'horizontal' | 'vertical'
  children: React.ReactNode
  className?: string
}

interface ResizablePanelProps {
  defaultSize?: number
  minSize?: number
  maxSize?: number
  children: React.ReactNode
  className?: string
}

interface PanelContextValue {
  sizes: number[]
  setSizes: (sizes: number[]) => void
  dragging: number | null
  setDragging: (index: number | null) => void
}

const PanelContext = React.createContext<PanelContextValue>({
  sizes: [],
  setSizes: () => {},
  dragging: null,
  setDragging: () => {},
})

export function ResizablePanelGroup({
  direction = 'horizontal',
  children,
  className,
}: ResizablePanelGroupProps) {
  const panels = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === ResizablePanel
  )

  const configs = panels.map((panel) => {
    const props = (panel as React.ReactElement<ResizablePanelProps>).props
    return {
      defaultSize: props.defaultSize ?? 50,
      minSize: props.minSize ?? 10,
      maxSize: props.maxSize ?? 90,
    }
  })

  const [sizes, setSizes] = React.useState(() =>
    configs.map((c) => c.defaultSize)
  )
  const [dragging, setDragging] = React.useState<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (dragging === null || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const isHorizontal = direction === 'horizontal'
      const total = isHorizontal ? rect.width : rect.height
      const pos = isHorizontal ? e.clientX - rect.left : e.clientY - rect.top

      const leftIndex = dragging
      const rightIndex = dragging + 1

      const leftMin = configs[leftIndex].minSize
      const rightMin = configs[rightIndex].minSize
      const leftMax = configs[leftIndex].maxSize
      const rightMax = configs[rightIndex].maxSize

      const leftSize = Math.max(leftMin, Math.min(leftMax, (pos / total) * 100))
      const rightSize = 100 - leftSize

      if (rightSize < rightMin || rightSize > rightMax) return

      setSizes((prev) => {
        const next = [...prev]
        const otherTotal = prev.reduce((sum, s, i) => (i !== leftIndex && i !== rightIndex ? sum + s : sum), 0)
        const remaining = 100 - otherTotal
        const ratio = leftSize / (leftSize + rightSize)
        next[leftIndex] = remaining * ratio
        next[rightIndex] = remaining * (1 - ratio)
        return next
      })
    },
    [dragging, direction, configs]
  )

  const handleMouseUp = React.useCallback(() => {
    setDragging(null)
  }, [])

  React.useEffect(() => {
    if (dragging !== null) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp, direction])

  const isHorizontal = direction === 'horizontal'

  return (
    <PanelContext.Provider value={{ sizes, setSizes, dragging, setDragging }}>
      <div
        ref={containerRef}
        className={cn(
          'flex',
          isHorizontal ? 'flex-row' : 'flex-col',
          'w-full h-full overflow-hidden',
          className
        )}
      >
        {panels.map((panel, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ResizeHandle index={index - 1} direction={direction} />
            )}
            <div
              style={{
                [isHorizontal ? 'width' : 'height']: `${sizes[index] ?? 50}%`,
                flexShrink: 0,
              }}
              className="overflow-hidden"
            >
              {(panel as React.ReactElement<ResizablePanelProps>).props.children}
            </div>
          </React.Fragment>
        ))}
      </div>
    </PanelContext.Provider>
  )
}

export function ResizablePanel({ children }: ResizablePanelProps) {
  return <>{children}</>
}

function ResizeHandle({
  index,
  direction,
}: {
  index: number
  direction: 'horizontal' | 'vertical'
}) {
  const { setDragging } = React.useContext(PanelContext)

  return (
    <div
      className={cn(
        'resize-handle',
        direction === 'vertical' && 'h-1 w-full cursor-row-resize'
      )}
      onMouseDown={(e) => {
        e.preventDefault()
        setDragging(index)
      }}
    />
  )
}
