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
  '#EC4899', // Pink
  '#374151', // Dark Grey
  '#F97316', // Orange
  '#166534', // Dark Green
  '#84CC16', // Lime
] as const

export const ALLOWED_ICONS = [
  'person-running',
  'person-walking',
  'dumbbell',
  'heart-pulse',
  'spa',
  'person-swimming',
  'person-biking',
  'person-praying',
  'moon',
  'bed',
  'brain',
  'briefcase',
  'laptop',
  'code',
  'graduation-cap',
  'chalkboard-user',
  'chart-line',
  'book-open',
  'pen-to-square',
  'paintbrush',
  'camera',
  'video',
  'music',
  'guitar',
  'chess',
  'gamepad',
  'youtube',
  'tiktok',
  'instagram',
  'facebook-f',
  'whatsapp',
  'reddit',
  'linkedin-in',
  'discord',
  'comment',
  'utensils',
  'mug-saucer',
  'car',
  'broom',
  'baby',
  'headphones',
  'house-chimney',
] as const

// Brand icons that require fa-brands instead of fa-solid
export const BRAND_ICONS = new Set([
  'youtube',
  'tiktok',
  'instagram',
  'facebook-f',
  'whatsapp',
  'reddit',
  'linkedin-in',
  'discord',
])

export type TimerActionResult =
  | { success: true; error?: never }
  | { success?: never; error: string }

export interface Timer {
  id: string
  name: string
  color: string
  icon: string
  is_active: boolean
}
