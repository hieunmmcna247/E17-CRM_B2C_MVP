'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  Users,
  PlusCircle,
  TrendingUp,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Calendar,
  Download,
} from 'lucide-react'

// Import components
import { SalesBarChart, SalesPerformanceDatum } from './sales-bar-chart'
import { SalesLineChart } from './sales-line-chart'
import { TopSalesLeaderboard, LeaderboardRep } from './top-sales-leaderboard'
import { SourceTreemap, SourceTreemapDatum } from './source-treemap'
import { SourceEffectiveness, SourceEffectivenessDatum } from './source-effectiveness'
import { LeadHeatmap, HeatmapSalesRep, HeatmapLead } from './lead-heatmap'
import { PipelineFunnel } from './pipeline-funnel'
import { PipelineBar } from './pipeline-bar'
import { RecentActivities, RecentActivityItem } from './recent-activities'
import { TaskBarChart, TaskStatsData } from './task-bar-chart'
import { UpcomingTasksTable, UpcomingTaskItem } from './upcoming-tasks-table'
import { PerformanceTable, PerformanceRow } from './performance-table'

interface SalesOption {
  id: string
  name: string
}

interface DashboardMetrics {
  totalLeads: number
  newLeadsThisMonth: number
  enrolledCount: number
  droppedCount: number
  conversionRate: number
  overdueTasksCount: number
  estimatedRevenue: number
  salesPerformance: SalesPerformanceDatum[]
  stageDistribution: Array<{ stage: string; count: number }>
  sourceDistribution: SourceTreemapDatum[]
  monthlyLeadTrend: Array<{ month: string; [salesName: string]: string | number }>
  salesNames: string[]
  taskStats: TaskStatsData
  upcomingTasks: UpcomingTaskItem[]
  recentActivities: RecentActivityItem[]
  sourceEffectiveness: SourceEffectivenessDatum[]
  performanceTableData: PerformanceRow[]
  heatmapSales: HeatmapSalesRep[]
  heatmapLeads: HeatmapLead[]
}

interface DashboardClientViewProps {
  metrics: DashboardMetrics
  salesOptions?: SalesOption[]
  selectedSalesId?: string | null
  isAdminOrManager: boolean
  onSalesChange?: (salesId: string | null) => void
}

const RANGE_LABELS: Record<string, string> = {
  thang_nay: 'Tháng này',
  quy_nay: 'Quý này',
  nam_nay: 'Năm nay',
  toan_thoi_gian: 'Toàn thời gian',
}

