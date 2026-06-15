import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function getAgentColor(agentType: string): string {
  const colors: Record<string, string> = {
    showrunner: 'border-showrunner-500 bg-showrunner-500/10',
    world_builder: 'border-world-builder-500 bg-world-builder-500/10',
    character_designer: 'border-character-designer-500 bg-character-designer-500/10',
    script_doctor: 'border-script-doctor-500 bg-script-doctor-500/10',
  }
  return colors[agentType] || 'border-gray-500 bg-gray-500/10'
}

export function getAgentName(agentType: string): string {
  const names: Record<string, string> = {
    showrunner: '总监制',
    world_builder: '世界构建师',
    character_designer: '角色设计师',
    script_doctor: '剧本医生',
  }
  return names[agentType] || agentType
}

export function getAgentBgColor(agentType: string): string {
  const colors: Record<string, string> = {
    showrunner: 'bg-showrunner-600',
    world_builder: 'bg-world-builder-600',
    character_designer: 'bg-character-designer-600',
    script_doctor: 'bg-script-doctor-600',
  }
  return colors[agentType] || 'bg-gray-600'
}
