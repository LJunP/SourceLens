import { Button, Tooltip } from 'antd'
import { DatabaseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface Props {
  projectId: number
  ownerType?: string | null
  ownerId?: number | null
  size?: 'small' | 'middle' | 'large'
  label?: string
  disabled?: boolean
}

export default function ArtifactLinkButton({
  projectId,
  ownerType,
  ownerId,
  size = 'small',
  label,
  disabled,
}: Props) {
  const navigate = useNavigate()
  const isDisabled = disabled || !ownerType || !ownerId
  const button = (
    <Button
      aria-label={label || (ownerType && ownerId ? `查看 ${ownerType} #${ownerId} 产物` : '查看产物')}
      size={size}
      icon={<DatabaseOutlined />}
      disabled={isDisabled}
      onClick={() => {
        if (ownerType && ownerId) {
          navigate(`/artifacts?projectId=${projectId}&ownerType=${ownerType}&ownerId=${ownerId}`)
        }
      }}
    >
      {label}
    </Button>
  )
  if (label) {
    return button
  }
  return <Tooltip title="查看产物">{button}</Tooltip>
}