export function DashboardClient() {
  const { profile, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentRange = searchParams.get('range') || 'thang_nay'
  const isAdminOrManager = role === 'admin' || role === 'manager'
  const querySalesId = searchParams.get('sales_id') ?? ''
  const selectedSalesId = isAdminOrManager ? querySalesId : profile?.id ?? ''
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [salesOptions, setSalesOptions] = useState<SalesOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    const controller = new AbortController()

    async function loadMetrics() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('range', currentRange)
        if (isAdminOrManager && selectedSalesId) {
          params.set('sales_id', selectedSalesId)
        }

        const res = await fetch(`/api/dashboard/metrics?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || 'Lỗi tải dữ liệu dashboard')
        }

        const data = await res.json()
        setMetrics(data.metrics)
        setSalesOptions(data.salesOptions ?? [])
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu dashboard')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadMetrics()

    return () => {
      controller.abort()
    }
  }, [authLoading, currentRange, selectedSalesId, isAdminOrManager])

  const handleSalesChange = (salesId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (salesId) {
      params.set('sales_id', salesId)
    } else {
      params.delete('sales_id')
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
        <div className="mx-auto max-w-[1600px] space-y-4">
          <div className="h-14 rounded-xl bg-white/5 animate-pulse" />
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
        <div className="mx-auto max-w-[1200px] rounded-xl border border-white/10 bg-[#0f1219] p-6 text-white">
          <h1 className="text-lg font-semibold">Không thể tải dashboard</h1>
          <p className="mt-2 text-sm text-slate-300">Vui lòng đăng nhập lại hoặc làm mới trang.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
        <div className="mx-auto max-w-[1200px] rounded-xl border border-rose-500/40 bg-[#0f1219] p-6 text-white">
          <h1 className="text-lg font-semibold">Lỗi tải dashboard</h1>
          <p className="mt-2 text-sm text-slate-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <DashboardClientView
      metrics={metrics}
      salesOptions={salesOptions}
      selectedSalesId={selectedSalesId || null}
      isAdminOrManager={isAdminOrManager}
      onSalesChange={handleSalesChange}
    />
  )
}

function DashboardClientView({
  metrics,
  salesOptions,
  selectedSalesId,
  isAdminOrManager,
  onSalesChange,
}: DashboardClientViewProps) {
  const { profile, role } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentRange = searchParams.get('range') || 'thang_nay'
  const [exporting, setExporting] = useState(false)

  const handleRangeChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', val)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleExport = () => {
    setExporting(true)
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const filename = `dashboard_report_${dateStr}.csv`
      const rangeLabel = RANGE_LABELS[currentRange] || currentRange

      let csv = 'BÁO CÁO HIỆU QUẢ KINH DOANH (CRM E17)\r\n'
      csv += `Thời gian xuất,${new Date().toLocaleString('vi-VN')}\r\n`
      csv += `Thời gian lọc,${rangeLabel}\r\n\r\n`

      // Prepare role-scoped data
      const isSales = role === 'sales'
      const filteredPerformance = isSales && profile ? metrics.performanceTableData.filter((p) => p.id === profile.id) : metrics.performanceTableData
      const displayedEstimatedRevenue = isSales && profile ? filteredPerformance.reduce((s, r) => s + (r.estimatedRevenue || 0), 0) : metrics.estimatedRevenue

      // 1. KPIs
      csv += '--- CHỈ SỐ KPI TỔNG QUAN ---\r\n'
      csv += 'Chỉ số,Giá trị\r\n'
      csv += `Tổng Leads,${metrics.totalLeads}\r\n`
      csv += `Lead mới tháng này,${metrics.newLeadsThisMonth}\r\n`
      csv += `Tỷ lệ chuyển đổi,${metrics.conversionRate.toFixed(2)}%\r\n`
      csv += `Đã đăng ký (Enrolled),${metrics.enrolledCount}\r\n`
      csv += `Doanh thu ước tính (VND),${displayedEstimatedRevenue}\r\n`
      csv += `Nhiệm vụ quá hạn,${metrics.overdueTasksCount}\r\n\r\n`

      // 2. Sales reps
      csv += '--- HIỆU SUẤT NHÂN VIÊN SALE ---\r\n'
      csv += 'Nhân viên,Giao,Contacted,Consulting,Trial,Enrolled,Tỷ lệ chuyển đổi,Doanh thu ước tính (VND)\r\n'
      // Export only rows the user is allowed to see
      const exportRows = isSales && profile ? filteredPerformance : metrics.performanceTableData
      exportRows.forEach((s) => {
        csv += `"${s.name}",${s.assigned},${s.contacted},${s.consulting},${s.trial},${s.enrolled},${s.conversionRate.toFixed(2)}%,${s.estimatedRevenue}\r\n`
      })
      csv += '\r\n'

      // 3. Source Effectiveness
      csv += '--- HIỆU QUẢ NGUỒN LEAD ---\r\n'
      csv += 'Nguồn Lead,Tổng Leads,Đã đăng ký (Enrolled),Tỷ lệ chuyển đổi\r\n'
      metrics.sourceEffectiveness.forEach((s) => {
        csv += `"${s.source}",${s.totalLeads},${s.enrolledCount},${s.conversionRate.toFixed(2)}%\r\n`
      })
      csv += '\r\n'

      // 4. Pipeline Stages
      csv += '--- TRẠNG THÁI PIPELINE ---\r\n'
      csv += 'Trạng thái,Số lượng leads\r\n'
      metrics.stageDistribution.forEach((s) => {
        csv += `"${s.stage}",${s.count}\r\n`
      })
      csv += '\r\n'

      // 5. Tasks
      csv += '--- THỐNG KÊ NHIỆM VỤ ---\r\n'
      csv += 'Trạng thái nhiệm vụ,Số lượng\r\n'
      csv += `Cần làm (Todo),${metrics.taskStats.todo}\r\n`
      csv += `Đang làm (In Progress),${metrics.taskStats.in_progress}\r\n`
      csv += `Hoàn thành (Done),${metrics.taskStats.done}\r\n`
      csv += `Quá hạn (Overdue),${metrics.taskStats.overdue}\r\n`

      // Download
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      window.alert('Lỗi xuất báo cáo')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold font-syne text-white tracking-tight">
            Dashboard – Báo cáo Tuyển sinh
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-dm-sans">
            Phân tích hiệu quả nguồn lead, hiệu suất làm việc của đội ngũ sales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range filter */}
          {isAdminOrManager && salesOptions.length > 0 && (
            <div className="relative min-w-[220px]">
              <label htmlFor="sales-filter" className="sr-only">
                Chọn nhân viên Sales
              </label>
              <select
                id="sales-filter"
                value={selectedSalesId ?? ''}
                onChange={(e) => onSalesChange?.(e.target.value ? e.target.value : null)}
                className="bg-[#0f1219] text-xs text-slate-300 pl-3 pr-8 py-2 rounded-lg border border-white/[0.06] focus:outline-none focus:border-blue-500/50 appearance-none font-dm-sans cursor-pointer hover:bg-white/[0.02] transition-colors w-full"
              >
                <option value="">Tất cả Sales</option>
                {salesOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>
          )}

          <div className="relative flex items-center">
            <Calendar className="absolute left-3 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={currentRange}
              onChange={(e) => handleRangeChange(e.target.value)}
              className="bg-[#0f1219] text-xs text-slate-300 pl-9 pr-8 py-2 rounded-lg border border-white/[0.06] focus:outline-none focus:border-blue-500/50 appearance-none font-dm-sans cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <option value="thang_nay">Tháng này</option>
              <option value="quy_nay">Quý này</option>
              <option value="nam_nay">Năm nay</option>
              <option value="toan_thoi_gian">Toàn thời gian</option>
            </select>
            <div className="absolute right-3 pointer-events-none text-slate-500 text-[10px]">▼</div>
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors px-4 py-2 text-xs font-semibold text-white font-dm-sans"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Đang xuất...' : 'Xuất báo cáo'}
          </button>
        </div>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Tổng Lead"
          value={metrics.totalLeads}
          icon={<Users className="h-4.5 w-4.5" />}
          accent="#3b82f6"
        />
        <MetricCard
          label="Lead mới tháng này"
          value={metrics.newLeadsThisMonth}
          icon={<PlusCircle className="h-4.5 w-4.5" />}
          accent="#6366f1"
        />
        <MetricCard
          label="Tỷ lệ chuyển đổi"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4.5 w-4.5" />}
          accent="#22c55e"
        />
        <MetricCard
          label="Đã đăng ký (Enrolled)"
          value={metrics.enrolledCount}
          icon={<CheckCircle className="h-4.5 w-4.5" />}
          accent="#10b981"
        />
        <MetricCard
          label="Doanh thu ước tính"
          value={formatVND(metrics.estimatedRevenue)}
          icon={<DollarSign className="h-4.5 w-4.5" />}
          accent="#f59e0b"
          isLarge
        />
        <MetricCard
          label="Nhiệm vụ quá hạn"
          value={metrics.overdueTasksCount}
          icon={<AlertCircle className="h-4.5 w-4.5" />}
          accent="#ef4444"
        />
      </div>

      {/* ROW 2: SALES PERFORMANCE & LEADERBOARD */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-10">
        <div className="lg:col-span-4 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">So sánh lead được giao & đã chuyển đổi</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-4">Số lượng lead giao và số lượng đăng ký thực tế của từng nhân viên</p>
          </div>
          <SalesBarChart data={role === 'sales' && profile ? metrics.salesPerformance.filter((s) => s.id === profile.id) : metrics.salesPerformance} />
        </div>

        <div className="lg:col-span-4 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">Xu hướng tuyển sinh (Enrolled)</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-4">Số lượng học viên đăng ký mới hàng tháng trong vòng 6 tháng gần nhất</p>
          </div>
          <SalesLineChart data={role === 'sales' && profile ? metrics.monthlyLeadTrend.map((row) => ({ month: row.month, [profile.full_name]: row[profile.full_name] || 0 })) : metrics.monthlyLeadTrend} salesNames={role === 'sales' && profile ? [profile.full_name] : metrics.salesNames} />
        </div>

        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <TopSalesLeaderboard
            data={(role === 'sales' && profile ? metrics.salesPerformance.filter((s) => s.id === profile.id) : metrics.salesPerformance).map((s) => ({
              id: s.id,
              name: s.name,
              enrolled: s.enrolled,
              conversionRate: s.conversionRate,
            }))}
          />
        </div>
      </div>

      {/* ROW 3: LEAD QUALITY & SOURCE ANALYSIS */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-10">
        <div className="lg:col-span-4 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">Phân bổ nguồn Lead</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-4">Tổng số lượng lead thu hút từ các nguồn truyền thông khác nhau</p>
          </div>
          <SourceTreemap data={metrics.sourceDistribution} />
        </div>

        <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <SourceEffectiveness data={metrics.sourceEffectiveness} />
        </div>

        <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">Bản đồ nhiệt giao lead</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-3">Phân bổ số lượng lead được giao cho nhân viên theo các tháng</p>
          </div>
          <LeadHeatmap salesReps={role === 'sales' && profile ? metrics.heatmapSales.filter((s) => s.id === profile.id) : metrics.heatmapSales} leads={metrics.heatmapLeads} />
        </div>
      </div>

      {/* ROW 4: PIPELINE & ACTIVITY MONITORING */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-10">
        <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">Phễu chuyển đổi tuyển sinh</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-4">Tỷ lệ suy giảm của học viên qua các bước trong phễu tư vấn</p>
          </div>
          <PipelineFunnel
            data={metrics.stageDistribution}
            droppedCount={metrics.droppedCount}
          />
        </div>

        <div className="lg:col-span-4 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">Số lượng leads theo trạng thái</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-4">Chi tiết số lượng học viên đang nằm ở các giai đoạn pipeline</p>
          </div>
          <PipelineBar data={metrics.stageDistribution} />
        </div>

        <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <RecentActivities data={metrics.recentActivities} />
        </div>
      </div>

      {/* ROW 5: TASK MONITORING & PERFORMANCE TABLE */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-10">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">Trạng thái công việc</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-4">Thống kê số lượng đầu việc của đội ngũ sales</p>
          </div>
          <TaskBarChart data={metrics.taskStats} />
        </div>

        <div className="lg:col-span-4 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">Nhiệm vụ sắp tới (7 ngày)</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-4">Danh sách công việc sales cần xử lý gấp trong tuần</p>
          </div>
          <UpcomingTasksTable data={metrics.upcomingTasks} />
        </div>

        <div className="lg:col-span-4 rounded-xl border border-white/[0.06] bg-[#0f1219] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-syne text-white">Bảng phân tích hiệu suất Sales</h2>
            <p className="text-[11px] text-slate-500 font-dm-sans mb-4">Báo cáo chi tiết số liệu chuyển đổi và doanh số của từng nhân viên</p>
          </div>
          <PerformanceTable data={role === 'sales' && profile ? metrics.performanceTableData.filter((p) => p.id === profile.id) : metrics.performanceTableData} />
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  accent,
  isLarge = false,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent: string
  isLarge?: boolean
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col justify-between h-[115px] border border-white/[0.06] transition-all hover:bg-white/[0.02]"
      style={{
        background: '#0f1219',
        borderTop: `2px solid ${accent}`,
      }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-dm-sans">
          {label}
        </p>
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ background: `${accent}15`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p
          className={`font-bold font-syne text-white tracking-tight ${
            isLarge ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
