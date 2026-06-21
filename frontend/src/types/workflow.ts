/**
 * ScriptMind 工作流类型定义
 * 定义工作流步骤、状态和各步骤的数据结构
 */

/** 工作流步骤 */
export type WorkflowStep = 'worldview' | 'synopsis' | 'characters' | 'outline' | 'script'

/** 步骤状态 */
export type StepStatus = 'pending' | 'in_progress' | 'completed'

/** 工作流状态 */
export interface WorkflowState {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  stepData: Record<WorkflowStep, { status: StepStatus }>
}

/** 世界观设定内容 */
export interface WorldSettingContent {
  genre: string
  style: string
  era: string
  setting: string
  coreConflict: string
  uniqueSellingPoint: string
  worldRules: string[]
  locations: Array<{ name: string; description: string }>
  themes: string[]
}

/** 世界观设定实体 */
export interface WorldSetting {
  id: string
  project_id: string
  content: WorldSettingContent
  created_at: string
  updated_at: string
}

/** 梗概内容 */
export interface SynopsisContent {
  mainPlot: string
  coreConflict: string
  turningPoints: string[]
  ending: string
  themes: string[]
}

/** 梗概实体 */
export interface Synopsis {
  id: string
  project_id: string
  content: SynopsisContent
  created_at: string
  updated_at: string
}

/** 大纲集数条目（短剧） */
export interface OutlineEpisode {
  episodeNumber: number
  title: string
  highlight: string
  hook: string
  keyEvents: string[]
  durationSeconds: number
}

/** 大纲序列条目（传统影视） */
export interface OutlineSequence {
  sequenceId: string
  sequenceName: string
  plotPoint: string
  sceneCount: number
}

/** 大纲幕次条目（传统影视） */
export interface OutlineAct {
  actNumber: number
  actName: string
  actGoal: string
  sequences: OutlineSequence[]
}

/** 大纲内容 */
export interface OutlineContent {
  episodes?: OutlineEpisode[]
  structureModel?: string
  acts?: OutlineAct[]
}

/** 大纲实体 */
export interface Outline {
  id: string
  project_id: string
  content: OutlineContent
  format: 'episode_list' | 'act_structure'
  version: number
  created_at: string
  updated_at: string
}

/** 审查问题 */
export interface ReviewIssue {
  id: string
  severity: 'high' | 'medium' | 'low'
  location: { episode?: number; scene?: number; beat?: number }
  description: string
  suggestion: string
  status: 'pending' | 'accepted' | 'ignored' | 'manual'
}

/** 审查维度评分 */
export interface ReviewDimension {
  score: number
  status: string
  details?: string
}

/** 审查报告内容 */
export interface ReviewReportContent {
  overallScore: number
  dimensions: Record<string, ReviewDimension>
  issues: ReviewIssue[]
  foreshadowStatus: {
    total: number
    resolved: number
    unresolved: number
  }
}

/** 审查报告实体 */
export interface ReviewReport {
  id: string
  project_id: string
  scope: 'full' | 'episode'
  episode_number?: number
  report: ReviewReportContent
  created_at: string
}

/** AI 优化建议 */
export interface OptimizeSuggestion {
  id: string
  text: string
  style: string
}

/** 工作流步骤标签映射 */
export const WORKFLOW_STEP_LABELS: Record<WorkflowStep, string> = {
  worldview: '创意及世界观',
  synopsis: '梗概',
  characters: '角色',
  outline: '大纲',
  script: '剧本内容',
}

/** 工作流步骤顺序 */
export const WORKFLOW_STEP_ORDER: WorkflowStep[] = [
  'worldview',
  'synopsis',
  'characters',
  'outline',
  'script',
]
