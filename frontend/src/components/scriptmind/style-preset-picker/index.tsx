import { STYLE_PRESETS } from '@/constants/style-presets'

interface StylePresetPickerProps {
  selected?: string
  onSelect: (id: string | undefined) => void
}

export function StylePresetPicker({ selected, onSelect }: StylePresetPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(selected === preset.id ? undefined : preset.id)}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            selected === preset.id
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)] hover:border-[var(--accent)]'
          }`}
          title={preset.description}
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}
