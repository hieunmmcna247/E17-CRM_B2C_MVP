'use client'
import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AppShellNav } from '@/components/app-shell-nav'
import { TopBar } from '@/components/layout/top-bar'

export function LayoutChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLanding = pathname === '/'
  const isLogin = pathname === '/login'

  if (isLanding || isLogin) {
    return <>{children}</>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', color: '#e2e8f0' }}>
      <AppShellNav />
      <div className="md:ml-[220px]">
        <TopBar />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  )
}