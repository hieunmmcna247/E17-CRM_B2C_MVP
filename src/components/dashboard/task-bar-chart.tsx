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

export interface TaskStatsData {
  todo: number
  in_progress: number
  done: number
  overdue: number
}

interface TaskBarChartProps {
  data: TaskStatsData
}

export function TaskBarChart({ data }: TaskBarChartProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!data) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Không có dữ liệu nhiệm vụ
      </div>
    )
  }

  if (!isHydrated) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Đang tải biểu đồ...
      </div>
    )
  }

  const chartData = [
    { name: 'Cần làm', count: data.todo, fill: '#64748b' },
    { name: 'Đang làm', count: data.in_progress, fill: '#3b82f6' },
    { name: 'Hoàn thành', count: data.done, fill: '#22c55e' },
    { name: 'Quá hạn', count: data.overdue, fill: '#ef4444' },
  ]

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 35, left: -10, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
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
