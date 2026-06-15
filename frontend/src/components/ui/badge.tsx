'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gray-700 text-gray-200',
        secondary: 'border-transparent bg-gray-800 text-gray-300',
        destructive: 'border-transparent bg-red-900/50 text-red-300',
        outline: 'border-gray-700 text-gray-300',
        success: 'border-transparent bg-green-900/50 text-green-300',
        warning: 'border-transparent bg-yellow-900/50 text-yellow-300',
        info: 'border-transparent bg-blue-900/50 text-blue-300',
        showrunner: 'border-transparent bg-showrunner-900/50 text-showrunner-300',
        'world-builder': 'border-transparent bg-world-builder-900/50 text-world-builder-300',
        'character-designer': 'border-transparent bg-character-designer-900/50 text-character-designer-300',
        'script-doctor': 'border-transparent bg-script-doctor-900/50 text-script-doctor-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
