'use client'

import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface SalesLineChartProps {
  data: Array<{
    month: string
    [salesName: string]: string | number
  }>
  salesNames: string[]
}

const LINE_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#818cf8', // Indigo
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#a855f7', // Purple
]

export function SalesLineChart({ data, salesNames }: SalesLineChartProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!data || data.length === 0 || !salesNames || salesNames.length === 0) {
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

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
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
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: 15, fontSize: 11, color: '#64748b' }}
          />
          {salesNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              name={name}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
