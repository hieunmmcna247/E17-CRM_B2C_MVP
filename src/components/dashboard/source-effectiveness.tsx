'use client'

import { SOURCE_COLORS } from './source-treemap'
import { Award } from 'lucide-react'

export interface SourceEffectivenessDatum {
  source: string
  totalLeads: number
  enrolledCount: number
  conversionRate: number
}

interface SourceEffectivenessProps {
  data: SourceEffectivenessDatum[]
}

export function SourceEffectiveness({ data }: SourceEffectivenessProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Không có dữ liệu hiệu quả nguồn
      </div>
    )
  }

  // Sort by conversion rate descending, then total leads descending
  const sortedData = [...data].sort((a, b) => {
    if (b.conversionRate !== a.conversionRate) {
      return b.conversionRate - a.conversionRate
    }
    return b.totalLeads - a.totalLeads
  })

  return (
    <div className="flex flex-col h-[280px] justify-between">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-4 w-4 text-emerald-400" />
        <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Tỷ lệ chuyển đổi theo nguồn</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {sortedData.map((item) => {
          const fill = SOURCE_COLORS[item.source] || '#64748b'
          
          return (
            <div key={item.source} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white font-medium">{item.source}</span>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[11px] text-slate-500 font-normal">
                    {item.enrolledCount} / {item.totalLeads} leads
                  </span>
                  <span className="text-emerald-400 font-bold font-syne text-[13px]">
                    {item.conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.02]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.conversionRate}%`,
                    backgroundColor: fill,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
