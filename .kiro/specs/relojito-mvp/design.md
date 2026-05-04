# Design Document — Relojito MVP

## Overview

Relojito is a Next.js web application backed by Supabase (PostgreSQL + Auth +
Realtime). The frontend uses Tailwind CSS with a custom CSS token layer derived
from the "Ethereal Precision" design system. Icons are provided exclusively by
Font Awesome Free. The app is deployed on Vercel.

The architecture follows a thin-client pattern: the browser owns UI state and
timezone conversion; the database owns all persistent state and enforces data
integrity via constraints and RLS policies.

---

## Tech Stack

| Layer            | Technology                                      |
|------------------|-------------------------------------------------|
| Frontend         | Next.js 14 (App Router), React 18               |
| Styling          | Tailwind CSS + CSS custom properties (tokens)   |
| Auth             | Supabase Auth (email/password)                  |
| Database         | Supabase PostgreSQL                             |
| Realtime sync    | Supabase Realtime (Postgres Changes)            |
| Deployment       | Vercel                                          |
| Icons            | Font Awesome Free (`@fortawesome/fontawesome-free`) |
| Font             | Inter (Google Fonts)                            |

---

## Architecture

### Directory Structure

```
src/
  app/                        # Next.js App Router pages
    (auth)/
      login/page.tsx
      register/page.tsx
    (app)/
      layout.tsx              # Shell with sidebar / bottom nav
      dashboard/page.tsx      # Timers screen
      history/page.tsx
      stats/page.tsx
      settings/page.tsx
  components/
    ui/                       # Primitive components (Button, Input, Modal…)
    timers/                   # Timer-specific components
    sessions/                 # Session / history components
    stats/                    # Stats chart components
    layout/                   # Sidebar, BottomNav, Shell
  lib/
    supabase/
      client.ts               # Browser Supabase client
      server.ts               # Server Supabase client (RSC / Server Actions)
      middleware.ts            # Auth session refresh middleware
    hooks/                    # Custom React hooks
    utils/                    # Date formatting, overlap detection, etc.
  styles/
    tokens.css                # CSS custom properties (light + dark palettes)
    globals.css               # Tailwind base + token imports
```

### Data Flow

```
User action
  → React component (optimistic UI update)
    → Supabase client (DB write)
      → Supabase Realtime broadcast
        → All connected clients update their local state
```

---

## Database Schema

### Table: `timers`

```sql
CREATE TABLE timers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 32),
  color       text        NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  icon        text        NOT NULL,
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own timers"
  ON timers FOR ALL
  USING (auth.uid() = user_id);
```

### Table: `sessions`

```sql
CREATE TABLE sessions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  timer_id          uuid        NOT NULL REFERENCES timers(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time        timestamptz NOT NULL,
  end_time          timestamptz,
  duration_seconds  integer     CHECK (duration_seconds > 0),
  source            text        NOT NULL CHECK (source IN ('automatic', 'manual')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_time IS NULL OR end_time > start_time)
);

-- Enforce at most one active session per user
CREATE UNIQUE INDEX one_active_session_per_user
  ON sessions (user_id)
  WHERE end_time IS NULL;

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
  ON sessions FOR ALL
  USING (auth.uid() = user_id);
```

---

## Design System — "Ethereal Precision"

### CSS Token Layer (`src/styles/tokens.css`)

All color values are defined as CSS custom properties. Components reference
tokens only — never raw hex values.

