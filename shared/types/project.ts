export type ProjectFormat = 'short_drama' | 'comic' | 'movie'

export interface Project {
  id: string
  title: string
  genre: string[]
  format: ProjectFormat
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectBudget {
  tokenLimit: number
  tokensUsed: number
  warningThreshold: number
}
