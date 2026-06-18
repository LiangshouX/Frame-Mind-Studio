import { ElementType } from '@/types/script'

export const ELEMENT_TYPES: ElementType[] = [
  'scene_heading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
]

export const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  scene_heading: '场景标题',
  action: '动作',
  character: '角色',
  dialogue: '对白',
  parenthetical: '括号说明',
  transition: '转场',
}

export const ELEMENT_TYPE_NEXT: Record<ElementType, ElementType> = {
  scene_heading: 'action',
  action: 'character',
  character: 'dialogue',
  dialogue: 'parenthetical',
  parenthetical: 'transition',
  transition: 'scene_heading',
}

export const ELEMENT_TYPE_PREV: Record<ElementType, ElementType> = {
  scene_heading: 'transition',
  action: 'scene_heading',
  character: 'action',
  dialogue: 'character',
  parenthetical: 'dialogue',
  transition: 'parenthetical',
}

export const ENTER_DEFAULT_AFTER: Record<string, ElementType> = {
  dialogue: 'action',
  character: 'dialogue',
}
