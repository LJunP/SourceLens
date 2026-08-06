import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Button, Tooltip, type ButtonProps } from 'antd'

type DecorativeIconProps = {
  'aria-hidden'?: boolean
  focusable?: boolean | string
}

interface IconActionButtonProps extends Omit<ButtonProps, 'aria-label' | 'children' | 'icon'> {
  label: string
  icon: ReactNode
  tooltip?: ReactNode
}

function decorativeIcon(icon: ReactNode) {
  if (!isValidElement(icon)) {
    return icon
  }
  return cloneElement(icon as ReactElement<DecorativeIconProps>, {
    'aria-hidden': true,
    focusable: false,
  })
}

export default function IconActionButton({
  label,
  icon,
  tooltip,
  className,
  ...props
}: IconActionButtonProps) {
  const variant = props.type === 'primary'
    ? 'primary'
    : props.danger
      ? 'danger'
      : props.type === 'text'
        ? 'text'
        : 'default'
  const classes = [
    'sl-icon-action-button',
    `sl-icon-action-button-${variant}`,
    className,
  ].filter(Boolean).join(' ')
  const button = (
    <Button
      {...props}
      aria-label={label}
      className={classes}
      data-sl-variant={variant}
      icon={decorativeIcon(icon)}
    />
  )

  return <Tooltip title={tooltip || label}>{button}</Tooltip>
}
