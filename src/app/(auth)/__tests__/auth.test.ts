import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

// Mock the Supabase server client
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}))

// Import actions after mocks are set up
import { registerAction } from '../register/actions'
import { loginAction, forgotPasswordAction } from '../login/actions'
import { logoutAction } from '../../actions/auth'
import { redirect } from 'next/navigation'

const mockRedirect = redirect as ReturnType<typeof vi.fn>

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// registerAction
// ---------------------------------------------------------------------------
describe('registerAction', () => {
  it('returns error when email is missing', async () => {
    const result = await registerAction(makeFormData({ password: 'secret123' }))
    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('returns error when password is missing', async () => {
    const result = await registerAction(makeFormData({ email: 'user@example.com' }))
    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('returns error when both email and password are missing', async () => {
    const result = await registerAction(makeFormData({}))
    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('returns error when password is too short (< 6 chars)', async () => {
    const result = await registerAction(
      makeFormData({ email: 'user@example.com', password: 'abc' })
    )
    expect(result).toEqual({ error: 'Password must be at least 6 characters.' })
  })

  it('returns duplicate email error when Supabase returns user_already_exists', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'User already registered', code: 'user_already_exists' },
    })

    const result = await registerAction(
      makeFormData({ email: 'existing@example.com', password: 'password123' })
    )
    expect(result).toEqual({
      error: 'An account with this email already exists. Please sign in instead.',
    })
  })

  it('returns duplicate email error when Supabase message contains "already registered"', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'User already registered' },
    })

    const result = await registerAction(
      makeFormData({ email: 'existing@example.com', password: 'password123' })
    )
    expect(result).toEqual({
      error: 'An account with this email already exists. Please sign in instead.',
    })
  })

  it('calls redirect("/dashboard") on successful registration', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: {} }, error: null })

    await registerAction(
      makeFormData({ email: 'new@example.com', password: 'password123' })
    )

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })
})

// ---------------------------------------------------------------------------
// loginAction
// ---------------------------------------------------------------------------
describe('loginAction', () => {
  it('returns error when email is missing', async () => {
    const result = await loginAction(makeFormData({ password: 'secret123' }))
    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('returns error when password is missing', async () => {
    const result = await loginAction(makeFormData({ email: 'user@example.com' }))
    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('returns generic error message on invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' },
    })

    const result = await loginAction(
      makeFormData({ email: 'user@example.com', password: 'wrongpassword' })
    )
    expect(result).toEqual({
      error: 'Invalid email or password. Please try again.',
    })
    // Ensure the error does not reveal which field is wrong
    expect((result as { error: string }).error).not.toMatch(/email.*correct|password.*correct/i)
  })

  it('calls redirect("/dashboard") on successful login', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: {}, session: {} },
      error: null,
    })

    await loginAction(
      makeFormData({ email: 'user@example.com', password: 'correctpassword' })
    )

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })
})

// ---------------------------------------------------------------------------
// logoutAction
// ---------------------------------------------------------------------------
describe('logoutAction', () => {
  it('calls supabase.auth.signOut()', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })

    await logoutAction()

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('calls redirect("/login") after sign out', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })

    await logoutAction()

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})

// ---------------------------------------------------------------------------
// forgotPasswordAction
// ---------------------------------------------------------------------------
describe('forgotPasswordAction', () => {
  it('returns error when email is missing', async () => {
    const result = await forgotPasswordAction(makeFormData({}))
    expect(result).toEqual({ error: 'Email is required.' })
  })

  it('returns success message when Supabase call succeeds', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null })

    const result = await forgotPasswordAction(
      makeFormData({ email: 'user@example.com' })
    )
    expect(result).toEqual({
      message:
        'If an account exists for that email, a password reset link has been sent.',
    })
  })

  it('returns error when Supabase call fails', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email rate limit exceeded' },
    })

    const result = await forgotPasswordAction(
      makeFormData({ email: 'user@example.com' })
    )
    expect(result).toEqual({
      error: 'Failed to send reset email. Please try again.',
    })
  })
})
