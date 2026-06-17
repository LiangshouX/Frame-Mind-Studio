import { Editor, Transforms, Element as SlateElement, Path, Node } from 'slate'
import type { ReactEditor } from 'slate-react'

export type ElementType = 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition'

const ELEMENT_CYCLE: ElementType[] = [
  'scene_heading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
]

/** Get the element type of the current selection's block. */
export function getCurrentElementType(editor: Editor): ElementType | null {
  const [match] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && 'type' in n,
  })
  if (match) {
    const [node] = match
    return (node as any).type as ElementType
  }
  return null
}

/** Set the type of the current block. */
export function setElementType(editor: Editor, type: ElementType) {
  const [match] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && 'type' in n,
  })
  if (match) {
    Transforms.setNodes(editor, { type } as any, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n),
    })
  }
}

/** Tab: cycle to next element type. Shift+Tab: cycle to previous. */
export function handleTab(editor: ReactEditor, shiftKey: boolean): boolean {
  const current = getCurrentElementType(editor)
  if (!current) return false

  const idx = ELEMENT_CYCLE.indexOf(current)
  if (idx === -1) return false

  const nextIdx = shiftKey
    ? (idx - 1 + ELEMENT_CYCLE.length) % ELEMENT_CYCLE.length
    : (idx + 1) % ELEMENT_CYCLE.length

  setElementType(editor, ELEMENT_CYCLE[nextIdx])
  return true
}

/** Smart default type for the next element after Enter. */
function getNextDefaultType(current: ElementType): ElementType {
  switch (current) {
    case 'dialogue':
      return 'action'
    case 'character':
      return 'dialogue'
    case 'parenthetical':
      return 'dialogue'
    case 'scene_heading':
      return 'action'
    case 'action':
      return 'action'
    case 'transition':
      return 'scene_heading'
    default:
      return 'action'
  }
}

/** Enter: insert a new block with smart default type. */
export function handleEnter(editor: ReactEditor): boolean {
  const current = getCurrentElementType(editor)
  if (!current) return false

  const nextType = getNextDefaultType(current)

  // Insert a new block after the current one
  const [match] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && 'type' in n,
  })

  if (match) {
    const [, path] = match
    const newPath = Path.next(path)
    Transforms.insertNodes(
      editor,
      { type: nextType, children: [{ text: '' }] } as any,
      { at: newPath }
    )
    // Move cursor to the new block
    Transforms.select(editor, Editor.start(editor, newPath))
    return true
  }

  return false
}

/** Backspace on empty block: delete it and move to previous. */
export function handleBackspace(editor: ReactEditor): boolean {
  const [match] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && 'type' in n,
  })

  if (!match) return false

  const [node, path] = match
  const text = Node.string(node)

  // Only act if the block is empty
  if (text.length > 0) return false

  // Don't delete if it's the only block
  if (editor.children.length <= 1) return false

  // Get the previous path
  const prevPath = Path.previous(path)

  // Remove the empty block
  Transforms.removeNodes(editor, { at: path })

  // Move cursor to end of previous block
  try {
    const prevEnd = Editor.end(editor, prevPath)
    Transforms.select(editor, prevEnd)
  } catch {
    // If prevPath is invalid, just let Slate handle it
  }

  return true
}

/** Tab key handler for the editor (prevents default and cycles type). */
export function onKeyDown(event: React.KeyboardEvent, editor: ReactEditor) {
  if (event.key === 'Tab') {
    event.preventDefault()
    handleTab(editor, event.shiftKey)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    handleEnter(editor)
    return
  }

  if (event.key === 'Backspace') {
    if (handleBackspace(editor)) {
      event.preventDefault()
    }
    return
  }
}
