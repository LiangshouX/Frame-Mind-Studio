export const AGENT_STAGES = {
  showrunner: { label: '主笔编剧', color: '#8B5E3C' },
  world_builder: { label: '设定架构师', color: '#3D6B5E' },
  character_designer: { label: '角色设计师', color: '#3D5A8B' },
  script_doctor: { label: '剧本医生', color: '#8B5C3D' },
  human_review: { label: '人类审核', color: '#d4a574' },
} as const

export type AgentStageName = keyof typeof AGENT_STAGES
