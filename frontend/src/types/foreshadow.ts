export interface Foreshadow {
  id: string
  project_id: string
  plant: string
  payoff: string | null
  episode_hint: number | null
  status: 'planted' | 'resolved'
  urgency: 'high' | 'medium' | 'low'
  character_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
