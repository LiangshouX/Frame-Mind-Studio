import { ScriptContent } from './script'

export interface ScriptVersion {
  id: string
  script_id: string
  version: number
  content: ScriptContent
  message: string | null
  created_at: string
}

export interface VersionDiff {
  episodes_added: unknown[]
  episodes_removed: unknown[]
  episodes_modified: unknown[]
}