```css
:root {
  /* Surface */
  --color-surface:                    #f8f9fa;
  --color-surface-dim:                #d9dadb;
  --color-surface-bright:             #f8f9fa;
  --color-surface-container-lowest:   #ffffff;
  --color-surface-container-low:      #f3f4f5;
  --color-surface-container:          #edeeef;
  --color-surface-container-high:     #e7e8e9;
  --color-surface-container-highest:  #e1e3e4;
  --color-on-surface:                 #191c1d;
  --color-on-surface-variant:         #44474d;
  --color-inverse-surface:            #2e3132;
  --color-inverse-on-surface:         #f0f1f2;
  --color-outline:                    #75777e;
  --color-outline-variant:            #c5c6ce;
  --color-surface-tint:               #515f7a;

  /* Primary */
  --color-primary:                    #27354f;
  --color-on-primary:                 #ffffff;
  --color-primary-container:          #3e4c67;
  --color-on-primary-container:       #aebddd;
  --color-inverse-primary:            #b8c7e7;

  /* Secondary */
  --color-secondary:                  #4648d4;
  --color-on-secondary:               #ffffff;
  --color-secondary-container:        #6063ee;
  --color-on-secondary-container:     #fffbff;

  /* Tertiary */
  --color-tertiary:                   #45320c;
  --color-on-tertiary:                #ffffff;
  --color-tertiary-container:         #5e4821;
  --color-on-tertiary-container:      #d6b887;

  /* Error */
  --color-error:                      #ba1a1a;
  --color-on-error:                   #ffffff;
  --color-error-container:            #ffdad6;
  --color-on-error-container:         #93000a;

  /* Background */
  --color-background:                 #f8f9fa;
  --color-on-background:              #191c1d;
  --color-surface-variant:            #e1e3e4;
}

[data-theme="dark"] {
  /* Dark palette overrides — same token names, different values */
  --color-surface:                    #191c1d;
  --color-surface-dim:                #111314;
  --color-surface-bright:             #3a3d3e;
  --color-surface-container-lowest:   #0c0f10;
  --color-surface-container-low:      #191c1d;
  --color-surface-container:          #1d2021;
  --color-surface-container-high:     #282b2c;
  --color-surface-container-highest:  #333637;
  --color-on-surface:                 #e1e3e4;
  --color-on-surface-variant:         #c5c6ce;
  --color-inverse-surface:            #e1e3e4;
  --color-inverse-on-surface:         #2e3132;
  --color-outline:                    #8f9197;
  --color-outline-variant:            #44474d;
  --color-primary:                    #b8c7e7;
  --color-on-primary:                 #1e2d47;
  --color-primary-container:          #2a3a55;
  --color-on-primary-container:       #d6e3ff;
  --color-secondary:                  #bec2ff;
  --color-on-secondary:               #1e1f8e;
  --color-secondary-container:        #3032b8;
  --color-on-secondary-container:     #e1e0ff;
  --color-background:                 #191c1d;
  --color-on-background:              #e1e3e4;
  --color-surface-variant:            #44474d;
  --color-error:                      #ffb4ab;
  --color-on-error:                   #690005;
  --color-error-container:            #93000a;
  --color-on-error-container:         #ffdad6;
}
```

### Typography

Inter is loaded via `next/font/google`. Scale:

| Token       | Size  | Weight | Line-height | Letter-spacing |
|-------------|-------|--------|-------------|----------------|
| `h1`        | 32px  | 600    | 1.2         | -0.02em        |
| `h2`        | 24px  | 600    | 1.3         | -0.015em       |
| `h3`        | 18px  | 500    | 1.4         | -0.01em        |
| `body-lg`   | 16px  | 400    | 1.6         | —              |
| `body-md`   | 14px  | 400    | 1.5         | —              |
| `label-sm`  | 12px  | 500    | 1.0         | 0.02em         |

### Spacing (4px baseline grid)

`xs=4px` · `sm=8px` · `md=16px` · `lg=24px` · `xl=40px` · `gutter=24px` · `margin=32px`

### Border Radius

`sm=0.25rem` · `DEFAULT=0.5rem` · `md=0.75rem` · `lg=1rem` · `xl=1.5rem` · `full=9999px`

---

## Component Architecture

### Predefined Timer Color Palette

The color picker in Create Timer and Edit Timer offers exactly these 7 colors
(no custom color option in v1):

| Swatch | Hex       |
|--------|-----------|
| Indigo | `#5850EC` |
| Brown  | `#5F4B1B` |
| Red    | `#F94144` |
| Green  | `#10B981` |
| Amber  | `#F59E0B` |
| Purple | `#8B5CF6` |
| Sky    | `#0EA5E9` |

These values are stored as-is in the `color` column of the `timers` table and
used directly as the timer card background color when a session is running.

---

### Shell Layout (`src/app/(app)/layout.tsx`)

Renders the authenticated shell. Detects viewport width via a CSS media query
(`min-width: 1280px`) and renders either the `<Sidebar>` or `<BottomNav>`
component. Content is constrained to `max-width: 800px` on desktop.

### Timer Card (`src/components/timers/TimerCard.tsx`)

Two visual states:
- **Idle**: Shows timer name, icon in a colored square, "Today: Xm" subtitle
  (total seconds logged today for that timer, formatted as hours/minutes),
  and a dark START button.
- **Running**: Full-color background, HH:MM:SS counter (updated via
  `setInterval` every 1 000 ms), white outlined STOP button.

The running counter derives elapsed time from
`Date.now() - session.start_time` on each tick to avoid drift.

### Dashboard Header

The Dashboard page renders a date header above the timer list:
- **Heading (h1)**: Current calendar date in the user's local timezone
  (e.g. "July 24").
- **Subtitle**: A fixed motivational tagline: "Time flies either way. Make it
  count."

### Donut Chart (`src/components/stats/DonutChart.tsx`)

Rendered with an SVG `<circle>` stroke-dasharray technique (no external chart
library). Each segment uses the Timer's `color` value directly. Total time is
rendered as text in the center.

### Stats Breakdown List

Below the donut chart, each Timer entry in the breakdown list shows:
- Timer icon (FA) and name
- Total hours for the selected range
- Percentage of total time
- A proportional progress bar filled with the Timer's color

### Modals (`src/components/ui/Modal.tsx`)

