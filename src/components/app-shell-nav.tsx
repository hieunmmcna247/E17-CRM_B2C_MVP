'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { RoleBadge } from './auth/role-badge'
import { PermissionGate } from './auth/permission-gate'
import { NotificationBell } from './notifications/notification-bell'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  permission?: 'invoice:view'
}

function IconLeads() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconPipeline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="18" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="11" width="4" height="10" rx="1" />
    </svg>
  )
}

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconInvoices() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconTasks() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Leads', href: '/leads', icon: <IconLeads /> },
  { label: 'Pipeline', href: '/pipeline', icon: <IconPipeline /> },
  { label: 'Nhiem vu', href: '/tasks', icon: <IconTasks /> },
  { label: 'Dashboard', href: '/dashboard', icon: <IconDashboard /> },
  { label: 'Hóa đơn', href: '/invoices', icon: <IconInvoices />, permission: 'invoice:view' },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShellNav() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 hidden h-screen w-[220px] md:flex md:flex-col"
        style={{
          background: 'linear-gradient(180deg, #0d1117 0%, #0a0c10 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center px-4 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight" style={{ letterSpacing: '-0.01em' }}>
                E17 CRM
              </span>
              <span className="text-[10px] font-medium" style={{ color: '#475569', letterSpacing: '0.05em' }}>
                MCNA · MVP
              </span>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#334155' }}>
            Menu
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2 pb-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            const navContent = (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
                style={{
                  color: active ? '#e2e8f0' : '#475569',
                  background: active
                    ? 'linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.08) 100%)'
                    : 'transparent',
                  borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
                }}
              >
                <span style={{ color: active ? '#60a5fa' : 'inherit' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )

            if (item.permission) {
              return (
                <PermissionGate key={item.href} action={item.permission}>
                  {navContent}
                </PermissionGate>
              )
            }

            return navContent
          })}

          <PermissionGate action="settings:view">
            <Link
              href="/settings"
              className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                color: isActive(pathname, '/settings') ? '#e2e8f0' : '#475569',
                background: isActive(pathname, '/settings') ? 'rgba(59,130,246,0.15)' : 'transparent',
                borderLeft: isActive(pathname, '/settings') ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <span style={{ color: isActive(pathname, '/settings') ? '#60a5fa' : 'inherit' }}>
                <IconSettings />
              </span>
              <span>Cai dat</span>
            </Link>
          </PermissionGate>
        </nav>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '0 16px' }} />

        {/* User info footer */}
        <div className="px-2 py-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-xs font-bold text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate">
                {profile?.full_name || 'Guest'}
              </span>
              <div className="mt-0.5">
                <RoleBadge role={profile?.role || 'viewer'} />
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Dang xuat
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          background: 'rgba(13,17,23,0.96)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Mobile top bar with bell */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <span className="text-xs font-bold text-white">E17 CRM</span>
          <NotificationBell />
        </div>

        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            const navContent = (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition-colors"
                style={{ color: active ? '#60a5fa' : '#475569' }}
              >
                <span>{item.icon}</span>
                <span style={{ fontSize: '10px' }}>{item.label}</span>
              </Link>
            )

            if (item.permission) {
              return (
                <PermissionGate key={item.href} action={item.permission}>
                  {navContent}
                </PermissionGate>
              )
            }

            return navContent
          })}
        </div>
      </nav>
    </>
  )
}