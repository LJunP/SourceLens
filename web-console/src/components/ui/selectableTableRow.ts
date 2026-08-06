import type { KeyboardEvent } from 'react'

export const SELECTABLE_TABLE_ROW_INTERACTIVE_TARGET_SELECTOR =
  'button,a,[role="button"],[role="combobox"],input,textarea,select,[contenteditable="true"],.ant-select,.ant-select-selector,.ant-dropdown-trigger'

export interface SelectableTableRowOptions<TRecord> {
  record: TRecord
  selected: boolean
  onSelect: (record: TRecord) => void
  label: string
  controlsId?: string
  className?: string
}

export function isSelectableTableRowKeyboardEvent(event: KeyboardEvent<HTMLElement>): boolean {
  const target = event.target as HTMLElement | null
  if (target?.closest(SELECTABLE_TABLE_ROW_INTERACTIVE_TARGET_SELECTOR)) {
    return false
  }
  return event.key === 'Enter' || event.key === ' '
}

export function createSelectableTableRowProps<TRecord>({
  record,
  selected,
  onSelect,
  label,
  controlsId,
  className,
}: SelectableTableRowOptions<TRecord>) {
  return {
    onClick: () => onSelect(record),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (!isSelectableTableRowKeyboardEvent(event)) return
      event.preventDefault()
      onSelect(record)
    },
    tabIndex: 0,
    'aria-selected': selected,
    'aria-controls': selected ? controlsId : undefined,
    'aria-label': label,
    className,
  }
}
