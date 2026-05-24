'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

interface PipelineBarProps {
  data: Array<{ stage: string; count: number }>
}

const STAGE_COLORS: Record<string, string> = {
  New: '#94a3b8',        // Slate
  Contacted: '#3b82f6',  // Blue
  Consulting: '#fbbf24', // Amber/Yellow
  Trial: '#818cf8',      // Indigo
  Enrolled: '#22c55e',   // Green
  Dropped: '#ef4444',    // Red
}

export function PipelineBar({ data }: PipelineBarProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Đang tải dữ liệu...
      </div>
    )
  }

  if (!isHydrated) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Đang tải biểu đồ...
      </div>
    )
  }

  // Pre-defined sorting of stages for standard pipeline view
  const stageOrder = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled', 'Dropped']
  const chartData = stageOrder
    .map((stage) => {
      const match = data.find((d) => d.stage === stage)
      return {
        stage,
        count: match ? match.count : 0,
      }
    })
    .reverse() // Reverse so the top starts with 'New'

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 15, right: 35, left: -10, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="stage"
            type="category"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.stage}`}
                fill={STAGE_COLORS[entry.stage] || '#64748b'}
              />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              fill="#e2e8f0"
              fontSize={11}
              fontWeight={600}
              offset={8}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
