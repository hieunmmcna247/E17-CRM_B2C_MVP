'use client'

import { useRouter } from 'next/navigation'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SourcePieChart } from '@/components/dashboard/source-pie-chart'

export interface SalesDashboardLead {
  id: string
  name?: string | null
  stage: string
  source: string
  assigned_to: string | null
  created_at: string
}

export interface SalesDashboardStageHistory {
  id: string
  new_stage: string
  changed_by: string | null
  changed_at: string
}

export interface SalesDashboardTask {
  id: string
  title: string
  lead_id: string
  assigned_to: string | null
  due_date: string | null
  status: string
  priority: string
}

interface SalesDashboardProps {
  leads: SalesDashboardLead[]
  stageHistory: SalesDashboardStageHistory[]
  tasks: SalesDashboardTask[]
  currentUserId: string
}

function getLeadName(leadId: string) {
  return leadId || 'Chưa rõ'
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

function MetricCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string
  value: string
  subtitle: string
  accent: string
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
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  )
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500/15 text-red-200'
    case 'high':
      return 'bg-amber-500/15 text-amber-100'
    case 'medium':
      return 'bg-sky-500/15 text-sky-100'
    default:
      return 'bg-emerald-500/15 text-emerald-100'
  }
}

function getDueTone(taskDueDate: string | null, today: Date) {
  if (!taskDueDate) return 'text-slate-300'
  const due = new Date(taskDueDate)
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (due < today) return 'text-red-300'
  if (diff <= 2) return 'text-amber-300'
  return 'text-slate-300'
}

