// ─── Timer constants ──────────────────────────────────────────────────────────
// Kept in a plain (non-server) file so they can be imported by both
// server actions and client components without triggering the
// "use server can only export async functions" error.

export const ALLOWED_COLORS = [
  '#5850EC', // Indigo
  '#5F4B1B', // Brown
  '#F94144', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#0EA5E9', // Sky
] as const

export const ALLOWED_ICONS = [
  'person-running',
  'book-open',
  'person-praying',
  'dumbbell',
  'code',
  'headphones',
  'mug-saucer',
  'paintbrush',
  'moon',
  'briefcase',
  'music',
  'pen-to-square',
] as const

export type TimerActionResult =
  | { success: true; error?: never }
  | { success?: never; error: string }

export interface Timer {
  id: string
  name: string
  color: string
  icon: string
}
