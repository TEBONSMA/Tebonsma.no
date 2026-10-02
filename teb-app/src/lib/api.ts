const API_URL = (import.meta.env.VITE_API_URL ?? 'https://api.tebonsma.no').replace(/\/$/, '')

export interface Profile {
  username: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  avatar: string | null
  groups: string[]
  createdAt: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// For files the API serves itself, like pictures in the feed
export const apiUrl = (path: string) => `${API_URL}${path}`

// Without a token the request is made as a visitor, which only some endpoints allow
async function request(path: string, token: string | null | undefined, init: RequestInit) {
  try {
    return await fetch(apiUrl(path), {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // A form (file upload) sets its own content type
        ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError('Fikk ikke kontakt med serveren', 0)
  }
}

export async function apiFetch<T>(path: string, token: string | null | undefined, init: RequestInit = {}): Promise<T> {
  const res = await request(path, token, init)
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  if (!res.ok) throw new ApiError(body?.error ?? `Feil fra serveren (${res.status})`, res.status)
  return body as T
}

export async function apiFetchBlob(path: string, token: string | null | undefined) {
  const res = await request(path, token, {})
  if (!res.ok) throw new ApiError(`Feil fra serveren (${res.status})`, res.status)
  return res.blob()
}
