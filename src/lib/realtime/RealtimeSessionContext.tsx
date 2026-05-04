'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of a sessions row as returned by Realtime postgres_changes */
export interface SessionRow {
  id: string
  timer_id: string
  user_id: string
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  source: string
  created_at: string
  updated_at: string
}

export type SessionChangePayload = RealtimePostgresChangesPayload<SessionRow>

interface RealtimeSessionContextValue {
  /** The most recent realtime payload received (INSERT or UPDATE). */
  lastPayload: SessionChangePayload | null
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RealtimeSessionContext = createContext<RealtimeSessionContextValue>({
  lastPayload: null,
})

// ─── Provider ─────────────────────────────────────────────────────────────────

interface RealtimeProviderProps {
  userId: string
  children: ReactNode
}

/**
 * Client component that subscribes to Supabase Realtime `postgres_changes`
 * on the `sessions` table filtered by the authenticated user's ID.
 *
 * Broadcasts INSERT and UPDATE events to all consumers via context.
 * Tears down the channel on unmount (task 7.4).
 */
export function RealtimeProvider({ userId, children }: RealtimeProviderProps) {
  const [lastPayload, setLastPayload] = useState<SessionChangePayload | null>(null)
  // Keep a stable ref to the supabase client so we don't recreate it on renders
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current

    // Subscribe to all changes on the sessions table for this user (task 7.1)
    const channel = supabase
      .channel('sessions-realtime')
      .on<SessionRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setLastPayload(payload)
        }
      )
      .subscribe()

    // Tear down on unmount (task 7.4)
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <RealtimeSessionContext.Provider value={{ lastPayload }}>
      {children}
    </RealtimeSessionContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Consume the latest realtime session change payload. */
export function useRealtimeSession() {
  return useContext(RealtimeSessionContext)
}
