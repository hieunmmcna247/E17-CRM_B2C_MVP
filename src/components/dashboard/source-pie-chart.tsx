'use client'

import {
  Cell,
  Label,
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

// Custom Tooltip – dùng any để tránh conflict với recharts internal types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  const rawPayload = item.payload ?? {}
  const total: number = rawPayload.total ?? 1
  const fill: string = rawPayload.fill ?? '#3b82f6'
  const count: number = item.value ?? 0
  const percent = ((count / total) * 100).toFixed(1)
  return (
    <div style={{
      background: '#0f1219',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      fontSize: '13px',
      color: '#e2e8f0',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: fill, fontWeight: 600 }}>●</span>{' '}
      Nguồn: <strong>{item.name}</strong> – {count} leads ({percent}%)
    </div>
  )
}

// Custom Legend bên phải
function CustomLegend({
  data,
  total,
}: {
  data: Array<{ source: string; count: number; fill: string }>
  total: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center', minWidth: '160px', padding: '8px 0' }}>
      {data.map((d) => (
        <div key={d.source} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.fill, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: '12px', color: '#94a3b8', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {d.source}
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>
            {d.count}
          </span>
          <span style={{ fontSize: '11px', color: '#475569', flexShrink: 0, minWidth: '38px', textAlign: 'right' }}>
            {((d.count / total) * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export function SourcePieChart({ data }: { data: SourcePieDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  const chartData = data.map((d, i) => ({
    ...d,
    fill: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    total, // passed through for tooltip
  }))

  if (chartData.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)', color: '#475569', fontSize: '13px' }}>
        Không có dữ liệu nguồn
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* Donut chart */}
      <div style={{ flex: '0 0 220px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="source"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.source}`} fill={entry.fill} />
              ))}
              {/* Total label in center */}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null
                  const { cx, cy } = viewBox as { cx: number; cy: number }
                  return (
                    <g>
                      <text
                        x={cx}
                        y={(cy ?? 0) - 8}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize={22}
                        fontWeight={700}
                        fontFamily="inherit"
                      >
                        {total.toLocaleString('vi-VN')}
                      </text>
                      <text
                        x={cx}
                        y={(cy ?? 0) + 12}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize={11}
                        fontWeight={500}
                      >
                        leads
                      </text>
                    </g>
                  )
                }}
                position="center"
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend bên phải */}
      <CustomLegend data={chartData} total={total} />
    </div>
  )
}
