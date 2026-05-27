'use client'

import { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SourcePieChart } from '@/components/dashboard/source-pie-chart'
import { StageFunnelChart } from '@/components/dashboard/stage-funnel-chart'
import { ExportStageHistoryButton } from '@/components/dashboard/export-stage-history-button'

export interface AdminDashboardLead {
  id: string
  stage: string
  source: string
  assigned_to: string | null
  created_at: string
}

export interface AdminDashboardStageHistory {
  id: string
  new_stage: string
  changed_by: string | null
  changed_at: string
}

export interface AdminDashboardTask {
  id: string
  status: string
  due_date: string | null
  created_at: string
  assigned_to: string | null
}

export interface AdminDashboardSalesProfile {
  id: string
  full_name: string
}

interface AdminDashboardProps {
  leads: AdminDashboardLead[]
  stageHistory: AdminDashboardStageHistory[]
  tasks: AdminDashboardTask[]
  salesProfiles: AdminDashboardSalesProfile[]
  currentUserId?: string
  pageTitle?: string
  showPerformanceTable?: boolean
  showOverdueCard?: boolean
  showExportButton?: boolean
  readOnlyLabels?: boolean
}

const STAGES = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled', 'Dropped']

const chartTooltip = {
  contentStyle: {
    background: '#161b27',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
  },
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function getRateColor(rate: number) {
  if (rate >= 50) return '#34d399'
  if (rate >= 25) return '#f59e0b'
  return '#f87171'
}

function MetricCard({
  label,
  value,
  subtitle,
  accent,
  showSubtitle = true,
}: {
  label: string
  value: string
  subtitle: string
  accent: string
  showSubtitle?: boolean
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: '#0f1219',
        borderColor: 'rgba(255,255,255,0.06)',
        borderTop: `2px solid ${accent}`,
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
        {value}
      </p>
      {showSubtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  )
}

function ChartCard({
  title,
  readOnlyLabel,
  children,
}: {
  title: string
  readOnlyLabel?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border p-5" style={{ background: '#0f1219', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {readOnlyLabel ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
            {readOnlyLabel}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export function AdminDashboard({
  leads,
  stageHistory,
  tasks,
  salesProfiles,
  pageTitle = 'Dashboard',
  showPerformanceTable = true,
  showOverdueCard = true,
  showExportButton = true,
  readOnlyLabels = false,
}: AdminDashboardProps) {
  const today = new Date()
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const normalizedLeads = leads.map((lead) => ({
    ...lead,
    stage: lead.stage || 'New',
    source: lead.source || 'Other',
  }))

  const newThisMonth = normalizedLeads.filter((lead) => new Date(lead.created_at) >= thisMonthStart).length
  const enrolledCount = normalizedLeads.filter((lead) => lead.stage === 'Enrolled').length
  const droppedCount = normalizedLeads.filter((lead) => lead.stage === 'Dropped').length
  const winRate = enrolledCount + droppedCount > 0 ? (enrolledCount / (enrolledCount + droppedCount)) * 100 : 0
  const overdueTasks = tasks.filter((task) => task.status !== 'done' && task.due_date && new Date(task.due_date) < today).length

  const activeSalesCount = salesProfiles.length

  const salesMetrics = salesProfiles.map((profile) => {
    const repLeads = normalizedLeads.filter((lead) => lead.assigned_to === profile.id)
    const assigned = repLeads.length
    const contacted = repLeads.filter((lead) => lead.stage === 'Contacted').length
    const consulting = repLeads.filter((lead) => lead.stage === 'Consulting').length
    const trial = repLeads.filter((lead) => lead.stage === 'Trial').length
    const enrolled = repLeads.filter((lead) => lead.stage === 'Enrolled').length
    const dropped = repLeads.filter((lead) => lead.stage === 'Dropped').length
    const conversionRate = assigned > 0 ? (enrolled / assigned) * 100 : 0

    return {
      id: profile.id,
      name: profile.full_name,
      assigned,
      contacted,
      consulting,
      trial,
      enrolled,
      dropped,
      conversionRate,
      pendingTasks: tasks.filter((task) => task.status !== 'done' && task.assigned_to === profile.id).length,
    }
  })

  const performanceRows = salesMetrics
  const totalAssigned = salesMetrics.reduce((sum, row) => sum + row.assigned, 0)
  const totalEnrolled = salesMetrics.reduce((sum, row) => sum + row.enrolled, 0)
  const totalDropped = salesMetrics.reduce((sum, row) => sum + row.dropped, 0)
  const totalPendingTasks = salesMetrics.reduce((sum, row) => sum + row.pendingTasks, 0)

  const teamChartData = salesMetrics.map((row) => ({
    name: row.name,
    assigned: row.assigned,
    enrolled: row.enrolled,
  }))

  const conversionChartData = salesMetrics.map((row) => ({
    name: row.name,
    rate: Number(row.conversionRate.toFixed(1)),
    fill: getRateColor(row.conversionRate),
  }))

  const stageChartData = STAGES.map((stage) => ({
    stage,
    count: normalizedLeads.filter((lead) => lead.stage === stage).length,
  }))

  const sourceChartData = Array.from(new Set(normalizedLeads.map((lead) => lead.source))).map((source) => ({
    source,
    count: normalizedLeads.filter((lead) => lead.source === source).length,
  }))

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentYear, currentMonth - (5 - index), 1)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const label = `${month}/${year}`

    const enrolledCountByMonth = stageHistory.filter((item) => {
      if (item.new_stage !== 'Enrolled') return false
      const historyDate = new Date(item.changed_at)
      return historyDate.getFullYear() === year && historyDate.getMonth() === date.getMonth()
    }).length

    return {
      label,
      enrolled: enrolledCountByMonth,
    }
  })

  const readOnlyBadge = readOnlyLabels ? 'Chỉ xem' : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{pageTitle}</p>
          <h1 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
            {pageTitle === 'Xem bao cao tong quan' ? 'Xem bao cao tong quan' : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {readOnlyLabels
              ? 'Chỉ xem tổng quan hiệu suất toàn hệ thống.'
              : 'Theo dõi hiệu suất đội ngũ, pipeline và conversion.'}
          </p>
        </div>
        {showExportButton ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <ExportStageHistoryButton />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Tổng Lead" value={formatNumber(normalizedLeads.length)} subtitle="Toàn hệ thống" accent="#3b82f6" />
        <MetricCard label="Lead mới tháng này" value={formatNumber(newThisMonth)} subtitle="Tính đến hiện tại" accent="#6366f1" />
        <MetricCard label="Win Rate" value={`${winRate.toFixed(1)}%`} subtitle="Enrolled / (Enrolled + Dropped)" accent="#34d399" />
        <MetricCard label="Enrolled" value={formatNumber(enrolledCount)} subtitle="Số lead đã ghi danh" accent="#10b981" />
        {showOverdueCard ? (
          <MetricCard label="Nhiệm vụ quá hạn" value={formatNumber(overdueTasks)} subtitle="Trạng thái chưa hoàn tất" accent="#f43f5e" />
        ) : null}
        <MetricCard label="Số Sales đang hoạt động" value={formatNumber(activeSalesCount)} subtitle="Nhân viên sales hiện hữu" accent="#8b5cf6" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1.2fr]">
        <ChartCard title="Hiệu suất từng Sales" readOnlyLabel={readOnlyBadge}>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamChartData} margin={{ top: 5, right: 12, left: -12, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} formatter={(value: number) => [formatNumber(Number(value)), '']} />
                <Legend wrapperStyle={{ paddingTop: 12, color: '#e2e8f0' }} />
                <Bar dataKey="assigned" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="enrolled" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Tỷ lệ chuyển đổi" readOnlyLabel={readOnlyBadge}>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={conversionChartData} margin={{ top: 5, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Conversion']} />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                  {conversionChartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Pipeline" readOnlyLabel={readOnlyBadge}>
          <StageFunnelChart data={stageChartData} />
        </ChartCard>
        <ChartCard title="Nguồn lead" readOnlyLabel={readOnlyBadge}>
          <SourcePieChart data={sourceChartData} />
        </ChartCard>
      </div>

      {showPerformanceTable ? (
        <div className="rounded-xl border p-5" style={{ background: '#0f1219', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Bảng hiệu suất toàn đội</h2>
              <p className="mt-1 text-sm text-slate-400">Theo dõi pipeline và nhiệm vụ còn lại của từng sales.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-3 py-2">Sales</th>
                  <th className="px-3 py-2 text-right">Lead Giao</th>
                  <th className="px-3 py-2 text-right">Contacted</th>
                  <th className="px-3 py-2 text-right">Consulting</th>
                  <th className="px-3 py-2 text-right">Trial</th>
                  <th className="px-3 py-2 text-right">Enrolled</th>
                  <th className="px-3 py-2 text-right">Conv.Rate</th>
                  <th className="px-3 py-2 text-right">Nhiệm vụ còn</th>
                </tr>
              </thead>
              <tbody>
                {performanceRows.map((row) => {
                  const badgeColor = row.conversionRate >= 50 ? '#34d399' : row.conversionRate >= 25 ? '#f59e0b' : '#f87171'
                  return (
                    <tr key={row.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="px-3 py-3 text-white">{row.name}</td>
                      <td className="px-3 py-3 text-right text-white">{row.assigned}</td>
                      <td className="px-3 py-3 text-right text-white">{row.contacted}</td>
                      <td className="px-3 py-3 text-right text-white">{row.consulting}</td>
                      <td className="px-3 py-3 text-right text-white">{row.trial}</td>
                      <td className="px-3 py-3 text-right text-emerald-300">{row.enrolled}</td>
                      <td className="px-3 py-3 text-right" style={{ color: badgeColor }}>
                        {row.conversionRate.toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-right text-white">{row.pendingTasks}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 text-white">
                  <td className="px-3 py-3 font-semibold">Tổng</td>
                  <td className="px-3 py-3 text-right font-semibold">{totalAssigned}</td>
                  <td className="px-3 py-3 text-right font-semibold">{salesMetrics.reduce((sum, row) => sum + row.contacted, 0)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{salesMetrics.reduce((sum, row) => sum + row.consulting, 0)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{salesMetrics.reduce((sum, row) => sum + row.trial, 0)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-300">{totalEnrolled}</td>
                  <td className="px-3 py-3 text-right font-semibold" style={{ color: totalEnrolled + totalDropped > 0 ? getRateColor((totalEnrolled / (totalEnrolled + totalDropped)) * 100) : '#64748b' }}>
                    {totalEnrolled + totalDropped > 0 ? `${((totalEnrolled / (totalEnrolled + totalDropped)) * 100).toFixed(1)}%` : '0.0%'}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{totalPendingTasks}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
