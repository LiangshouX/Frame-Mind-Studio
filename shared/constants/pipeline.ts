export const PIPELINE_STAGES = [
  { id: 'scriptmind', label: '剧本工厂', labelEn: 'ScriptMind', icon: 'FileText' },
  { id: 'storyboard', label: '智能分镜', labelEn: 'StoryboardAI', icon: 'Clapperboard' },
  { id: 'styleforge', label: '形象工坊', labelEn: 'StyleForge', icon: 'Palette' },
  { id: 'motioncore', label: '视频合成', labelEn: 'MotionCore', icon: 'Film' },
  { id: 'voicestage', label: '声演剧场', labelEn: 'VoiceStage', icon: 'Mic2' },
  { id: 'export', label: '导出', labelEn: 'Export', icon: 'Download' },
] as const

export const STYLE_PRESETS = [
  { id: 'sweet', label: '甜宠', genres: ['言情', '都市'] },
  { id: 'suspense', label: '悬疑', genres: ['推理', '惊悚'] },
  { id: 'revenge', label: '逆袭', genres: ['都市', '玄幻'] },
  { id: 'ancient', label: '古风', genres: ['古装', '仙侠'] },
  { id: 'marvel', label: '漫威风', genres: ['科幻', '超英'] },
  { id: 'comedy', label: '搞笑', genres: ['喜剧', '日常'] },
] as const

export const AGENT_LABELS: Record<string, string> = {
  showrunner: '主笔编剧',
  world_builder: '设定架构师',
  character_designer: '角色设计师',
  script_doctor: '审稿医生',
  human_review: '人类审核',
}
