import { cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { Button, type ButtonProps } from 'antd'

const PRIMARY_SURFACE = 'var(--sl-primary)'
const PRIMARY_CONTRAST = '#ffffff'
const DISABLED_SURFACE = 'var(--sl-disabled-bg)'
const DISABLED_BORDER = 'var(--sl-border-strong)'
const DISABLED_TEXT = 'var(--sl-muted)'

type DecorativeIconProps = {
  'aria-hidden'?: boolean
  className?: string
  focusable?: boolean | string
  style?: CSSProperties
}

interface ActionButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
  label: ReactNode
  icon?: ReactNode
}

function decorativeIcon(icon: ReactNode, style?: CSSProperties, toneClass?: string) {
  if (!isValidElement(icon)) {
    return icon
  }
  const currentStyle = (icon.props as DecorativeIconProps).style
  const currentClassName = (icon.props as DecorativeIconProps).className
  return cloneElement(icon as ReactElement<DecorativeIconProps>, {
    'aria-hidden': true,
    className: [currentClassName, toneClass].filter(Boolean).join(' ') || undefined,
    focusable: false,
    style: style
      ? {
          ...currentStyle,
          ...style,
        }
      : currentStyle,
  })
}

export default function ActionButton({
  label,
  icon,
  className,
  style,
  'aria-label': ariaLabel,
  ...props
}: ActionButtonProps) {
  const isPrimary = props.type === 'primary'
  const isDisabledPrimary = isPrimary && props.disabled
  const isReadablePrimary = isPrimary && !props.disabled
  const variant = isPrimary ? 'primary' : props.danger ? 'danger' : 'default'
  const classes = [
    'sl-action-button',
    isPrimary ? 'sl-action-button-primary' : null,
    className,
  ].filter(Boolean).join(' ')
  const labelClasses = [
    'sl-action-button-label',
    isReadablePrimary ? 'sl-action-button-label-primary' : null,
    isDisabledPrimary ? 'sl-action-button-label-disabled' : null,
  ].filter(Boolean).join(' ')
  const iconToneClass = isReadablePrimary
    ? 'sl-action-button-icon-primary'
    : isDisabledPrimary
      ? 'sl-action-button-icon-disabled'
      : undefined
  const fallbackLabel = typeof label === 'string' ? label : undefined
  const buttonStyle: CSSProperties | undefined = isReadablePrimary
    ? {
        ...style,
        background: PRIMARY_SURFACE,
        borderColor: PRIMARY_SURFACE,
        color: PRIMARY_CONTRAST,
        WebkitTextFillColor: PRIMARY_CONTRAST,
      }
    : isDisabledPrimary
      ? {
          ...style,
          background: DISABLED_SURFACE,
          borderColor: DISABLED_BORDER,
          boxShadow: 'none',
          color: DISABLED_TEXT,
          WebkitTextFillColor: DISABLED_TEXT,
        }
      : style
  const labelStyle: CSSProperties | undefined = isReadablePrimary
    ? {
        color: PRIMARY_CONTRAST,
        WebkitTextFillColor: PRIMARY_CONTRAST,
      }
    : isDisabledPrimary
      ? {
          color: DISABLED_TEXT,
          WebkitTextFillColor: DISABLED_TEXT,
        }
      : undefined
  const readablePrimaryIconStyle: CSSProperties | undefined = isReadablePrimary
    ? {
        color: PRIMARY_CONTRAST,
        fill: 'currentColor',
        stroke: 'currentColor',
        WebkitTextFillColor: PRIMARY_CONTRAST,
      }
    : isDisabledPrimary
      ? {
          color: DISABLED_TEXT,
          fill: 'currentColor',
          stroke: 'currentColor',
          WebkitTextFillColor: DISABLED_TEXT,
        }
      : undefined

  return (
    <Button
      {...props}
      aria-label={ariaLabel || fallbackLabel}
      className={classes}
      data-sl-variant={variant}
      icon={decorativeIcon(icon, readablePrimaryIconStyle, iconToneClass)}
      style={buttonStyle}
    >
      <span className={labelClasses} style={labelStyle}>{label}</span>
    </Button>
  )
}
