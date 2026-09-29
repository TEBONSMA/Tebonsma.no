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

export async function apiFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError('Fikk ikke kontakt med serveren', 0)
  }
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  if (!res.ok) throw new ApiError(body?.error ?? `Feil fra serveren (${res.status})`, res.status)
  return body as T
}
