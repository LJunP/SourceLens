import { DatabaseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ActionButton from './ui/ActionButton'
import IconActionButton from './ui/IconActionButton'

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
  const handleOpenArtifacts = () => {
    if (ownerType && ownerId) {
      navigate(`/artifacts?projectId=${projectId}&ownerType=${ownerType}&ownerId=${ownerId}`)
    }
  }
  if (label) {
    return (
      <ActionButton
        aria-label={ownerType && ownerId ? `查看 ${ownerType} #${ownerId} 产物` : '查看产物'}
        size={size}
        icon={<DatabaseOutlined />}
        disabled={isDisabled}
        onClick={handleOpenArtifacts}
        label={label}
      />
    )
  }
  return (
    <IconActionButton
      label={ownerType && ownerId ? `查看 ${ownerType} #${ownerId} 产物` : '查看产物'}
      tooltip="查看产物"
      size={size}
      icon={<DatabaseOutlined />}
      disabled={isDisabled}
      onClick={handleOpenArtifacts}
    />
  )
}
