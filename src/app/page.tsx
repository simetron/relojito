import Link from 'next/link'

// ─── Mock UI components ───────────────────────────────────────────────────────

function MockTimerCard({
  name,
  icon,
  color,
  today,
  running,
  elapsed,
}: {
  name: string
  icon: string
  color: string
  today?: string
  running?: boolean
  elapsed?: string
}) {
  if (running) {
    return (
      <div
        className="rounded-xl flex items-center gap-3 px-4 py-3.5"
        style={{ backgroundColor: color }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <i className={`fa-solid fa-${icon} text-[20px] text-white`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate leading-tight">{name}</p>
          <p className="text-[20px] font-bold text-white leading-tight">{elapsed}</p>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white flex-shrink-0"
          style={{ border: '2px solid rgba(255,255,255,0.8)' }}
        >
          STOP
        </div>
      </div>
    )
  }
  return (
    <div
      className="rounded-xl flex items-center gap-3 px-3 py-3"
      style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ backgroundColor: color }}
      >
        <i className={`fa-solid fa-${icon} text-[18px] text-white`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate" style={{ color: 'var(--color-on-surface)' }}>{name}</p>
        {today && <p className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>{today}</p>}
      </div>
      <div
        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0"
        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
      >
        START
      </div>
    </div>
  )
}

function MockHistoryRow({
  name, icon, color, time, duration,
}: {
  name: string; icon: string; color: string; time: string; duration: string
}) {
  return (
    <div
      className="rounded-lg p-2.5 flex items-center gap-2"
      style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
    >
      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color }}>
        <i className={`fa-solid fa-${icon} text-[11px] text-white`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-on-surface)' }}>{name}</p>
        <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>{time}</p>
      </div>
      <span
        className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ backgroundColor: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' }}
      >
        {duration}
      </span>
    </div>
  )
}

