# Requirements Document — Relojito MVP

## Introduction

Relojito is a minimalist, distraction-free web application for tracking time
spent on personal activities (reading, meditating, running, etc.). Users create
named timers with a color and icon, then start and stop them with a single tap.
Sessions are persisted in the cloud and synced in real time across devices.
The application targets both desktop (sidebar navigation) and mobile (bottom
navigation bar) form factors.

---

## Glossary

- **App**: The Relojito web application.
- **User**: An authenticated person using the App.
- **Timer**: A named, color-coded, icon-tagged entity representing a trackable
  activity (e.g. "Running", "Reading").
- **Session**: A single time-tracking entry with a start time, an optional end
  time, and a calculated duration. A session whose `end_time` is `null` is
  called an **active session**. A session whose `end_time` is not `null` is
  called a **closed session**.
- **Dashboard**: The main screen listing all of the User's Timers.
- **History**: The screen listing all closed Sessions grouped by day.
- **Stats**: The screen showing aggregated time data with a donut chart.
- **Settings**: The screen for account management and app preferences.
- **Auth_Service**: The Supabase Auth subsystem responsible for user identity.
- **DB**: The Supabase PostgreSQL database.
- **Sync_Service**: The Supabase Realtime subsystem responsible for cross-device
  state propagation.
- **Timer_Card**: The UI component on the Dashboard representing a single Timer.
- **Edit_Entry_Modal**: The modal dialog for editing an existing closed Session.
- **Manual_Entry_Modal**: The modal dialog for creating a new Session manually.
- **Overlap_Warning**: A non-blocking notice informing the User that sessions
  overlap in time.
- **FA**: Font Awesome Free icon library.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a new visitor, I want to register and log in with email and
password, so that my timers and sessions are securely associated with my account.

#### Acceptance Criteria

1. WHEN a User visits the App for the first time without an active session,
   THE App SHALL display the Login screen.
2. WHEN a User submits a valid email and password on the registration form,
   THE Auth_Service SHALL create a new account and authenticate the User.
3. IF a User submits a registration form with an email that is already
   registered, THEN THE Auth_Service SHALL return an error and THE App SHALL
   display a descriptive error message.
4. WHEN a User is authenticated, THE App SHALL persist the session across
   browser refreshes without requiring re-login.
5. WHEN a User taps the logout action, THE App SHALL clear all local session
   state and redirect the User to the Login screen.
6. IF a User submits a login form with invalid credentials, THEN THE App SHALL
   display a descriptive error message without revealing which field is wrong.

---

### Requirement 2: Timer Management

**User Story:** As an authenticated User, I want to create, edit, and delete
timers, so that I can track different activities separately.

#### Acceptance Criteria

1. WHEN a User submits the Create Timer form with a valid name (1–32
   characters), a color from the predefined palette, and an icon from the
   predefined set, THE DB SHALL persist a new Timer record associated with
   the User.
2. IF a User submits the Create Timer form with a name that already exists for
   that User, THEN THE App SHALL prevent saving and display a descriptive
   error message.
3. IF a User submits the Create Timer form with an empty name or a name
   exceeding 32 characters, THEN THE App SHALL prevent saving and display a
   descriptive error message.
4. WHEN a User submits the Edit Timer form with valid values, THE DB SHALL
   update the Timer's name, color, and icon.
5. WHEN a User taps the delete action on a Timer, THE App SHALL display an
   explicit confirmation dialog warning that all associated Sessions will also
   be deleted.
6. WHEN a User confirms Timer deletion, THE DB SHALL permanently delete the
   Timer and all its associated Sessions via cascade delete.
7. THE App SHALL display Timers on the Dashboard ordered by `created_at` ASC
   in v1.
8. THE color picker SHALL offer exactly 7 predefined colors and no custom
   color option: Indigo (`#5850EC`), Brown (`#5F4B1B`), Red (`#F94144`),
   Green (`#10B981`), Amber (`#F59E0B`), Purple (`#8B5CF6`), Sky (`#0EA5E9`).

---

### Requirement 3: Timer Interaction (Start / Stop)

**User Story:** As an authenticated User, I want to start and stop a timer with
a single tap, so that I can record time spent on an activity effortlessly.

#### Acceptance Criteria

1. WHEN a User taps Start on an idle Timer_Card, THE DB SHALL create a new
   Session with `start_time = now()` (UTC), `end_time = null`, and
   `source = 'automatic'`.
2. WHEN a Session is created, THE Timer_Card SHALL expand to a full-color
   background and display a live running counter in HH:MM:SS format, updating
   every second.
3. WHEN a User taps Stop on a running Timer_Card, THE DB SHALL update the
   active Session by setting `end_time = now()` (UTC) and
   `duration_seconds = (end_time - start_time)` in whole seconds.
4. WHEN a Session is closed, THE Timer_Card SHALL return to its idle visual
   state.
5. WHILE a Session is active, THE App SHALL prevent the User from starting any
   other Timer.
