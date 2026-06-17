export type ProjectFormat = 'short_drama' | 'comic' | 'movie'

export interface Project {
  id: string
  title: string
  genre: string[]
  format: ProjectFormat
  description?: string
  created_at: string
  updated_at: string
}
