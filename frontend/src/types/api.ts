export class ApiError extends Error {
  constructor(
    message: string,
    public status: number | null,
    public code: ErrorCode,
    public retryable: boolean
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}