6. WHEN a User closes or refreshes the browser while a Session is active,
   THE App SHALL preserve the active Session in the DB so it can be recovered
   on return.
7. WHEN a User opens the App and an active Session (end_time = null) exists for
   that User, THE App SHALL display a notice informing the User and offer two
   actions: Stop (close the session with the current time) or Discard
   (delete the session).
8. WHEN a User views the Dashboard, THE App SHALL display the current calendar
   date as a large heading and a motivational subtitle below it.
9. WHEN a User views an idle Timer_Card, THE App SHALL display the total time
   logged for that Timer today (e.g. "Today: 45m") below the Timer name.

---

### Requirement 4: Cross-Device Sync

**User Story:** As a User with multiple devices, I want timer state to sync in
real time, so that starting or stopping a timer on one device is immediately
reflected on all others.

#### Acceptance Criteria

1. WHEN a User opens the App on a second device while a Session is active on
   another device, THE App SHALL reflect the running timer state accurately,
   including the elapsed time.
2. WHEN a Session is started or stopped on any device, THE Sync_Service SHALL
   propagate the state change to all other active browser sessions of that
   User in real time.
3. WHEN the Sync_Service delivers a state update, THE App SHALL update the
   Timer_Card UI without requiring a manual page refresh.

---

### Requirement 5: Stats

**User Story:** As a User, I want to see a visual breakdown of time spent per
timer over a selected period, so that I can understand my habits at a glance.

#### Acceptance Criteria

1. WHEN a User navigates to Stats, THE App SHALL display a donut chart showing
   time distribution across all Timers for the selected time range, using each
   Timer's color as the segment color.
2. WHEN a User navigates to Stats, THE App SHALL display the total aggregated
   time for the selected range in the center of the donut chart.
3. WHEN a User navigates to Stats, THE App SHALL display a detailed breakdown
   list showing, for each Timer: the Timer icon, name, total hours, percentage
   of total time, and a proportional progress bar using the Timer's color.
4. WHEN a User selects a time range, THE available options SHALL be "7 days"
   and "30 days", with "7 days" as the default.
5. WHEN time is aggregated, THE App SHALL use `SUM(duration_seconds)` per
   Timer from closed Sessions whose `start_time` falls within the selected
   range — sessions are never deduplicated.
6. WHEN the aggregated data for the selected range contains Sessions whose
   time ranges overlap, THE App SHALL display a non-blocking notice informing
   the User that some sessions overlap and total time may exceed real elapsed
   time, with an "Accept" button to dismiss it.

---

### Requirement 6: History

**User Story:** As a User, I want to browse my past sessions grouped by day,
so that I can review what I tracked and when.

#### Acceptance Criteria

1. WHEN a User navigates to History, THE App SHALL display all closed Sessions
   (end_time IS NOT NULL) grouped by calendar day in descending order
   (most recent day first), using the User's local timezone for day grouping.
2. WHEN sessions are grouped by day, THE App SHALL display a count of session
   logs for each day.
3. WHEN a User views a session row, THE App SHALL display the Timer's icon and
   color, the Timer's name, the time range (start–end in local time), a
   duration badge, and a chevron indicating the row is tappable.
4. WHEN a User taps a session row, THE Edit_Entry_Modal SHALL open pre-populated
   with that Session's data.
5. WHEN a User taps the "+" button in History, THE Manual_Entry_Modal SHALL
   open.

---

### Requirement 7: Manual Session Editing

**User Story:** As a User, I want to create and edit sessions manually, so that
I can correct mistakes or log time I forgot to track.

#### Acceptance Criteria

