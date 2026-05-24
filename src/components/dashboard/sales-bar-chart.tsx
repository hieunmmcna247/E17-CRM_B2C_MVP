'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface SalesPerformanceDatum {
  id: string
  name: string
  assigned: number
  contacted: number
  consulting: number
  trial: number
  enrolled: number
  conversionRate: number
}

interface SalesBarChartProps {
  data: SalesPerformanceDatum[]
}

export function SalesBarChart({ data }: SalesBarChartProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Đang tải dữ liệu hoặc không có dữ liệu...
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

  // Format name to max 8 chars on axis
  const formatXAxisLabel = (value: string) => {
    return value.length > 8 ? `${value.substring(0, 8)}…` : value
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatXAxisLabel}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#161b27',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
            }}
            labelStyle={{
              color: '#e2e8f0',
              fontWeight: 600,
              fontFamily: 'var(--font-dm-sans)',
            }}
            itemStyle={{ color: '#e2e8f0', fontSize: 12 }}
            labelFormatter={(label) => `Sale: ${label}`}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: 15, fontSize: 11, color: '#64748b' }}
          />
          <Bar
            dataKey="assigned"
            name="Lead được giao"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            dataKey="enrolled"
            name="Đã chuyển đổi"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
