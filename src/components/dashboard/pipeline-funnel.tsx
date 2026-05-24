'use client'

interface FunnelStage {
  stage: string
  count: number
}

interface PipelineFunnelProps {
  data: FunnelStage[]
  droppedCount: number
}

const STAGE_COLORS: Record<string, string> = {
  New: '#475569',
  Contacted: '#3b82f6',
  Consulting: '#eab308',
  Trial: '#818cf8',
  Enrolled: '#22c55e',
}

const STAGE_LABELS: Record<string, string> = {
  New: 'Mới (New)',
  Contacted: 'Đã liên hệ (Contacted)',
  Consulting: 'Tư vấn (Consulting)',
  Trial: 'Học thử (Trial)',
  Enrolled: 'Đã đăng ký (Enrolled)',
}

export function PipelineFunnel({ data, droppedCount }: PipelineFunnelProps) {
  // Sort stages in the predefined pipeline order
  const order = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled']
  const sortedStages = order
    .map((stageName) => {
      const match = data.find((d) => d.stage === stageName)
      return {
        stage: stageName,
        count: match ? match.count : 0,
      }
    })

  const totalLeads = sortedStages[0]?.count || 0
  const maxCount = Math.max(...sortedStages.map((s) => s.count), 1)

  return (
    <div className="flex flex-col h-[320px] justify-between">
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {sortedStages.map((item, index) => {
          const color = STAGE_COLORS[item.stage] || '#64748b'
          const label = STAGE_LABELS[item.stage] || item.stage
          
          // Width based on max stage count, clamped to min 20% for readability
          const widthPercent = maxCount > 0 ? Math.max((item.count / maxCount) * 100, 20) : 20
          
          // Percentage of total leads entering funnel
          const pctOfTotal = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0

          // Calculate drop-off to next stage
          let dropOffText = ''
          if (index < sortedStages.length - 1) {
            const nextItem = sortedStages[index + 1]
            const diff = item.count - nextItem.count
            const dropOffPct = item.count > 0 ? (diff / item.count) * 100 : 0
            dropOffText = `▼ mất ${dropOffPct.toFixed(0)}%`
          }

          return (
            <div key={item.stage} className="flex flex-col items-center w-full">
              {/* Funnel Step Bar */}
              <div
                className="rounded-lg p-2.5 flex items-center justify-between text-xs transition-all duration-300 border border-white/[0.02]"
                style={{
                  width: `${widthPercent}%`,
                  background: `linear-gradient(90deg, ${color}20 0%, ${color}10 100%)`,
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="truncate font-semibold text-white max-w-[130px]">
                  {label}
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-bold text-white font-syne">{item.count}</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    ({pctOfTotal.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Drop-off text centered below the bar */}
              {dropOffText && (
                <div className="py-0.5 text-[9px] text-red-400/80 font-bold uppercase tracking-wider">
                  {dropOffText}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium">Tổng thất bại (Dropped):</span>
        <span className="font-bold text-red-400 font-syne text-[13px]">{droppedCount} leads</span>
      </div>
    </div>
  )
}
