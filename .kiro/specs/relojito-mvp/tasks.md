# Tasks — Relojito MVP

## Task Overview

Tasks are ordered by dependency: auth → data layer → UI screens → sync.
Each task references the requirements it satisfies.

---

- [x] 1. Project Setup and Design System
  - [x] 1.1 Initialise Next.js 14 project with TypeScript, Tailwind CSS, and ESLint
  - [x] 1.2 Install and configure dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `@fortawesome/fontawesome-free`
  - [x] 1.3 Configure Inter font via `next/font/google` in the root layout
  - [x] 1.4 Create `src/styles/tokens.css` with all light-mode and dark-mode CSS custom properties from the "Ethereal Precision" palette
  - [x] 1.5 Extend `tailwind.config.ts` to reference CSS token variables for colors, spacing, and border-radius
  - [x] 1.6 Create `src/styles/globals.css` importing Tailwind base layers and `tokens.css`
  - [x] 1.7 Add a blocking `<script>` in the root `layout.tsx` to apply `data-theme="dark"` from `localStorage` before first paint (prevents FOUC)

- [x] 2. Supabase Project and Database Schema
  - [x] 2.1 Create Supabase project and store `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
  - [x] 2.2 Write and apply migration: create `timers` table with all columns, constraints, and the `(user_id, name)` unique index
  - [x] 2.3 Write and apply migration: create `sessions` table with all columns, constraints, `end_after_start` check, and the `one_active_session_per_user` partial unique index
  - [x] 2.4 Enable RLS on both tables and create the "Users can manage their own timers" and "Users can manage their own sessions" policies
  - [x] 2.5 Create `src/lib/supabase/client.ts` (browser client) and `src/lib/supabase/server.ts` (server client using `@supabase/ssr`)
  - [x] 2.6 Create `src/lib/supabase/middleware.ts` and wire it into `middleware.ts` at the project root to refresh auth sessions and protect `/(app)/*` routes

- [x] 3. Authentication
  - [x] 3.1 Create the Login page (`/login`) with email/password form, "Forgot Password?" link, error display, and a link to Register
  - [x] 3.2 Create the Register page (`/register`) with email/password form and error display
  - [x] 3.3 Implement login Server Action: call `supabase.auth.signInWithPassword`, handle errors, redirect to `/dashboard` on success
  - [x] 3.4 Implement register Server Action: call `supabase.auth.signUp`, handle duplicate-email error, redirect to `/dashboard` on success
  - [x] 3.5 Implement logout action: call `supabase.auth.signOut`, clear cookies, redirect to `/login`
  - [x] 3.6 Implement forgot password action: call `supabase.auth.resetPasswordForEmail`, display confirmation message on the Login screen
  - [x] 3.7 Create the Reset Password page (`/auth/reset-password`) with a new password form; implement the update action via `supabase.auth.updateUser({ password })`, redirect to `/login` on success
  - [x] 3.8 Verify that the middleware redirects unauthenticated users from `/(app)/*` to `/login` and that the session persists across browser refreshes

- [x] 4. App Shell and Navigation
  - [x] 4.1 Create the authenticated shell layout (`src/app/(app)/layout.tsx`) that wraps all authenticated screens
  - [x] 4.2 Create `<Sidebar>` component with navigation items (Timers, History, Stats, Settings) using FA icons, visible at ≥ 1280px
  - [x] 4.3 Create `<BottomNav>` component with the same navigation items, visible below 1280px
  - [x] 4.4 Apply `max-width: 800px` content constraint on desktop inside the shell layout
  - [x] 4.5 Highlight the active navigation item based on the current route

- [x] 5. Timer Management (CRUD)
  - [x] 5.1 Create the Dashboard page (`/dashboard`) that fetches and lists the authenticated user's timers ordered by `created_at ASC`, with a date heading (current local date) and motivational subtitle
  - [x] 5.2 Create the `<TimerCard>` component in idle state: shows timer icon in a colored square, timer name, "Today: Xm" subtitle (sum of today's closed sessions for that timer), and a dark START button
  - [x] 5.3 Create the Create Timer screen/modal with name input (max 32 chars), color picker (predefined palette, no custom color), and icon picker (12 FA icons)
  - [x] 5.4 Implement create timer Server Action: validate inputs, insert into `timers`, return errors for duplicate name or invalid length
  - [x] 5.5 Create the Edit Timer screen/modal pre-populated with existing timer data
  - [x] 5.6 Implement update timer Server Action: validate inputs, update `timers` record
  - [x] 5.7 Implement delete timer flow: show confirmation dialog warning about cascade session deletion, then call delete Server Action
  - [x] 5.8 Implement delete timer Server Action: delete the timer record (cascade handles sessions)

- [x] 6. Timer Interaction (Start / Stop)
  - [x] 6.1 Implement start timer action: insert a new session with `start_time = now()`, `end_time = null`, `source = 'automatic'`
  - [x] 6.2 Update `<TimerCard>` to running state: full-color background, live HH:MM:SS counter using `Date.now() - start_time` on each 1-second tick
  - [x] 6.3 Implement stop timer action: update the active session with `end_time = now()` and `duration_seconds = floor((end_time - start_time) / 1000)`
  - [x] 6.4 Enforce single-active-timer constraint in the UI: disable Start buttons on all other timers while one is running
  - [x] 6.5 On authenticated shell mount, query for an orphaned session (`end_time IS NULL`); if found, display a recovery banner with Stop and Discard actions
  - [x] 6.6 Implement Stop action in recovery banner: close the orphaned session with current time
  - [x] 6.7 Implement Discard action in recovery banner: delete the orphaned session

- [x] 7. Cross-Device Real-Time Sync
  - [x] 7.1 In the authenticated shell, subscribe to Supabase Realtime `postgres_changes` on the `sessions` table filtered by `user_id`
  - [x] 7.2 On INSERT event: update local timer state to show the newly active session on the correct timer card
  - [x] 7.3 On UPDATE event: if `end_time` is now set, update local state to return the timer card to idle
  - [x] 7.4 Tear down the Realtime subscription on shell unmount
  - [x] 7.5 Verify that starting/stopping a timer on one browser tab updates the UI in a second tab within 2 seconds

- [x] 8. History Screen
  - [x] 8.1 Create the History page (`/history`) that fetches closed sessions joined with timer data, ordered by `start_time DESC`, with pagination (LIMIT 50 OFFSET n)
  - [x] 8.2 Implement client-side day grouping: convert `start_time` UTC to local timezone and group by calendar date
  - [x] 8.3 Render each day group with a header showing the date and a count of sessions for that day
  - [x] 8.4 Render each session row with timer icon (FA), timer color, timer name, time range (local time), duration badge, and a tappable chevron
  - [x] 8.5 Add a "+" button to the History page that opens the Manual_Entry_Modal
  - [x] 8.6 Display skeleton loading states while session data is being fetched

- [x] 9. Manual Session Editing
  - [x] 9.1 Create the `<EditEntryModal>` component with timer selector grid, date picker, start time picker, end time picker, live-updating read-only duration field, Delete button, and Save button
  - [x] 9.2 Create the `<ManualEntryModal>` component with the same fields plus Cancel and Register buttons (no Delete button)
  - [x] 9.3 Implement client-side validation: prevent save if `end_time ≤ start_time` and display a descriptive error
  - [x] 9.4 Implement overlap detection before save: run the overlap query; if count > 0, show the Overlap_Warning with an Accept button
  - [x] 9.5 Implement save session Server Action: upsert the session with `source = 'manual'`, validate constraints
  - [x] 9.6 Implement delete session flow in EditEntryModal: show confirmation dialog, then call delete Server Action
  - [x] 9.7 Implement delete session Server Action: permanently delete the session by id and user_id
  - [x] 9.8 Wire the Edit_Entry_Modal to open when a session row in History is tapped, pre-populated with that session's data

- [x] 10. Stats Screen
  - [x] 10.1 Create the Stats page (`/stats`) with a time range selector (7 days / 30 days, default 7 days)
  - [x] 10.2 Fetch aggregated stats: `SUM(duration_seconds)` and `COUNT(*)` per timer for closed sessions in the selected range
  - [x] 10.3 Implement the `<DonutChart>` SVG component: render segments using each timer's color, display total time in the center
  - [x] 10.4 Render the breakdown list below the chart: timer icon, name, total hours, percentage of total, and a proportional progress bar filled with the timer's color
  - [x] 10.5 Implement overlap detection for the stats range: if any two sessions in the range overlap, display the non-blocking overlap notice with an Accept button to dismiss
  - [x] 10.6 Display skeleton loading states while stats data is being fetched

- [x] 11. Settings Screen
  - [x] 11.1 Create the Settings page (`/settings`) with a profile header showing user avatar (initial), display name (email local part), and read-only email
  - [x] 11.2 Implement the Account Security section with a Change Password form
  - [x] 11.3 Implement change password Server Action: call `supabase.auth.updateUser({ password })`, handle errors
  - [x] 11.4 Implement the Appearance section with a Dark Mode toggle that reads/writes `localStorage` and toggles `data-theme="dark"` on `<html>`
  - [x] 11.5 Implement the Danger Zone section with a Delete Account button and explicit confirmation dialog
  - [x] 11.6 Implement delete account Server Action: call `supabase.auth.admin.deleteUser` (or equivalent), which cascades to all timers and sessions via DB constraints, then sign out

- [x] 12. Skeleton States and Polish
  - [x] 12.1 Add skeleton loading components for the Dashboard timer grid
  - [x] 12.2 Add skeleton loading components for the History session list
  - [x] 12.3 Add skeleton loading components for the Stats chart and breakdown list
  - [x] 12.4 Verify all screens are fully functional at 375px viewport width (mobile)
  - [x] 12.5 Verify all screens are fully functional at 1280px+ viewport width (desktop) with sidebar navigation and 800px content constraint
  - [x] 12.6 Verify dark mode applies correctly to all screens without any hardcoded hex values in component styles

- [x] 13. Testing
  - [x] 13.1 Write unit tests for `formatHHMMSS` and verify the round-trip property: `parseHHMMSS(formatHHMMSS(n)) === n` for arbitrary non-negative integers
  - [x] 13.2 Write unit tests for the overlap detection utility and verify symmetry: `overlaps(A, B) === overlaps(B, A)` for arbitrary interval pairs
  - [x] 13.3 Write unit tests for the stats aggregation function and verify it equals a naive `reduce` sum for arbitrary session sets
  - [x] 13.4 Write a test that parses `tokens.css` and asserts every light-palette token is also present in the dark-palette block
  - [x] 13.5 Write integration tests for the authentication flow (register, login, logout, session persistence)
  - [x] 13.6 Write integration tests for timer CRUD (create, edit, delete with cascade)
  - [x] 13.7 Write integration tests for session start/stop and orphaned session recovery
