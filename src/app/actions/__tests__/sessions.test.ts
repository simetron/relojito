import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}))

const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockNot = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()

// Flexible chainable builder — every method returns the same object so any
// chain length works. Terminal methods (single, range) return promises.
const chainable: Record<string, ReturnType<typeof vi.fn>> = {
  select: mockSelect,
  single: mockSingle,
  eq: mockEq,
  not: mockNot,
  order: mockOrder,
  range: mockRange,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => chainable),
  })),
}))

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  startTimer,
  stopTimer,
  discardSession,
  deleteSession,
  saveManualSession,
} from '../sessions'
import { revalidatePath } from 'next/cache'

const mockRevalidatePath = revalidatePath as ReturnType<typeof vi.fn>

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const authenticatedUser = { data: { user: { id: 'user-123' } } }
const unauthenticatedUser = { data: { user: null } }

const baseSession = {
  id: 'session-abc',
  timer_id: 'timer-xyz',
  user_id: 'user-123',
  start_time: new Date(Date.now() - 60_000).toISOString(), // 1 minute ago
  end_time: null,
  duration_seconds: null,
  source: 'automatic' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // All chain methods return the chainable object by default
  mockSelect.mockReturnValue(chainable)
  mockEq.mockReturnValue(chainable)
  mockNot.mockReturnValue(chainable)
  mockOrder.mockReturnValue(chainable)
  mockInsert.mockReturnValue(chainable)
  mockUpdate.mockReturnValue(chainable)
  mockDelete.mockReturnValue(chainable)

  // Terminal methods return resolved promises by default
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockRange.mockResolvedValue({ data: [], error: null })
})

// ─── startTimer ───────────────────────────────────────────────────────────────

describe('startTimer', () => {
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)

    const result = await startTimer('timer-xyz')

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when DB returns unique constraint violation (code 23505)', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'unique violation' } })

    const result = await startTimer('timer-xyz')

    expect(result).toEqual({ error: 'Another timer is already running.' })
  })

  it('returns session data on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockSingle.mockResolvedValueOnce({ data: baseSession, error: null })

    const result = await startTimer('timer-xyz')

    expect(result).toEqual({ data: baseSession })
  })

  it('calls revalidatePath("/dashboard") on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockSingle.mockResolvedValueOnce({ data: baseSession, error: null })

    await startTimer('timer-xyz')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

// ─── stopTimer ────────────────────────────────────────────────────────────────

describe('stopTimer', () => {
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)

    const result = await stopTimer('session-abc')

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when session not found (single returns null data)', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    // First single() — fetch session — returns null
    mockSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await stopTimer('session-abc')

    expect(result).toEqual({ error: 'Session not found.' })
  })

  it('returns session data with computed duration_seconds on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const startTime = new Date(Date.now() - 120_000).toISOString() // 2 minutes ago
    const sessionWithStart = { ...baseSession, start_time: startTime }

    const closedSession = {
      ...sessionWithStart,
      end_time: new Date().toISOString(),
      duration_seconds: 120,
    }

    // First single() — fetch session
    mockSingle.mockResolvedValueOnce({ data: sessionWithStart, error: null })
    // Second single() — update and return
    mockSingle.mockResolvedValueOnce({ data: closedSession, error: null })

    const result = await stopTimer('session-abc')

    expect(result).toMatchObject({ data: expect.objectContaining({ duration_seconds: 120 }) })
  })

  it('calls revalidatePath("/dashboard") on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const startTime = new Date(Date.now() - 60_000).toISOString()
    const sessionWithStart = { ...baseSession, start_time: startTime }
    const closedSession = { ...sessionWithStart, end_time: new Date().toISOString(), duration_seconds: 60 }

    mockSingle.mockResolvedValueOnce({ data: sessionWithStart, error: null })
    mockSingle.mockResolvedValueOnce({ data: closedSession, error: null })

    await stopTimer('session-abc')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

// ─── discardSession (orphaned session recovery — Req 3.7) ─────────────────────

describe('discardSession', () => {
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)

    const result = await discardSession('session-abc')

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('calls delete on the session with correct sessionId and user_id', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    // delete().eq('id',...).eq('user_id',...) — second eq is terminal (awaited)
    // Queue: first call returns chainable, second call resolves with result
    mockEq
      .mockReturnValueOnce(chainable)
      .mockResolvedValueOnce({ error: null })

    await discardSession('session-abc')

    expect(mockEq).toHaveBeenCalledWith('id', 'session-abc')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
  })

  it('returns empty object {} on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    // delete().eq('id',...).eq('user_id',...) — last eq is terminal
    mockEq.mockReturnValueOnce(chainable)                        // first eq returns chainable
    mockEq.mockResolvedValueOnce({ error: null })                // second eq resolves

    const result = await discardSession('session-abc')

    expect(result).toEqual({})
  })

  it('calls revalidatePath("/dashboard") on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockEq.mockReturnValueOnce(chainable)
    mockEq.mockResolvedValueOnce({ error: null })

    await discardSession('session-abc')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

// ─── deleteSession ────────────────────────────────────────────────────────────

describe('deleteSession', () => {
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)

    const result = await deleteSession('session-abc')

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when sessionId is empty', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await deleteSession('')

    expect(result).toEqual({ error: 'Session ID is required.' })
  })

  it('returns error when session not found (count === 0)', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    // delete({ count: 'exact' }).eq('id',...).eq('user_id',...) — last eq is terminal
    mockEq.mockReturnValueOnce(chainable)
    mockEq.mockResolvedValueOnce({ error: null, count: 0 })

    const result = await deleteSession('session-abc')

    expect(result).toEqual({ error: 'Session not found.' })
  })

  it('returns empty object {} on success', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)
    mockEq.mockReturnValueOnce(chainable)
    mockEq.mockResolvedValueOnce({ error: null, count: 1 })

    const result = await deleteSession('session-abc')

    expect(result).toEqual({})
  })
})

