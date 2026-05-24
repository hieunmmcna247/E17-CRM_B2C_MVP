'use client'

import { MessageSquare, Clock } from 'lucide-react'

export interface RecentActivityItem {
  id: string
  lead_id: string
  lead_name: string
  note: string
  created_by_name: string
  created_at: string
}

interface RecentActivitiesProps {
  data: RecentActivityItem[]
}

function formatRelativeTime(dateString: string) {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date
  
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'vừa xong'
  
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} phút trước`
  
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} giờ trước`
  
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hôm qua'
  if (days < 7) return `${days} ngày trước`
  
  // Return standard dd/MM
  const d = new Date(dateString)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function RecentActivities({ data }: RecentActivitiesProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Chưa có hoạt động nào gần đây
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[320px] justify-between">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-indigo-400" />
        <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Hoạt động mới nhất</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {data.map((activity) => (
          <div key={activity.id} className="relative pl-5 pb-1 border-l border-white/[0.04] last:border-0 last:pb-0">
            {/* Timeline Dot Indicator */}
            <div className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-[#0f1219]" />
            
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1 font-medium">
                  <span className="text-slate-300 font-bold hover:underline cursor-default">
                    {activity.created_by_name}
                  </span>
                  <span>tương tác với</span>
                  <span className="text-indigo-400 font-bold hover:underline cursor-default">
                    {activity.lead_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-normal">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{formatRelativeTime(activity.created_at)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-1 italic leading-relaxed bg-white/[0.01] border border-white/[0.02] p-2 rounded-lg">
                "{activity.note}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
