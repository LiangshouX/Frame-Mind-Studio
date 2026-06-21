import { create } from 'zustand'
import { WorkflowStep, StepStatus, WORKFLOW_STEP_ORDER } from '@/types/workflow'

interface WorkflowStore {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  stepStatuses: Record<WorkflowStep, StepStatus>

  /** 初始化工作流 */
  initialize: () => void

  /** 切换到指定步骤 */
  setCurrentStep: (step: WorkflowStep) => void

  /** 标记步骤为进行中 */
  markInProgress: (step: WorkflowStep) => void

  /** 标记步骤为已完成 */
  markCompleted: (step: WorkflowStep) => void

  /** 标记步骤为待开始 */
  markPending: (step: WorkflowStep) => void

  /** 获取下一步骤 */
  getNextStep: () => WorkflowStep | null

  /** 获取上一步骤 */
  getPrevStep: () => WorkflowStep | null

  /** 切换到下一步骤 */
  goNext: () => void

  /** 切换到上一步骤 */
  goPrev: () => void

  /** 重置工作流状态 */
  reset: () => void
}

const initialStepStatuses: Record<WorkflowStep, StepStatus> = {
  worldview: 'pending',
  synopsis: 'pending',
  characters: 'pending',
  outline: 'pending',
  script: 'pending',
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  currentStep: 'worldview',
  completedSteps: [],
  stepStatuses: { ...initialStepStatuses },

  initialize: () => {
    // 初始化工作流，可以从本地存储或服务器加载状态
    set({
      currentStep: 'worldview',
      completedSteps: [],
      stepStatuses: { ...initialStepStatuses },
    })
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  markInProgress: (step) =>
    set((state) => ({
      stepStatuses: { ...state.stepStatuses, [step]: 'in_progress' },
    })),

  markCompleted: (step) =>
    set((state) => ({
      stepStatuses: { ...state.stepStatuses, [step]: 'completed' },
      completedSteps: state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step],
    })),

  markPending: (step) =>
    set((state) => ({
      stepStatuses: { ...state.stepStatuses, [step]: 'pending' },
      completedSteps: state.completedSteps.filter((s) => s !== step),
    })),

  getNextStep: () => {
    const { currentStep } = get()
    const idx = WORKFLOW_STEP_ORDER.indexOf(currentStep)
    return idx < WORKFLOW_STEP_ORDER.length - 1 ? WORKFLOW_STEP_ORDER[idx + 1] : null
  },

  getPrevStep: () => {
    const { currentStep } = get()
    const idx = WORKFLOW_STEP_ORDER.indexOf(currentStep)
    return idx > 0 ? WORKFLOW_STEP_ORDER[idx - 1] : null
  },

  goNext: () => {
    const next = get().getNextStep()
    if (next) set({ currentStep: next })
  },

  goPrev: () => {
    const prev = get().getPrevStep()
    if (prev) set({ currentStep: prev })
  },

  reset: () =>
    set({
      currentStep: 'worldview',
      completedSteps: [],
      stepStatuses: { ...initialStepStatuses },
    }),
}))