// ─── saveManualSession ────────────────────────────────────────────────────────

describe('saveManualSession', () => {
  const now = new Date()
  const startTime = new Date(now.getTime() - 3600_000).toISOString() // 1 hour ago
  const endTime = now.toISOString()

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(unauthenticatedUser)

    const result = await saveManualSession({
      timerId: 'timer-xyz',
      startTime,
      endTime,
    })

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when timerId is empty', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await saveManualSession({
      timerId: '',
      startTime,
      endTime,
    })

    expect(result).toEqual({ error: 'Timer is required.' })
  })

  it('returns error when end time is not after start time', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const result = await saveManualSession({
      timerId: 'timer-xyz',
      startTime: endTime,   // same time
      endTime: startTime,   // earlier than start
    })

    expect(result).toEqual({ error: 'End time must be after start time.' })
  })

  it('returns session data on successful create (no sessionId)', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const manualSession = {
      ...baseSession,
      source: 'manual' as const,
      start_time: startTime,
      end_time: endTime,
      duration_seconds: 3600,
    }
    mockSingle.mockResolvedValueOnce({ data: manualSession, error: null })

    const result = await saveManualSession({
      timerId: 'timer-xyz',
      startTime,
      endTime,
    })

    expect(result).toEqual({ data: manualSession })
  })

  it('returns session data on successful edit (with sessionId)', async () => {
    mockGetUser.mockResolvedValueOnce(authenticatedUser)

    const updatedSession = {
      ...baseSession,
      id: 'session-edit',
      source: 'manual' as const,
      start_time: startTime,
      end_time: endTime,
      duration_seconds: 3600,
    }
    mockSingle.mockResolvedValueOnce({ data: updatedSession, error: null })

    const result = await saveManualSession({
      sessionId: 'session-edit',
      timerId: 'timer-xyz',
      startTime,
      endTime,
    })

    expect(result).toEqual({ data: updatedSession })
  })
})
