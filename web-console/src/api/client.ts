import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'

export interface Result<T = unknown> {
  code: string
  message: string
  data: T
}

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

interface ApiRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number
  _requestId?: string
}

export interface ApiError<T = unknown> extends AxiosError<Result<T>> {
  userMessage?: string
  requestId?: string
}

const IDEMPOTENT_METHODS = new Set(['get', 'head', 'options'])
const MAX_RETRY_COUNT = 2
const ERROR_TOAST_DEDUPE_MS = 1500
let lastErrorToastKey = ''
let lastErrorToastAt = 0

function createRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getHeader(headers: unknown, name: string) {
  if (!headers || typeof headers !== 'object') {
    return undefined
  }
  const record = headers as Record<string, unknown>
  return record[name] || record[name.toLowerCase()]
}

function shouldRetry(error: AxiosError) {
  const config = error.config as ApiRequestConfig | undefined
  if (!config) {
    return false
  }
  const method = (config.method || 'get').toLowerCase()
  if (!IDEMPOTENT_METHODS.has(method)) {
    return false
  }
  const retryCount = config._retryCount || 0
  if (retryCount >= MAX_RETRY_COUNT) {
    return false
  }
  const status = error.response?.status
  return !status || status >= 500
}

function buildErrorMessage(error: AxiosError<Result>) {
  const status = error.response?.status
  const serverMessage = error.response?.data?.message
  if (serverMessage) {
    return serverMessage
  }
  if (!status) {
    return '网络连接异常，请稍后重试'
  }
  if (status >= 500) {
    return '服务暂时不可用，请稍后重试'
  }
  if (status === 403) {
    return '没有权限执行该操作'
  }
  if (status === 404) {
    return '请求的资源不存在'
  }
  return '请求失败'
}

export function formatApiError(error: unknown, fallback = '请求失败') {
  const apiError = error as ApiError | undefined
  const requestId = apiError?.requestId
  const text = apiError?.userMessage
    || apiError?.response?.data?.message
    || fallback
  return requestId ? `${text}（请求 ID: ${requestId}）` : text
}

function getErrorToastKey(error: unknown, fallback: string) {
  const apiError = error as ApiError | undefined
  const config = apiError?.config as ApiRequestConfig | undefined
  const method = (config?.method || 'get').toLowerCase()
  const url = config?.url || ''
  const status = apiError?.response?.status || 'network'
  const messageText = apiError?.userMessage || apiError?.response?.data?.message || fallback
  return `${method}:${url}:${status}:${messageText}`
}

export function showApiError(error: unknown, fallback = '请求失败') {
  const toastKey = getErrorToastKey(error, fallback)
  const now = Date.now()
  if (toastKey === lastErrorToastKey && now - lastErrorToastAt < ERROR_TOAST_DEDUPE_MS) {
    return
  }
  lastErrorToastKey = toastKey
  lastErrorToastAt = now
  message.error(formatApiError(error, fallback))
}

client.interceptors.request.use((config) => {
  const requestConfig = config as ApiRequestConfig
  const requestId = requestConfig._requestId || createRequestId()
  requestConfig._requestId = requestId
  requestConfig.headers['X-Request-Id'] = requestId

  const token = localStorage.getItem('token')
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`
  }
  return requestConfig
})

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<Result>) => {
    const apiError = err as ApiError
    const config = err.config as ApiRequestConfig | undefined
    const responseRequestId = getHeader(err.response?.headers, 'x-request-id')
    const requestId = String(responseRequestId || config?._requestId || '')
    apiError.requestId = requestId || undefined

    if (shouldRetry(err) && config) {
      config._retryCount = (config._retryCount || 0) + 1
      await delay(250 * config._retryCount)
      return client.request(config)
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    apiError.userMessage = buildErrorMessage(err)
    return Promise.reject(apiError)
  }
)

export default client
