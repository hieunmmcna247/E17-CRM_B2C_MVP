'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeSubscriber({ leadId }: { leadId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    // Đăng ký nhận thông báo realtime khi Lead này bị thay đổi trạng thái hoặc thông tin
    const leadsChannel = supabase
      .channel(`leads_updates_${leadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `id=eq.${leadId}` },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Đăng ký nhận thông báo realtime khi có thêm record lịch sử cho Lead này
    const historyChannel = supabase
      .channel(`history_updates_${leadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stage_history', filter: `lead_id=eq.${leadId}` },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(leadsChannel)
      supabase.removeChannel(historyChannel)
    }
  }, [leadId, router])

  return null // Client component này chạy ngầm, không hiển thị gì cả
}
