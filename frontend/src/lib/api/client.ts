const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail || `API error: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export function wsUrl(sessionId: string): string {
  const base = API_BASE.replace(/^http/, 'ws')
  return `${base}/ws/agent/${sessionId}`
}
