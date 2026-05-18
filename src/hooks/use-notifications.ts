import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types'
import { useAuth } from '@/hooks/use-auth'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabaseRef = useRef(createClient())
  const subscribedRef = useRef(false)

  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    // Neu da subscribe roi thi bo qua (tranh StrictMode chay 2 lan)
    if (subscribedRef.current) return
    subscribedRef.current = true

    const supabase = supabaseRef.current

    // Fetch du lieu ban dau
    const fetchNotifications = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n) => !n.read).length)
      }
      setLoading(false)
    }

    void fetchNotifications()

    // Polling don gian thay cho Realtime de tranh loi subscribe
    const interval = setInterval(() => {
      void fetchNotifications()
    }, 10000) // refresh moi 30 giay

    return () => {
      clearInterval(interval)
      subscribedRef.current = false
    }
  }, [user?.id])

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  const markAllRead = async () => {
    if (!user?.id) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    await supabaseRef.current
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  const markOneRead = async (id: string) => {
    if (!user?.id) return
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await supabaseRef.current
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
  }

  return { notifications, unreadCount, markAllRead, markOneRead, loading }
}