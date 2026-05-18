import { unstable_noStore as noStore } from 'next/cache'
import { ExportDataButton } from '@/components/dashboard/export-stage-history-button'
import { SourcePieChart } from '@/components/dashboard/source-pie-chart'
import { StageFunnelChart } from '@/components/dashboard/stage-funnel-chart'
import { createClient } from '@/lib/supabase/server'
import { applyLeadFilter } from '@/lib/data-filters'
import { SOURCES, UserProfile } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FUNNEL_STAGES = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled'] as const
const PAGE_SIZE = 1000

type LeadAggRow = { source: string; stage: string }

export default async function DashboardPage() {
  noStore()

  const supabase = await createClient()

  // ── Lấy profile người dùng hiện tại ────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user?.id)
    .single()
  const profile = profileData as UserProfile | null

  // ── Fetch leads có áp dụng phân quyền ─────────────────────────────────────
  const rows: LeadAggRow[] = []
  let from = 0
  let error: { message: string } | null = null

  while (true) {
    const baseQuery = supabase
      .from('leads')
      .select('source, stage')
      .range(from, from + PAGE_SIZE - 1)

    // Áp dụng filter theo role (Sales chỉ thấy leads của mình)
    const filteredQuery = applyLeadFilter(baseQuery, profile)

    const { data, error: qError } = await filteredQuery
    if (qError) { error = qError; break }
    const batch = (data as LeadAggRow[] | null) ?? []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error.message}
          </div>
        </div>
      </div>
    )
  }

  // ── Tính toán số liệu ───────────────────────────────────────────────────────
  const totalLeads = rows.length
  let enrolled = 0
  let dropped = 0
  const sourceCount = new Map<string, number>()
  const stageCount = new Map<string, number>()

  for (const row of rows) {
    if (row.stage === 'Enrolled') enrolled += 1
    if (row.stage === 'Dropped') dropped += 1
    sourceCount.set(row.source, (sourceCount.get(row.source) ?? 0) + 1)
    stageCount.set(row.stage, (stageCount.get(row.stage) ?? 0) + 1)
  }

  const outcomeDenom = enrolled + dropped
  const winRate = outcomeDenom === 0 ? 0 : (enrolled / outcomeDenom) * 100

  const sourceChartData = SOURCES.map((source) => ({
    source,
    count: sourceCount.get(source) ?? 0,
  })).filter((d) => d.count > 0)

  const stageChartData = FUNNEL_STAGES.map((stage) => ({
    stage,
    count: stageCount.get(stage) ?? 0,
  }))

  // ── Tiêu đề thay đổi theo role ─────────────────────────────────────────────
  const isSales = profile?.role === 'sales'
  const subtitle = isSales
    ? `Số liệu cá nhân của bạn · ${profile?.assigned_courses?.join(', ') || 'Chưa có khóa học nào'}`
    : 'Tổng quan toàn bộ leads theo nguồn và giai đoạn pipeline.'

  return (
    <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.02em' }}
            >
              {isSales ? 'Dashboard – Kết quả của tôi' : 'Dashboard – Báo cáo Tuyển sinh'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
              {subtitle}
            </p>
            {/* Badge role */}
            {isSales && (
              <span
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 inline-block" />
                Chế độ Sales – Chỉ hiển thị leads của bạn
              </span>
            )}
          </div>
          {/* Chỉ admin mới export toàn bộ data */}
          {!isSales && <ExportDataButton />}
        </header>

        {/* Metric Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={isSales ? 'Leads của tôi' : 'Tổng Leads'}
            value={totalLeads}
            icon="leads"
            accent="#3b82f6"
            progress={100}
          />
          <MetricCard
            label="Win Rate"
            value={winRate}
            isPercent
            hint="Enrolled / (Enrolled + Dropped)"
            icon="winrate"
            accent="#6366f1"
            trend={{ value: winRate.toFixed(1) + '%', up: winRate > 50 }}
            progress={winRate}
          />
          <MetricCard
            label="Enrolled"
            value={enrolled}
            icon="enrolled"
            accent="#22c55e"
            trend={{ value: String(enrolled), up: true }}
            progress={totalLeads > 0 ? (enrolled / totalLeads) * 100 : 0}
          />
          <MetricCard
            label="Dropped"
            value={dropped}
            icon="dropped"
            accent="#ef4444"
            progress={totalLeads > 0 ? (dropped / totalLeads) * 100 : 0}
          />
        </section>

        {/* Empty state cho Sales chưa có leads */}
        {isSales && totalLeads === 0 && (
          <div
            className="rounded-xl p-12 flex flex-col items-center text-center gap-4"
            style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">Chưa có leads nào được phân công</p>
              <p className="text-xs text-slate-500">
                Admin cần gán khóa học cho bạn hoặc assign leads trực tiếp trong Settings.
              </p>
            </div>
          </div>
        )}

        {/* Charts – chỉ hiển thị khi có data */}
        {totalLeads > 0 && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-xl p-5"
              style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="mb-4 text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
                Lead theo Nguồn (Source)
              </h2>
              <SourcePieChart data={sourceChartData} />
            </div>
            <div
              className="rounded-xl p-5"
              style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="mb-4 text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
                Funnel theo Stage
              </h2>
              <StageFunnelChart data={stageChartData} />
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

// ── SVG Icon set ──────────────────────────────────────────────────────────────
function MetricIcon({ type, color }: { type: string; color: string }) {
  const s = { width: 18, height: 18, stroke: color, fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'leads') return (
    <svg {...s} viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
  if (type === 'winrate') return (
    <svg {...s} viewBox="0 0 24 24">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
  if (type === 'enrolled') return (
    <svg {...s} viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
  if (type === 'dropped') return (
    <svg {...s} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
  return <span style={{ fontSize: 16, color }}>{type}</span>
}

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n))
}

function MetricCard({
  label, value, isPercent, hint, accent, icon, trend, progress
}: {
  label: string
  value: number
  isPercent?: boolean
  hint?: string
  accent?: string
  icon: string
  trend?: { value: string; up: boolean }
  progress?: number
}) {
  const displayValue = isPercent ? `${value.toFixed(1)}%` : fmt(value)
  const clr = accent ?? '#334155'
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${clr}` }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: `linear-gradient(180deg, ${clr}08 0%, transparent 100%)`, pointerEvents: 'none' }} />

      <div className="flex items-start justify-between relative">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
          {label}
        </p>
        <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${clr}18`, border: `1px solid ${clr}28` }}>
          <MetricIcon type={icon} color={clr} />
        </div>
      </div>

      <div className="relative">
        <p className="text-3xl font-bold tabular-nums text-white" style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.02em' }}>
          {displayValue}
        </p>
        {trend && (
          <div className="flex items-center gap-1 mt-1.5">
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: trend.up ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: trend.up ? '#4ade80' : '#f87171' }}
            >
              {trend.up ? '↑' : '↓'} {trend.value}
            </span>
          </div>
        )}
        {hint && <p className="mt-1 text-xs" style={{ color: '#334155' }}>{hint}</p>}
      </div>

      {progress !== undefined && (
        <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${clr}, ${clr}99)` }}
          />
        </div>
      )}
    </div>
  )
}
