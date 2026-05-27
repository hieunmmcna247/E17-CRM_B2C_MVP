'use client'

export interface HeatmapSalesRep {
  id: string
  name: string
}

export interface HeatmapLead {
  assigned_to: string | null
  created_at: string
}

interface LeadHeatmapProps {
  salesReps: HeatmapSalesRep[]
  leads: HeatmapLead[]
}

export function LeadHeatmap({ salesReps, leads }: LeadHeatmapProps) {
  if (!salesReps || salesReps.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Không có dữ liệu heatmap nhân viên
      </div>
    )
  }

  // 1. Generate last 6 months from May 2026 (or dynamic today)
  const today = new Date('2026-05-24T08:00:00Z')
  const months: Array<{ label: string; year: number; month: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const y = d.getFullYear()
    months.push({
      label: `${m}/${y}`,
      year: y,
      month: d.getMonth(),
    })
  }

  // 2. Parse lead dates and associate with grid cells
  // Grid structure: row = salesRepIndex, col = monthIndex
  const grid: number[][] = Array(salesReps.length)
    .fill(0)
    .map(() => Array(6).fill(0))

  for (const lead of leads) {
    if (!lead.assigned_to) continue
    const repIdx = salesReps.findIndex((r) => r.id === lead.assigned_to)
    if (repIdx === -1) continue

    const leadDate = new Date(lead.created_at)
    const leadYear = leadDate.getFullYear()
    const leadMonth = leadDate.getMonth()

    const colIdx = months.findIndex(
      (m) => m.year === leadYear && m.month === leadMonth
    )
    if (colIdx !== -1) {
      grid[repIdx][colIdx] += 1
    }
  }

  // Find max value in grid to scale colors
  let maxCount = 0
  for (let r = 0; r < salesReps.length; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r][c] > maxCount) {
        maxCount = grid[r][c]
      }
    }
  }
  if (maxCount === 0) maxCount = 1 // Prevent division by zero

  // SVG parameters
  const cellWidth = 46
  const cellHeight = 32
  const leftPadding = 120 // Space for sales names
  const topPadding = 30 // Space for month headers
  const gap = 4

  const totalWidth = leftPadding + 6 * (cellWidth + gap)
  const totalHeight = topPadding + salesReps.length * (cellHeight + gap) + 10

  return (
    <div className="w-full flex justify-center py-2">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        style={{ background: 'transparent', maxWidth: '460px' }}
      >
        {/* Column Labels (Months) */}
        {months.map((m, colIdx) => {
          const x = leftPadding + colIdx * (cellWidth + gap) + cellWidth / 2
          return (
            <text
              key={m.label}
              x={x}
              y={20}
              textAnchor="middle"
              fill="#64748b"
              fontSize={10}
              fontWeight={600}
              className="font-dm-sans"
            >
              {m.label}
            </text>
          )
        })}

        {/* Rows (Sales Reps + Heatmap Cells) */}
        {salesReps.map((rep, rowIdx) => {
          const y = topPadding + rowIdx * (cellHeight + gap)
          const truncatedName =
            rep.name.length > 15 ? `${rep.name.substring(0, 14)}…` : rep.name

          return (
            <g key={rep.id}>
              {/* Row Label (Sales Person) */}
              <title>{rep.name}</title>
              <text
                x={leftPadding - 10}
                y={y + cellHeight / 2 + 4}
                textAnchor="end"
                fill="#e2e8f0"
                fontSize={11}
                fontWeight={500}
                className="font-dm-sans"
              >
                {truncatedName}
              </text>

              {/* Heatmap Cells */}
              {months.map((m, colIdx) => {
                const x = leftPadding + colIdx * (cellWidth + gap)
                const count = grid[rowIdx][colIdx]

                // Color scaling
                let fill = 'rgba(255, 255, 255, 0.04)' // Empty cell color
                let textColor = '#64748b'

                if (count > 0) {
                  // Scale opacity of blue from 0.15 to 0.85
                  const ratio = count / maxCount
                  const opacity = 0.15 + ratio * 0.7
                  fill = `rgba(59, 130, 246, ${opacity})`
                  textColor = ratio > 0.45 ? '#ffffff' : '#60a5fa'
                }

                return (
                  <g key={`${rowIdx}-${colIdx}`}>
                    <rect
                      x={x}
                      y={y}
                      width={cellWidth}
                      height={cellHeight}
                      rx={5}
                      ry={5}
                      fill={fill}
                      stroke="rgba(255, 255, 255, 0.02)"
                      strokeWidth={1}
                    />
                    {count > 0 && (
                      <text
                        x={x + cellWidth / 2}
                        y={y + cellHeight / 2 + 4}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={11}
                        fontWeight={700}
                        className="font-syne"
                      >
                        {count}
                      </text>
                    )}
                    <title>
                      {rep.name} - {m.label}: {count} leads được giao
                    </title>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
