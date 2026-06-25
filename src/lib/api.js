import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }

  return res.status === 204 ? null : res.json()
}

export const getMyProfile   = ()        => apiFetch('/api/v1/onboarding/me')
export const createOrg      = (payload) => apiFetch('/api/v1/onboarding/organisation', { method: 'POST', body: JSON.stringify(payload) })
export const updateProfile  = (payload) => apiFetch('/api/v1/onboarding/me', { method: 'PATCH', body: JSON.stringify(payload) })

export const getEvents      = ()        => apiFetch('/api/v1/events')
export const getEvent       = (id)      => apiFetch(`/api/v1/events/${id}`)
export const createEvent    = (payload) => apiFetch('/api/v1/events', { method: 'POST', body: JSON.stringify(payload) })
export const updateEvent    = (id, d)   => apiFetch(`/api/v1/events/${id}`, { method: 'PATCH', body: JSON.stringify(d) })
export const deleteEvent    = (id)      => apiFetch(`/api/v1/events/${id}`, { method: 'DELETE' })

export const getStaff       = ()        => apiFetch('/api/v1/staff')
export const addStaff       = (payload) => apiFetch('/api/v1/staff', { method: 'POST', body: JSON.stringify(payload) })
export const updateStaff    = (id, d)   => apiFetch(`/api/v1/staff/${id}`, { method: 'PATCH', body: JSON.stringify(d) })
export const removeStaff    = (id)      => apiFetch(`/api/v1/staff/${id}`, { method: 'DELETE' })
export const verifyStaff    = (payload) => apiFetch('/api/v1/staff/verify-login', { method: 'POST', body: JSON.stringify(payload) })
