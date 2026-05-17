'use client'

import { useMemo } from 'react'

type DataPoint = { stage: string; count: number }

export function StageFunnelChart({ data }: { data: DataPoint[] }) {
  const max = useMemo(() => Math.max(...data.map(d => d.count), 1), [data])

  // Lấy màu sắc tương ứng cho từng giai đoạn để DA dễ phân biệt
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'New': return '#3b82f6'
      case 'Contacted': return '#6366f1'
      case 'Consulting': return '#8b5cf6'
      case 'Trial': return '#f59e0b'
      case 'Enrolled': return '#10b981'
      default: return '#64748b'
    }
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      {data.map((item, idx) => {
        const widthPct = (item.count / max) * 100
        const prevCount = idx > 0 ? data[idx - 1].count : null
        const conversion = prevCount ? ((item.count / prevCount) * 100).toFixed(1) : null

        return (
          <div key={item.stage} className="relative">
            {/* Conversion rate badge (tracking bottleneck) */}
            {conversion && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="text-[9px] font-black bg-[#161b27] border border-white/10 px-2 py-0.5 rounded-full text-white/40 uppercase tracking-widest">
                  CVR: {conversion}%
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-wider">{item.stage}</p>
              </div>
              
              <div className="flex-1 h-10 bg-white/[0.02] rounded-lg overflow-hidden border border-white/[0.04] relative">
                <div 
                  className="h-full transition-all duration-1000 ease-out flex items-center justify-end pr-4"
                  style={{ 
                    width: `${widthPct}%`, 
                    background: `linear-gradient(90deg, ${getStageColor(item.stage)}22, ${getStageColor(item.stage)}dd)`,
                    boxShadow: `0 0 20px ${getStageColor(item.stage)}20`
                  }}
                >
                  <span className="text-xs font-black text-white tabular-nums drop-shadow-md">
                    {item.count}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest leading-relaxed">
          💡 DA Insight: Quan sát tỷ lệ CVR giữa các bước để tìm ra điểm "rơi" Lead lớn nhất.
        </p>
      </div>
    </div>
  )
}
