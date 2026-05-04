'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'

const navItems = [
  { label: 'Timers', icon: 'fa-solid fa-grid-2', route: '/dashboard' },
  { label: 'History', icon: 'fa-solid fa-clock-rotate-left', route: '/history' },
  { label: 'Stats', icon: 'fa-solid fa-chart-simple', route: '/stats' },
  { label: 'Settings', icon: 'fa-solid fa-gear', route: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden xl:flex flex-col fixed left-0 top-0 h-full w-60 z-40"
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        borderRight: '1px solid var(--color-outline-variant)',
      }}
    >
      {/* Logo / App name */}
      <div className="px-lg py-lg">
        <span
          className="text-[20px] font-semibold tracking-[-0.01em]"
          style={{ color: 'var(--color-on-surface)' }}
        >
          Relojito
        </span>
      </div>

      {/* Navigation items */}
      <nav className="flex flex-col gap-xs px-sm flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.route
          return (
            <Link
              key={item.route}
              href={item.route}
              className="flex items-center gap-md px-md py-sm rounded-lg transition-colors"
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--color-primary-container)',
                      color: 'var(--color-on-primary-container)',
                    }
                  : {
                      color: 'var(--color-on-surface-variant)',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    'var(--color-surface-container-high)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    'transparent'
                }
              }}
            >
              <i className={`${item.icon} w-5 text-center`} aria-hidden="true" />
              <span className="text-[14px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout button */}
      <div className="px-sm pb-lg">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-md px-md py-sm rounded-lg w-full transition-colors text-left"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-surface-container-high)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'transparent'
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center" aria-hidden="true" />
            <span className="text-[14px] font-medium">Log out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
