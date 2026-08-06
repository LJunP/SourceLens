import type { ReactNode } from 'react'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons'

type StateBlockTone = 'empty' | 'loading' | 'error' | 'warning' | 'success'

interface StateBlockProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  tone?: StateBlockTone
  compact?: boolean
  className?: string
}

const DEFAULT_ICONS: Record<StateBlockTone, ReactNode> = {
  empty: <InboxOutlined />,
  loading: <LoadingOutlined spin />,
  error: <ExclamationCircleOutlined />,
  warning: <WarningOutlined />,
  success: <CheckCircleOutlined />,
}

export default function StateBlock({
  title,
  description,
  action,
  icon,
  tone = 'empty',
  compact = false,
  className,
}: StateBlockProps) {
  const classes = [
    'sl-state-block',
    `sl-state-block-${tone}`,
    compact ? 'sl-state-block-compact' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <div className="sl-state-block-icon" aria-hidden="true">{icon || DEFAULT_ICONS[tone]}</div>
      <div className="sl-state-block-copy">
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="sl-state-block-action">{action}</div>}
    </div>
  )
}
