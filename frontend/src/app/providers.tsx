'use client'

import { ToastProvider } from '@/components/shared/toast/toast-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
