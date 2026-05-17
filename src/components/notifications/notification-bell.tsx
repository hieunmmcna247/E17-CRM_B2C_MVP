'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ArrowRight, ClipboardList, Clock, BellRing } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { Notification } from '@/types'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleNotificationClick = (notification: Notification) => {
    markOneRead(notification.id)
    setIsOpen(false)
    
    if (notification.entity_type === 'lead' && notification.entity_id) {
      router.push(`/leads/${notification.entity_id}`)
    } else if (notification.entity_type === 'task') {
      router.push('/tasks')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'stage_changed':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <ArrowRight size={16} />
          </div>
        )
      case 'task_assigned':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
            <ClipboardList size={16} />
          </div>
        )
      case 'task_due_soon':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Clock size={16} />
          </div>
        )
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-500/10 text-slate-500">
            <Bell size={16} />
          </div>
        )
    }
  }

  // Calculate relative time like "3 phut truoc" (simplified)
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)} giay truoc`
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} phut truoc`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} gio truoc`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} ngay truoc`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 transition-colors"
      >
        <Bell size={24} className="text-white" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-[calc(100%+8px)] z-50 flex w-[360px] max-h-[480px] flex-col rounded-xl bg-[#0f1219] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="font-syne font-bold text-white">Thong bao</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
              >
                Danh dau tat ca da doc
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <BellRing size={32} className="mb-3 opacity-20" />
                <p className="text-sm">Chua co thong bao nao</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex cursor-pointer gap-3 p-4 transition-colors hover:bg-white/5 ${
                      !notification.read
                        ? 'bg-blue-500/[0.06] border-l-2 border-l-blue-500'
                        : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {notification.body}
                      </p>
                      <span className="text-xs text-slate-600 mt-1">
                        {getRelativeTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
