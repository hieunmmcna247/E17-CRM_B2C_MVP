'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, Treemap } from 'recharts'

export interface SourceTreemapDatum {
  name: string
  count: number
}

interface SourceTreemapProps {
  data: SourceTreemapDatum[]
}

export const SOURCE_COLORS: Record<string, string> = {
  'Facebook Ads': '#3b82f6',    // Vibrant Blue
  'Google Ads': '#8b5cf6',      // Purple
  'Zalo': '#ec4899',            // Hot Pink
  'TikTok': '#f97316',          // Orange
  'Website': '#14b8a6',         // Teal
  'Referral': '#eab308',        // Yellow
  'Event': '#6366f1',           // Indigo
  'Other': '#64748b',           // Slate Muted
}

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, count } = props

  if (width < 35 || height < 20) return null

  const fill = SOURCE_COLORS[name] || '#64748b'

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: '#0f1219',
          strokeWidth: 1.5,
          strokeOpacity: 1,
        }}
      />
      {width > 70 && height > 40 ? (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 5}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={12}
            fontWeight={600}
            style={{ pointerEvents: 'none', fontFamily: 'var(--font-dm-sans)' }}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 11}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.75)"
            fontSize={10}
            style={{ pointerEvents: 'none', fontFamily: 'var(--font-dm-sans)' }}
          >
            {count} leads
          </text>
        </>
      ) : (
        <text
          x={x + width / 2}
          y={y + height / 2 + 4}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={10}
          fontWeight={600}
          style={{ pointerEvents: 'none', fontFamily: 'var(--font-dm-sans)' }}
        >
          {name}: {count}
        </text>
      )}
    </g>
  )
}

export function SourceTreemap({ data }: SourceTreemapProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Không có dữ liệu nguồn
      </div>
    )
  }

  if (!isHydrated) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Đang tải biểu đồ...
      </div>
    )
  }

  // Map incoming data to name/value format expected by Recharts Treemap
  // Recharts Treemap needs 'name' and 'value' keys
  const chartData = data
    .map((d) => ({
      name: d.name,
      value: d.count,
      count: d.count,
    }))
    .filter((d) => d.value > 0)

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={chartData}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#0f1219"
          fill="#3b82f6"
          content={<CustomTreemapContent />}
        />
      </ResponsiveContainer>
    </div>
  )
}
