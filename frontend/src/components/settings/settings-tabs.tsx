'use client'

import { useState, type ReactNode } from 'react'

export type SettingsTab = 'providers' | 'mcp' | 'tavily' | 'other'

interface TabDef {
  id: SettingsTab
  label: string
}

const TABS: TabDef[] = [
  { id: 'providers', label: '模型供应商' },
  { id: 'mcp', label: 'MCP Server' },
  { id: 'tavily', label: 'Tavily 搜索' },
  { id: 'other', label: '其他工具' },
]

interface SettingsTabsProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  children: ReactNode
}

export function SettingsTabs({ activeTab, onTabChange, children }: SettingsTabsProps) {
  return (
    <div>
      <nav className="flex gap-1 border-b border-[var(--border)] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  )
}