export function SalesDashboard({ leads, stageHistory, tasks, currentUserId }: SalesDashboardProps) {
  const router = useRouter()
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const myLeads = leads.filter((lead) => lead.assigned_to === currentUserId)
  const myTasks = tasks.filter((task) => task.assigned_to === currentUserId && task.status !== 'done')
  const myEnrolled = myLeads.filter((lead) => lead.stage === 'Enrolled')
  const myDropped = myLeads.filter((lead) => lead.stage === 'Dropped')
  const myOpenTasks = myTasks.filter((task) => task.status === 'todo' || task.status === 'in_progress')

  const myLeadThisMonth = myLeads.filter((lead) => new Date(lead.created_at) >= monthStart).length
  const winRate = myEnrolled.length + myDropped.length > 0 ? (myEnrolled.length / (myEnrolled.length + myDropped.length)) * 100 : 0
  const enrolledThisMonth = stageHistory.filter((item) => {
    if (item.new_stage !== 'Enrolled' || item.changed_by !== currentUserId) return false
    const changedAt = new Date(item.changed_at)
    return changedAt >= monthStart
  }).length

  const stageCounts = STAGES.reduce<Record<string, number>>((acc, stage) => {
    acc[stage] = myLeads.filter((lead) => lead.stage === stage).length
    return acc
  }, {})

  const pipelineTotal = myLeads.length
  const enrolledRatio = pipelineTotal > 0 ? (myEnrolled.length / pipelineTotal) * 100 : 0

  const monthlyEnrollment = Array.from({ length: 6 }, (_, idx) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - idx), 1)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const label = `${month}/${year}`

    const value = stageHistory.filter((item) => {
      if (item.new_stage !== 'Enrolled' || item.changed_by !== currentUserId) return false
      const changedAt = new Date(item.changed_at)
      return changedAt.getFullYear() === year && changedAt.getMonth() === date.getMonth()
    }).length

    return { label, enrolled: value }
  })

  const sourceBreakdown = Array.from(new Set(myLeads.map((lead) => lead.source))).map((source) => ({
    source,
    count: myLeads.filter((lead) => lead.source === source).length,
  }))

  const upcomingTasks = [...myTasks]
    .sort((a, b) => new Date(a.due_date ?? '9999-12-31').getTime() - new Date(b.due_date ?? '9999-12-31').getTime())
    .slice(0, 8)

  const bestSource = sourceBreakdown.reduce<{ source: string; count: number; conversionRate: number } | null>((best, current) => {
    const conversionRate = myLeads.length > 0 ? (myLeads.filter((lead) => lead.source === current.source && lead.stage === 'Enrolled').length / myLeads.filter((lead) => lead.source === current.source).length) * 100 : 0
    const candidate = { ...current, conversionRate }
    if (!best || candidate.conversionRate > best.conversionRate) {
      return candidate
    }
    return best
  }, null)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Sales Dashboard</p>
        <h1 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
          Dashboard của tôi
        </h1>
        <p className="mt-1 text-sm text-slate-400">Theo dõi hiệu suất cá nhân, pipeline và nhiệm vụ sắp tới.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Lead của tôi" value={formatNumber(myLeads.length)} subtitle="Tổng số lead được giao" accent="#3b82f6" />
        <MetricCard label="Lead mới tháng này" value={formatNumber(myLeadThisMonth)} subtitle="Lead mới trong tháng" accent="#6366f1" />
        <MetricCard label="Win Rate cá nhân" value={`${winRate.toFixed(1)}%`} subtitle="Enrolled / (Enrolled + Dropped)" accent="#34d399" />
        <MetricCard label="Enrolled tháng này" value={formatNumber(enrolledThisMonth)} subtitle="Lead đã chuyển sang Enrolled" accent="#10b981" />
        <MetricCard label="Nhiệm vụ cần làm" value={formatNumber(myOpenTasks.length)} subtitle="Todo + In progress" accent="#f59e0b" />
      </div>

      <div className="rounded-xl border p-5" style={{ background: '#0f1219', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Pipeline cá nhân của tôi</h2>
            <p className="mt-1 text-sm text-slate-400">Theo dõi tiến trình từ New đến Enrolled.</p>
          </div>
          <div className="text-sm text-slate-300">
            <span className="font-semibold text-white">{myEnrolled.length}</span> lead đã enrolled • <span className="font-semibold text-white">{enrolledRatio.toFixed(1)}%</span> hoàn tất pipeline
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {STAGES.slice(0, 5).map((stage, index) => {
            const colors = ['#3b82f6', '#38bdf8', '#6366f1', '#8b5cf6', '#34d399']
            return (
              <div key={stage} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">{stage}</span>
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: colors[index] }}>
                    {stageCounts[stage]}
                  </span>
                </div>
                {index < 4 ? <div className="mt-3 h-1 rounded-full bg-white/10" /> : null}
              </div>
            )
          })}
        </div>

        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-emerald-400"
            style={{ width: `${Math.max(4, enrolledRatio)}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border p-5" style={{ background: '#0f1219', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Kết quả chuyển đổi theo tháng</h2>
            <p className="mt-1 text-sm text-slate-400">Số lead tôi đã enrolled trong 6 tháng gần nhất.</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEnrollment} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Line type="monotone" dataKey="enrolled" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: '#0f1219', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Nhiệm vụ sắp đến hạn</h2>
            <p className="mt-1 text-sm text-slate-400">Các công việc ưu tiên của tôi.</p>
          </div>
          <div className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                Không có nhiệm vụ sắp đến hạn.
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => router.push('/tasks')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/[0.08]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{task.title}</p>
                      <p className="text-xs text-slate-400">Lead: {getLeadName(task.lead_id)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className={getDueTone(task.due_date, today)}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Không có hạn'}
                    </span>
                    <span className="text-slate-300">{task.status}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl border p-5" style={{ background: '#0f1219', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Lead của tôi theo nguồn</h2>
            <p className="mt-1 text-sm text-slate-400">Phân bổ lead theo kênh marketing.</p>
          </div>
          <SourcePieChart data={sourceBreakdown} />
          <p className="mt-3 text-sm text-slate-300">
            {bestSource
              ? `${bestSource.count} lead từ ${bestSource.source} có tỷ lệ chuyển đổi ${bestSource.conversionRate.toFixed(1)}%.`
              : 'Chưa có dữ liệu lead.'}
          </p>
        </div>

        <div className="rounded-xl border p-5" style={{ background: '#0f1219', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white">Tổng quan nhanh</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lead đã enrolled</p>
              <p className="mt-2 text-lg font-bold text-white">{myEnrolled.length}</p>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lead dropped</p>
              <p className="mt-2 text-lg font-bold text-white">{myDropped.length}</p>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tỷ lệ chuyển đổi</p>
              <p className="mt-2 text-lg font-bold text-emerald-300">{winRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nhiệm vụ mở</p>
              <p className="mt-2 text-lg font-bold text-amber-300">{myOpenTasks.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
