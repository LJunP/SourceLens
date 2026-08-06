export const REDACTED_DISPLAY_VALUE = '[REDACTED]'

const SENSITIVE_DISPLAY_KEYS = [
  'authorization',
  'bearer',
  'token',
  'apiKey',
  'apikey',
  'api_key',
  'secret',
  'password',
  'privateKey',
  'private_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
]

const SENSITIVE_KEY_SOURCE = SENSITIVE_DISPLAY_KEYS.join('|')
const SENSITIVE_KEY_PATTERN = new RegExp(`^(?:${SENSITIVE_KEY_SOURCE})$`, 'i')
const QUOTED_VALUE_PATTERN = String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'`
const AUTHORIZATION_BEARER_PATTERN = new RegExp(
  String.raw`\b(Authorization\s*[:=]\s*Bearer\s+)(?:${QUOTED_VALUE_PATTERN}|[^\s"',;<>]+)`,
  'gi',
)
const BEARER_PATTERN = new RegExp(
  String.raw`\b(Bearer\s+)(?:${QUOTED_VALUE_PATTERN}|[^\s"',;<>]+)`,
  'gi',
)
const SENSITIVE_QUOTED_ASSIGNMENT_PATTERN = new RegExp(
  String.raw`(["']?\b(?:${SENSITIVE_KEY_SOURCE})\b["']?\s*[:=]\s*)(${QUOTED_VALUE_PATTERN})`,
  'gi',
)
const SENSITIVE_ASSIGNMENT_PATTERN = new RegExp(
  String.raw`(["']?\b(?:${SENSITIVE_KEY_SOURCE})\b["']?\s*[:=]\s*)(?!["'])[^\s,;)}\]]+`,
  'gi',
)
const OPENAI_KEY_PATTERN = /\bsk-[A-Za-z0-9_-]{8,}\b/g
const JWT_LIKE_PATTERN = /\b(?:eyJ[A-Za-z0-9_-]{8,}|[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g

export function isSensitiveDisplayKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key)
}

export function redactSensitiveText(value: string): string {
  if (!value) return ''
  return value
    .replace(AUTHORIZATION_BEARER_PATTERN, `$1${REDACTED_DISPLAY_VALUE}`)
    .replace(BEARER_PATTERN, `$1${REDACTED_DISPLAY_VALUE}`)
    .replace(SENSITIVE_QUOTED_ASSIGNMENT_PATTERN, (_match, prefix: string, quotedValue: string) => {
      const quote = quotedValue.startsWith("'") ? "'" : '"'
      return `${prefix}${quote}${REDACTED_DISPLAY_VALUE}${quote}`
    })
    .replace(SENSITIVE_ASSIGNMENT_PATTERN, `$1${REDACTED_DISPLAY_VALUE}`)
    .replace(OPENAI_KEY_PATTERN, REDACTED_DISPLAY_VALUE)
    .replace(JWT_LIKE_PATTERN, REDACTED_DISPLAY_VALUE)
}

export function redactDisplayValue(value: unknown, key?: string, seen = new WeakSet<object>()): unknown {
  if (key && isSensitiveDisplayKey(key)) {
    return REDACTED_DISPLAY_VALUE
  }
  if (typeof value === 'string') {
    return redactSensitiveText(value)
  }
  if (Array.isArray(value)) {
    return value.map(item => redactDisplayValue(item, undefined, seen))
  }
  if (!value || typeof value !== 'object') {
    return value
  }
  if (seen.has(value)) {
    return '[Circular]'
  }
  seen.add(value)
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
      entryKey,
      redactDisplayValue(entryValue, entryKey, seen),
    ]),
  )
}

export function stringifyRedactedPayload(value: unknown, space = 2): string {
  return JSON.stringify(redactDisplayValue(value), null, space)
}

export function redactJsonOrText(value: string | null | undefined, emptyFallback = ''): string {
  if (!value) return emptyFallback
  try {
    return stringifyRedactedPayload(JSON.parse(value), 2)
  } catch {
    return redactSensitiveText(value)
  }
}

export function redactAndTruncateText(value: string | null | undefined, maxLength: number): string | null {
  if (value == null) return null
  const redacted = redactJsonOrText(value, '')
  return redacted.length > maxLength ? `${redacted.slice(0, maxLength)}\n...(截断)` : redacted
}
