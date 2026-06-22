export interface Character {
  id: string
  project_id?: string
  name: string
  gender?: string | null
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  identity?: string | null
  persona?: string | null
  description: string | null
  personality: string[]
  appearance: string | null
  background: string | null
  goals: string | null
  relationships: CharacterRelationship[]
  dialogue_style: string | null
  arc: string | null
  overview?: string | null
  created_at: string
  updated_at?: string
}

export interface CharacterRelationship {
  character_id: string
  relationship: string
}