function MockStatBar({ name, icon, color, pct, time }: { name: string; icon: string; color: string; pct: number; time: string }) {
  return (
    <div
      className="rounded-lg p-2.5 flex items-center gap-2"
      style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
    >
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color }}>
        <i className={`fa-solid fa-${icon} text-[10px] text-white`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-on-surface)' }}>{name}</span>
          <span className="text-[10px] font-medium flex-shrink-0 ml-1" style={{ color: 'var(--color-on-surface)' }}>{time}</span>
        </div>
        <div className="w-full h-1 rounded-full" style={{ backgroundColor: 'var(--color-surface-container-high)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  )
}

function PhoneFrame({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="relative mx-auto" style={{ width: 300 }}>
      {/* Outer titanium shell */}
      <div
        className="relative rounded-[3rem] overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #d4d4d4 0%, #a8a8a8 40%, #c8c8c8 60%, #b0b0b0 100%)',
          padding: '3px',
        }}
      >
        {/* Side buttons — volume up */}
        <div
          className="absolute rounded-full"
          style={{
            left: '-5px', top: '110px', width: '4px', height: '28px',
            background: 'linear-gradient(to right, #888, #bbb)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: '-5px', top: '148px', width: '4px', height: '28px',
            background: 'linear-gradient(to right, #888, #bbb)',
          }}
        />
        {/* Side button — power */}
        <div
          className="absolute rounded-full"
          style={{
            right: '-5px', top: '130px', width: '4px', height: '52px',
            background: 'linear-gradient(to left, #888, #bbb)',
          }}
        />

        {/* Inner black bezel */}
        <div
          className="rounded-[2.8rem] overflow-hidden"
          style={{ backgroundColor: '#000', padding: '2px' }}
        >
          {/* Screen */}
          <div
            className="rounded-[2.6rem] overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            {/* Status bar with Dynamic Island */}
            <div
              className="relative flex items-center justify-between px-5 pt-3 pb-1"
              style={{ backgroundColor: 'var(--color-surface-container-low)' }}
            >
              <span className="text-[10px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>9:41</span>
              {/* Dynamic Island */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-2 rounded-full"
                style={{ width: '80px', height: '22px', backgroundColor: '#000' }}
              />
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-signal text-[9px]" style={{ color: 'var(--color-on-surface)' }} />
                <i className="fa-solid fa-battery-full text-[9px]" style={{ color: 'var(--color-on-surface)' }} />
              </div>
            </div>

            {/* App content */}
            <div className="px-4 py-3 space-y-2.5 overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)', height: '570px' }}>
              {title && (
                <p className="text-[18px] font-bold mb-3" style={{ color: 'var(--color-primary)' }}>{title}</p>
              )}
              {children}
            </div>

            {/* Home indicator */}
            <div
              className="flex justify-center py-2"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div
                className="rounded-full"
                style={{ width: '100px', height: '4px', backgroundColor: 'var(--color-on-surface)', opacity: 0.2 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-primary-container)' }}
      >
        <i className={`fa-solid fa-${icon} text-[16px]`} style={{ color: 'var(--color-on-primary-container)' }} />
      </div>
      <h3 className="text-[16px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>{title}</h3>
      <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>{description}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>

      {/* ── Nav ── */}
      <div
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <i className="fa-solid fa-hourglass-half text-[13px] text-white" />
          </div>
          <span className="text-[18px] font-bold" style={{ color: 'var(--color-on-surface)' }}>Relojito</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 rounded-xl text-[14px] font-semibold transition-all active:scale-95"
          style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-on-secondary)' }}
        >
          Sign in
        </Link>
      </nav>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-center lg:text-left">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium mb-6"
            style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)' }}
          >
            <i className="fa-solid fa-hourglass-half text-[10px]" />
            Minimalist time tracking
          </div>
          <h1
            className="text-[42px] sm:text-[52px] font-bold leading-[1.1] tracking-[-0.03em] mb-6"
            style={{ color: 'var(--color-on-surface)' }}
          >
            Time flies either way.<br />
            <span style={{ color: 'var(--color-secondary)' }}>Make it count.</span>
          </h1>
          <p
            className="text-[18px] leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            Relojito is a time tracking app built for people who want to know exactly where their hours go — without the complexity.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-95 text-center"
              style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-on-secondary)' }}
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-95 text-center"
              style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface)', border: '1px solid var(--color-outline-variant)' }}
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="flex-shrink-0">
          <PhoneFrame title="May 6">
            <MockTimerCard name="Sport" icon="person-running" color="#10B981" today="Today: 28m" />
            <MockTimerCard name="Work" icon="briefcase" color="#5850EC" running elapsed="01:23:45" />
            <MockTimerCard name="Reading" icon="book-open" color="#F59E0B" today="Today: 45m" />
            <MockTimerCard name="Meditation" icon="person-praying" color="#8B5CF6" />
            <div
              className="rounded-xl flex items-center justify-center p-2.5 mt-1"
              style={{ border: '2px dashed var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}
            >
              <span className="text-[11px] font-medium">New Timer +</span>
            </div>
          </PhoneFrame>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[32px] font-bold tracking-[-0.02em] mb-3" style={{ color: 'var(--color-on-surface)' }}>
              Everything you need, nothing more
            </h2>
            <p className="text-[16px]" style={{ color: 'var(--color-on-surface-variant)' }}>
              Designed to be simple yet complete
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon="clock" title="Custom timers" description="Create timers with your own name, color and icon. Arrange them in any order you like." />
            <FeatureCard icon="bolt" title="One tap to start" description="Press START and time begins. Press STOP when you're done. No extra steps." />
            <FeatureCard icon="rotate-left" title="Full history" description="All your sessions grouped by day. Edit entries or add them manually whenever you need." />
            <FeatureCard icon="chart-simple" title="Visual stats" description="Donut chart showing total time per activity over the last 7 or 30 days." />
            <FeatureCard icon="arrows-rotate" title="Real-time sync" description="Start a timer on your phone and watch it run on your computer instantly." />
            <FeatureCard icon="moon" title="Dark mode" description="Switch between light and dark theme. Your preference syncs across all your devices." />
          </div>
        </div>
      </section>

      {/* ── History section ── */}
      <section className="max-w-5xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-shrink-0 order-2 lg:order-1">
          <PhoneFrame title="History">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-outline)' }}>Today · 3 sessions</p>
              <MockHistoryRow name="Work" icon="briefcase" color="#5850EC" time="09:00 – 11:30" duration="2h 30m" />
              <MockHistoryRow name="Sport" icon="person-running" color="#10B981" time="12:00 – 12:45" duration="45m" />
              <MockHistoryRow name="Reading" icon="book-open" color="#F59E0B" time="15:00 – 15:30" duration="30m" />
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-2 mb-1.5" style={{ color: 'var(--color-outline)' }}>Yesterday · 2 sessions</p>
              <MockHistoryRow name="Work" icon="briefcase" color="#5850EC" time="10:00 – 13:00" duration="3h" />
              <MockHistoryRow name="Meditation" icon="person-praying" color="#8B5CF6" time="07:30 – 07:50" duration="20m" />
            </div>
          </PhoneFrame>
        </div>
        <div className="flex-1 order-1 lg:order-2 text-center lg:text-left">
          <h2 className="text-[32px] font-bold tracking-[-0.02em] mb-4" style={{ color: 'var(--color-on-surface)' }}>
            Your history, always at hand
          </h2>
          <p className="text-[16px] leading-relaxed mb-6" style={{ color: 'var(--color-on-surface-variant)' }}>
            All your sessions organized by day. Tap any entry to edit it, or add sessions manually if you forgot to start the timer.
          </p>
          <ul className="space-y-3 text-left inline-block">
            {[
              'Grouped by day in your timezone',
              'Edit start and end times',
              'Add past entries manually',
              'Sessions never get lost',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-secondary)' }}>
                  <i className="fa-solid fa-check text-[9px] text-white" />
                </div>
                <span className="text-[14px]" style={{ color: 'var(--color-on-surface)' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Stats section ── */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-[32px] font-bold tracking-[-0.02em] mb-4" style={{ color: 'var(--color-on-surface)' }}>
              Understand how you spend your time
            </h2>
            <p className="text-[16px] leading-relaxed mb-6" style={{ color: 'var(--color-on-surface-variant)' }}>
              Stats give you a clear picture of how much time you've dedicated to each activity over the last 7 or 30 days.
            </p>
            <ul className="space-y-3 text-left inline-block">
              {[
                'Donut chart by activity',
                'Percentage and total hours',
                'Select 7 or 30 day range',
                'Updates in real time',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-secondary)' }}>
                    <i className="fa-solid fa-check text-[9px] text-white" />
                  </div>
                  <span className="text-[14px]" style={{ color: 'var(--color-on-surface)' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-shrink-0">
            <PhoneFrame title="Stats">
              <div className="flex justify-center my-2">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#e7e8e9" strokeWidth="14" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#5850EC" strokeWidth="14" strokeDasharray="143 96" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray="57 182" strokeDashoffset="-143" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="14" strokeDasharray="28 211" strokeDashoffset="-200" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="14" strokeDasharray="11 228" strokeDashoffset="-228" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[12px] font-bold" style={{ color: 'var(--color-on-surface)' }}>9h 59m</span>
                    <span className="text-[8px]" style={{ color: 'var(--color-outline)' }}>7 days</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <MockStatBar name="Work" icon="briefcase" color="#5850EC" pct={60} time="6h" />
                <MockStatBar name="Sport" icon="person-running" color="#10B981" pct={24} time="2h 24m" />
                <MockStatBar name="Reading" icon="book-open" color="#F59E0B" pct={12} time="1h 12m" />
                <MockStatBar name="Meditation" icon="person-praying" color="#8B5CF6" pct={4} time="23m" />
              </div>
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="rounded-3xl px-8 py-16" style={{ backgroundColor: 'var(--color-primary)' }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <i className="fa-solid fa-hourglass-half text-[24px] text-white" />
          </div>
          <h2 className="text-[32px] font-bold tracking-[-0.02em] mb-4 text-white">
            Start measuring what matters
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Free, no limits, no complexity. Create your account in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-95 text-center"
              style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-on-secondary)' }}
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-95 text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center" style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
            <i className="fa-solid fa-hourglass-half text-[10px] text-white" />
          </div>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>Relojito</span>
        </div>
        <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Minimalist time tracking</p>
      </footer>
    </div>
  )
}
