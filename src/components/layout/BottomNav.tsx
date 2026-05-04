'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Timers', icon: 'fa-solid fa-grid-2', route: '/dashboard' },
  { label: 'History', icon: 'fa-solid fa-clock-rotate-left', route: '/history' },
  { label: 'Stats', icon: 'fa-solid fa-chart-simple', route: '/stats' },
  { label: 'Settings', icon: 'fa-solid fa-gear', route: '/settings' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex xl:hidden fixed bottom-0 left-0 right-0 z-40 h-14"
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        borderTop: '1px solid var(--color-outline-variant)',
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.route
        return (
          <Link
            key={item.route}
            href={item.route}
            className="flex flex-col items-center justify-center flex-1 gap-[2px]"
            style={{
              color: isActive
                ? 'var(--color-secondary)'
                : 'var(--color-on-surface-variant)',
            }}
          >
            <i className={`${item.icon} text-[18px]`} aria-hidden="true" />
            <span className="text-[10px] font-medium tracking-[0.02em]">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
