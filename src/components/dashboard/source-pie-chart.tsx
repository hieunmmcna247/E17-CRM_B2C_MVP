'use client'

import { useEffect, useState } from 'react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const DEFAULT_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#eab308',
  '#6366f1',
  '#64748b',
  '#0ea5e9',
  '#a855f7',
]

export type SourcePieDatum = { source: string; count: number }

export function SourcePieChart({ data }: { data: SourcePieDatum[] }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const chartData = data.map((d, i) => ({
    ...d,
    fill: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Không có dữ liệu nguồn
      </div>
    )
  }

  if (!isHydrated) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Đang tải biểu đồ...
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Tooltip
          formatter={(value) => [Number(value ?? 0), 'Leads']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="source"
          cx="50%"
          cy="45%"
          innerRadius={52}
          outerRadius={88}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.source}`} fill={entry.fill} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          align="center"
          layout="horizontal"
          wrapperStyle={{ paddingTop: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
