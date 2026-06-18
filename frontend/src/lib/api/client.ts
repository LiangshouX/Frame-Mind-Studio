import { ApiError, ErrorCode } from '@/types/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
const DEFAULT_TIMEOUT = 30_000
const UPLOAD_TIMEOUT = 120_000
const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 1_000

function getErrorCode(status: number | null): ErrorCode {
  if (status === null) return 'NETWORK_ERROR'
  if (status === 429) return 'RATE_LIMITED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 400) return 'VALIDATION_ERROR'
  if (status && status >= 500) return 'SERVER_ERROR'
  return 'UNKNOWN'
}

function isRetryable(code: ErrorCode): boolean {
  return code === 'RATE_LIMITED' || code === 'NETWORK_ERROR' || code === 'SERVER_ERROR'
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  let lastError: ApiError | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1)
      await sleep(delay)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timer)

      if (!response.ok) {
        const code = getErrorCode(response.status)
        const body = await response.text().catch(() => '')
        const message = body || `HTTP ${response.status}`
        lastError = new ApiError(message, response.status, code, isRetryable(code))

        if (isRetryable(code) && attempt < MAX_RETRIES) continue
        throw lastError
      }

      if (response.status === 204) return undefined as T
      return response.json()
    } catch (err) {
      clearTimeout(timer)

      if (err instanceof ApiError) throw err

      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new ApiError('请求超时', null, 'TIMEOUT', true)
      } else {
        lastError = new ApiError('网络不可达', null, 'NETWORK_ERROR', true)
      }

      if (isRetryable(lastError.code) && attempt < MAX_RETRIES) continue
    }
  }

  throw lastError!
}

export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT)

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      const code = getErrorCode(response.status)
      throw new ApiError(`HTTP ${response.status}`, response.status, code, isRetryable(code))
    }

    return response.json()
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof ApiError) throw err
    throw new ApiError('网络不可达', null, 'NETWORK_ERROR', true)
  }
}

export function isBackendOffline(error: unknown): boolean {
  return error instanceof ApiError && error.status === null && error.code === 'NETWORK_ERROR'
}
