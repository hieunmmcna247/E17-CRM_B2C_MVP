'use client'

import { Award } from 'lucide-react'

export interface LeaderboardRep {
  id: string
  name: string
  enrolled: number
  conversionRate: number
}

interface TopSalesLeaderboardProps {
  data: LeaderboardRep[]
}

export function TopSalesLeaderboard({ data }: TopSalesLeaderboardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Không có dữ liệu xếp hạng
      </div>
    )
  }

  // Sort by enrolled count descending
  const sortedReps = [...data].sort((a, b) => b.enrolled - a.enrolled)

  const getRankBadgeStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
          text: '🥇',
        }
      case 1:
        return {
          bg: 'bg-slate-300/10 border-slate-300/30 text-slate-300',
          text: '🥈',
        }
      case 2:
        return {
          bg: 'bg-amber-600/10 border-amber-600/30 text-amber-600',
          text: '🥉',
        }
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-400',
          text: String(index + 1),
        }
    }
  }

  return (
    <div className="flex flex-col h-[320px] justify-between">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-4 w-4 text-yellow-500" />
        <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Bảng xếp hạng tuyển sinh</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {sortedReps.map((rep, index) => {
          const badge = getRankBadgeStyle(index)
          return (
            <div
              key={rep.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-semibold ${badge.bg}`}
                >
                  {badge.text}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white truncate max-w-[110px]">
                    {rep.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    CR: {rep.conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-emerald-400 font-syne">
                  {rep.enrolled}
                </p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Enrolled
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
