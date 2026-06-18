export interface Project {
  id: string
  title: string
  genre: string[]
  format: 'short_drama' | 'comic' | 'movie'
  description: string | null
  status: 'draft' | 'in_progress' | 'review' | 'completed'
  target_episodes: number
  created_at: string
  updated_at: string
}

export interface ProjectDetail extends Project {
  script: import('./script').Script | null
  characters: import('./character').Character[]
  foreshadows: import('./foreshadow').Foreshadow[]
  budget: ProjectBudget
}

export interface ProjectBudget {
  id: string
  project_id: string
  token_limit: number
  tokens_used: number
  warning_threshold: number
  created_at: string
  updated_at: string
}

export interface ProjectCreateRequest {
  title: string
  genre: string[]
  format: 'short_drama' | 'comic' | 'movie'
  description?: string
  target_episodes?: number
}