A generic modal wrapper using a React portal and a focus trap. Specific modal
content (Edit_Entry_Modal, Manual_Entry_Modal) is composed inside.

---

## Key Implementation Details

### Authentication Flow

1. `middleware.ts` (Next.js middleware) calls `supabase.auth.getSession()` on
   every request. Unauthenticated requests to `/(app)/*` are redirected to
   `/login`.
2. On login/register, the Supabase client stores the session in a cookie
   (handled by `@supabase/ssr`).
3. Logout calls `supabase.auth.signOut()` and redirects to `/login`.
4. Password reset uses `supabase.auth.resetPasswordForEmail()` triggered from
   the Login screen. The user receives an email with a reset link, which lands
   on `/auth/reset-password` where they set a new password via
   `supabase.auth.updateUser({ password })`.

### Active Session Recovery

On app mount (inside the authenticated shell layout), the app queries:

```sql
SELECT * FROM sessions WHERE user_id = :uid AND end_time IS NULL LIMIT 1;
```

If a result is found, a recovery banner is shown with Stop / Discard actions.

### Real-Time Sync

The authenticated shell subscribes to Supabase Realtime on mount:

```ts
supabase
  .channel('sessions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'sessions',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // Update local session state
  })
  .subscribe();
```

The subscription is torn down on unmount.

### Overlap Detection

Before every session save (create or edit), the client runs the overlap query
defined in the data model. If `count > 0`, the Overlap_Warning is shown. The
user must tap "Accept" to proceed; the save is then executed normally.

### Dark Mode

Dark mode state is stored in `localStorage` and applied as a `data-theme="dark"`
attribute on `<html>`. The Settings toggle reads and writes this value. The
initial value is set in a blocking `<script>` tag in `layout.tsx` to prevent
flash of unstyled content (FOUC).

### Timer Counter Accuracy

The running counter uses `Date.now()` on each 1-second tick rather than
incrementing a counter variable, so it self-corrects for any tick jitter.

```ts
const elapsed = Math.floor((Date.now() - startTime) / 1000);
const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
const ss = String(elapsed % 60).padStart(2, '0');
```

---

## Screens and Navigation

### Navigation Items

| Label    | FA Icon class              | Route        |
|----------|----------------------------|--------------|
| Timers   | `fa-solid fa-grid-2`       | `/dashboard` |
| History  | `fa-solid fa-clock-rotate-left` | `/history` |
| Stats    | `fa-solid fa-chart-simple` | `/stats`     |
| Settings | `fa-solid fa-gear`         | `/settings`  |

### Screen Summary

| Screen              | Route                    | Notes                                      |
|---------------------|--------------------------|--------------------------------------------|
| Login               | `/login`                 | Public                                     |
| Register            | `/register`              | Public                                     |
| Reset Password      | `/auth/reset-password`   | Public — handles Supabase reset link       |
| Dashboard (Timers)  | `/dashboard`             | Default authenticated route                |
| History             | `/history`               | Closed sessions, grouped by day            |
| Stats               | `/stats`                 | Donut chart + breakdown list               |
| Settings            | `/settings`              | Profile, password, dark mode, delete acct  |
| Create Timer        | `/dashboard/new`         | Or modal — TBD during implementation       |
| Edit Timer          | `/dashboard/[id]/edit`   | Or modal                                   |

---

## Correctness Properties

### Property 1: Session Duration Consistency

For any closed Session, `duration_seconds` must equal the integer number of
seconds between `start_time` and `end_time`.

- **Type**: Invariant
- **Test approach**: For a range of randomly generated `(start_time, end_time)`
  pairs where `end_time > start_time`, verify that the computed
  `duration_seconds = floor((end_time - start_time) / 1000)` matches the
  stored value.

### Property 2: Timer Counter Round-Trip

The HH:MM:SS display function and its inverse (parsing HH:MM:SS back to
seconds) must satisfy a round-trip property.

- **Type**: Round-trip
- **Test approach**: For any non-negative integer `n` (seconds), verify that
  `parseHHMMSS(formatHHMMSS(n)) === n`.

### Property 3: Overlap Detection Symmetry

Overlap detection must be symmetric: if session A overlaps session B, then
session B overlaps session A.

- **Type**: Metamorphic
- **Test approach**: For randomly generated pairs of `(start, end)` intervals,
  verify that `overlaps(A, B) === overlaps(B, A)`.

### Property 4: Stats Aggregation Correctness

The total seconds shown in Stats must equal the sum of `duration_seconds` of
all closed Sessions in the selected range.

- **Type**: Model-based
- **Test approach**: For a randomly generated set of Sessions, verify that the
  aggregation function returns the same total as a naive `reduce` sum.

### Property 5: Dark Mode Token Completeness

Every CSS token defined in the light palette must also be defined in the dark
palette.

- **Type**: Invariant
- **Test approach**: Parse `tokens.css` and assert that the set of token names
  under `[data-theme="dark"]` is a superset of the token names under `:root`.
