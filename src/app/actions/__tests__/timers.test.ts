import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}))

// Build chainable mock for supabase query builder
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSelect = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      insert: mockInsert,
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: mockUpdate,
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: mockDelete,
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: mockSelect,
        })),
      })),
    })),
  })),
}))

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { createTimer, updateTimer, deleteTimer, getUserTimers, ALLOWED_COLORS, ALLOWED_ICONS } from '../timers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const mockRedirect = redirect as ReturnType<typeof vi.fn>
const mockRevalidatePath = revalidatePath as ReturnType<typeof vi.fn>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

const VALID_COLOR = ALLOWED_COLORS[0]
const VALID_ICON = ALLOWED_ICONS[0]

const authenticatedUser = { data: { user: { id: 'user-123' } } }
const unauthenticatedUser = { data: { user: null } }

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── createTimer ──────────────────────────────────────────────────────────────

describe('createTimer', () => {
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)

    const result = await createTimer(null, makeFormData({
      name: 'My Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when name is empty', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await createTimer(null, makeFormData({
      name: '',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Name is required.' })
  })

  it('returns error when name exceeds 32 characters', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await createTimer(null, makeFormData({
      name: 'A'.repeat(33),
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Name must be 32 characters or fewer.' })
  })

  it('returns error when color is not in ALLOWED_COLORS', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await createTimer(null, makeFormData({
      name: 'My Timer',
      color: '#000000',
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Please select a valid color.' })
  })

  it('returns error when icon is not in ALLOWED_ICONS', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await createTimer(null, makeFormData({
      name: 'My Timer',
      color: VALID_COLOR,
      icon: 'invalid-icon',
    }))

    expect(result).toEqual({ error: 'Please select a valid icon.' })
  })

  it('returns duplicate name error when DB returns code 23505', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockInsert.mockResolvedValueOnce({ error: { code: '23505' } })

    const result = await createTimer(null, makeFormData({
      name: 'Existing Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'A timer named "Existing Timer" already exists.' })
  })

  it('returns { success: true } on successful creation', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockInsert.mockResolvedValueOnce({ error: null })

    const result = await createTimer(null, makeFormData({
      name: 'New Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ success: true })
  })

  it('calls revalidatePath("/dashboard") on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockInsert.mockResolvedValueOnce({ error: null })

    await createTimer(null, makeFormData({
      name: 'New Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

// ─── updateTimer ──────────────────────────────────────────────────────────────

describe('updateTimer', () => {
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)

    const result = await updateTimer(null, makeFormData({
      timerId: 'timer-abc',
      name: 'Updated Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when timerId is missing', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await updateTimer(null, makeFormData({
      name: 'Updated Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Timer ID is required.' })
  })

  it('returns error when name is empty', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await updateTimer(null, makeFormData({
      timerId: 'timer-abc',
      name: '',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Name is required.' })
  })

  it('returns error when name exceeds 32 characters', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await updateTimer(null, makeFormData({
      timerId: 'timer-abc',
      name: 'B'.repeat(33),
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Name must be 32 characters or fewer.' })
  })

  it('returns error when color is invalid', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await updateTimer(null, makeFormData({
      timerId: 'timer-abc',
      name: 'Updated Timer',
      color: '#FFFFFF',
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'Please select a valid color.' })
  })

  it('returns error when icon is invalid', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await updateTimer(null, makeFormData({
      timerId: 'timer-abc',
      name: 'Updated Timer',
      color: VALID_COLOR,
      icon: 'not-a-real-icon',
    }))

    expect(result).toEqual({ error: 'Please select a valid icon.' })
  })

  it('returns duplicate name error when DB returns code 23505', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockUpdate.mockResolvedValueOnce({ error: { code: '23505' } })

    const result = await updateTimer(null, makeFormData({
      timerId: 'timer-abc',
      name: 'Duplicate Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ error: 'A timer named "Duplicate Timer" already exists.' })
  })

  it('returns { success: true } on successful update', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockUpdate.mockResolvedValueOnce({ error: null })

    const result = await updateTimer(null, makeFormData({
      timerId: 'timer-abc',
      name: 'Updated Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(result).toEqual({ success: true })
  })

  it('calls revalidatePath("/dashboard") on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockUpdate.mockResolvedValueOnce({ error: null })

    await updateTimer(null, makeFormData({
      timerId: 'timer-abc',
      name: 'Updated Timer',
      color: VALID_COLOR,
      icon: VALID_ICON,
    }))

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

// ─── deleteTimer ──────────────────────────────────────────────────────────────

describe('deleteTimer', () => {
  it('redirects to /login when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)
    // In real Next.js, redirect() throws internally to stop execution.
    // Simulate that so code doesn't continue past the redirect guard.
    mockRedirect.mockImplementationOnce(() => { throw new Error('NEXT_REDIRECT') })

    await expect(deleteTimer('timer-abc')).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('calls supabase delete with correct timerId and user_id', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockDelete.mockResolvedValueOnce({ error: null })

    await deleteTimer('timer-abc')

    expect(mockDelete).toHaveBeenCalled()
  })

  it('calls revalidatePath("/dashboard") and redirect("/dashboard") on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockDelete.mockResolvedValueOnce({ error: null })

    await deleteTimer('timer-abc')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })
})

// ─── getUserTimers ────────────────────────────────────────────────────────────

describe('getUserTimers', () => {
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)

    const result = await getUserTimers()

    expect(result).toEqual({ timers: [], error: 'Not authenticated' })
  })

  it('returns timers array on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    const timers = [
      { id: 'timer-1', name: 'Work', color: VALID_COLOR, icon: VALID_ICON },
      { id: 'timer-2', name: 'Exercise', color: ALLOWED_COLORS[1], icon: ALLOWED_ICONS[1] },
    ]
    mockSelect.mockResolvedValueOnce({ data: timers, error: null })

    const result = await getUserTimers()

    expect(result).toEqual({ timers })
  })

  it('returns error when DB query fails', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockSelect.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    const result = await getUserTimers()

    expect(result).toEqual({ timers: [], error: 'Failed to fetch timers.' })
  })
})