1. WHEN the Edit_Entry_Modal opens, THE App SHALL display a Timer selector
   (grid of the User's Timers), a date picker, a start time picker, an end
   time picker, a read-only calculated duration field that updates live, a
   Delete button, and a Save button.
2. WHEN the Manual_Entry_Modal opens, THE App SHALL display a Timer selector
   (grid of the User's Timers), a date picker, a start time picker, an end
   time picker, a read-only calculated duration field that updates live, a
   Cancel button, and a Register button.
3. IF a User submits a session form where end time ≤ start time, THEN THE App
   SHALL prevent saving and display a descriptive error message.
4. WHEN a User saves a session (create or edit) and the session's time range
   overlaps with any existing closed Session of any Timer for that User, THE
   App SHALL display the Overlap_Warning before saving, with an "Accept" button
   to confirm and proceed.
5. WHEN a User confirms saving after the Overlap_Warning, THE DB SHALL persist
   the Session normally.
6. WHEN a Session is created or edited via a modal, THE DB SHALL record
   `source = 'manual'` for that Session.
7. WHEN a User taps the Delete button in the Edit_Entry_Modal, THE App SHALL
   display an explicit confirmation dialog before deletion.
8. WHEN a User confirms Session deletion, THE DB SHALL permanently delete the
   Session regardless of its source.

---

### Requirement 8: Settings

**User Story:** As a User, I want to manage my account and app preferences from
a Settings screen, so that I can control my data and appearance.

#### Acceptance Criteria

1. WHEN a User navigates to Settings, THE App SHALL display a profile header
   with a user avatar (initial or placeholder), the display name derived from
   the email local part, and the email address (read-only).
2. WHEN a User navigates to Settings, THE App SHALL provide a "Change Password"
   action in an Account Security section.
3. WHEN a User submits a valid new password via the Change Password form, THE
   Auth_Service SHALL update the User's password.
4. WHEN a User navigates to Settings, THE App SHALL provide a Dark Mode toggle
   in an Appearance section.
5. WHEN a User toggles Dark Mode, THE App SHALL switch the active CSS token
   palette between light and dark without requiring a page reload.
6. WHEN a User navigates to Settings, THE App SHALL provide a "Delete Account"
   action in a Danger Zone section.
7. WHEN a User taps "Delete Account", THE App SHALL display an explicit
   confirmation dialog before proceeding.
8. WHEN a User confirms account deletion, THE Auth_Service SHALL delete the
   User's account and THE DB SHALL permanently delete all associated Timers
   and Sessions.

---

### Requirement 9: Navigation

**User Story:** As a User, I want consistent navigation across all screens, so
that I can move between sections quickly on any device.

#### Acceptance Criteria

1. WHILE the User is authenticated and on a screen width of 1280px or wider,
   THE App SHALL display a sidebar navigation with items in this order:
   Timers, History, Stats, Settings.
2. WHILE the User is authenticated and on a screen width below 1280px, THE App
   SHALL display a bottom navigation bar with items in this order: Timers,
   History, Stats, Settings.
3. THE App SHALL use FA icons for all navigation items: `fa-grid-2` for Timers,
   `fa-clock-rotate-left` for History, `fa-chart-simple` for Stats,
   `fa-gear` for Settings.
4. WHEN a User taps a navigation item, THE App SHALL navigate to the
   corresponding screen and highlight the active item.

---

### Requirement 10: Icon Library and Timer Icon Picker

**User Story:** As a User, I want to choose from a curated set of icons when
creating or editing a timer, so that each activity is visually distinct.

#### Acceptance Criteria

1. THE App SHALL use Font Awesome Free (`@fortawesome/fontawesome-free`) as its
   sole icon library.
2. THE icon picker in Create Timer and Edit Timer SHALL offer exactly the
   following 12 icons: `person-running`, `book-open`, `person-praying`,
   `dumbbell`, `code`, `headphones`, `mug-saucer`, `paintbrush`, `moon`,
   `briefcase`, `music`, `pen-to-square`.
3. THE DB SHALL store icon identifiers using the Font Awesome icon name without
   prefix (e.g. `"person-running"`, `"book-open"`).
4. WHEN a Timer is displayed anywhere in the App, THE App SHALL render the
   icon using the corresponding FA class (e.g. `fa-solid fa-person-running`).

---

### Requirement 11: Responsive Design and Layout

**User Story:** As a User on any device, I want the app to be fully usable on
both desktop and mobile screen sizes, so that I can track time wherever I am.

#### Acceptance Criteria

1. THE App SHALL be fully functional on viewport widths of 375px and above.
2. WHILE the viewport width is 1280px or wider, THE App SHALL constrain content
   to a maximum width of 800px centered on the page.
3. THE App SHALL display skeleton loading states instead of blank screens while
   data is being fetched.
4. THE timer counter SHALL update every second without perceptible lag on
   supported devices.

---

### Requirement 12: Design Tokens and Dark Mode

**User Story:** As a User, I want a visually consistent interface that supports
dark mode, so that I can use the app comfortably in any lighting condition.

#### Acceptance Criteria

1. THE App SHALL define all colors as semantic CSS custom properties (tokens)
   mapped to the "Ethereal Precision" palette — hex values SHALL NOT be
   hardcoded in component styles.
2. THE App SHALL provide both a light palette and a dark palette using the same
   set of CSS token names.
3. WHEN Dark Mode is active, THE App SHALL apply the dark palette tokens
   globally without any component-level style changes.
4. THE App SHALL use the Inter font family (loaded via Google Fonts) for all
   typography.

---

### Requirement 13: Data Integrity and Timestamps

**User Story:** As a User, I want my session data to be accurate regardless of
the device or timezone I use, so that my tracked time is always correct.

#### Acceptance Criteria

1. THE DB SHALL store all timestamps (`start_time`, `end_time`, `created_at`,
   `updated_at`) in UTC.
2. THE App SHALL perform all timezone conversions from UTC to local time
   exclusively on the client.
3. THE DB SHALL enforce that `end_time > start_time` for all closed Sessions.
4. THE DB SHALL enforce that only one Session per User may have
   `end_time = null` at any given time.
5. THE DB SHALL enforce Row Level Security (RLS) policies ensuring Users can
   only read and write their own Timer and Session records.
