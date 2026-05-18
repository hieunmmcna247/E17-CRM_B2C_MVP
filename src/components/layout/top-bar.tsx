'use client'

import { NotificationBell } from '@/components/notifications/notification-bell'

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-white/[0.06] bg-[#0a0c10]/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-slate-400">Hệ thống CRM</h2>
        <span className="text-slate-700">/</span>
        <span className="text-sm font-semibold text-white">E17 Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Mock */}
        <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-64 group focus-within:border-blue-500/50 transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="Tìm kiếm nhanh..." 
            className="bg-transparent border-none outline-none text-xs text-white px-2 w-full placeholder:text-slate-600"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}

