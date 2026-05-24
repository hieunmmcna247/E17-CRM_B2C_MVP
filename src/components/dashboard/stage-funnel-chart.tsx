'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const FUNNEL_ORDER = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled'] as const

export type StageFunnelDatum = { stage: string; count: number }

type BarShapeProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  stageIndex?: number
}

function FunnelBarShape(props: BarShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, fill, stageIndex = 0 } = props
  const idx = stageIndex
  const n = FUNNEL_ORDER.length
  const shrink = 1 - (idx / Math.max(n - 1, 1)) * 0.45
  const band = height
  const thickness = Math.max(band * shrink * 0.72, 10)
  const cy = y + band / 2
  const y1 = cy - thickness / 2

  return <rect x={x} y={y1} width={width} height={thickness} fill={fill} rx={4} ry={4} />
}

export function StageFunnelChart({ data }: { data: StageFunnelDatum[] }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const countByStage = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of data) {
      m.set(row.stage, row.count)
    }
    return m
  }, [data])

  const ordered = useMemo(
    () =>
      FUNNEL_ORDER.map((stage, stageIndex) => ({
        stage,
        count: countByStage.get(stage) ?? 0,
        stageIndex,
      })),
    [countByStage]
  )

  const maxCount = useMemo(() => Math.max(1, ...ordered.map((d) => d.count)), [ordered])

  const dropOffs = useMemo(() => {
    const out: (number | null)[] = []
    for (let i = 0; i < ordered.length - 1; i++) {
      const prev = ordered[i].count
      const next = ordered[i + 1].count
      if (prev <= 0) {
        out.push(null)
      } else {
        out.push(((prev - next) / prev) * 100)
      }
    }
    return out
  }, [ordered])

  if (!isHydrated) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Đang tải biểu đồ...
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {ordered.map((row, idx) => (
        <Fragment key={row.stage}>
          <div className="flex min-h-[52px] items-center gap-2">
            <span className="w-24 shrink-0 text-xs font-medium text-slate-700 sm:w-28">
              {row.stage}
            </span>
            <div className="min-w-0 flex-1">
              <ResponsiveContainer width="100%" height={44}>
                <BarChart
                  layout="vertical"
                  data={[row]}
                  margin={{ top: 4, right: 48, bottom: 4, left: 0 }}
                  barCategoryGap={0}
                >
                  <XAxis type="number" domain={[0, maxCount]} hide />
                  <YAxis type="category" dataKey="stage" width={0} hide />
                  <Tooltip
                    formatter={(v) => [Number(v ?? 0), 'Leads']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    shape={(props) => <FunnelBarShape {...props} stageIndex={row.stageIndex} />}
                  >
                    <LabelList
                      dataKey="count"
                      position="right"
                      style={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {idx < ordered.length - 1 && (
            <div className="flex min-h-[28px] items-center justify-center py-0.5 text-xs font-medium text-amber-700">
              {dropOffs[idx] != null
                ? `↓ ${dropOffs[idx]!.toFixed(0)}%`
                : '↓ —'}
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}
