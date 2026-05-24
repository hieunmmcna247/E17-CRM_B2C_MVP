import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { SOURCES } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Stage normalization helper to match database values consistently
export const STAGE_MAP: Record<string, string> = {
  New: 'New',
  Contacted: 'Contacted',
  Qualified: 'Consulting',
  Consulting: 'Consulting',
  Proposal: 'Trial',
  Trial: 'Trial',
  Won: 'Enrolled',
  Enrolled: 'Enrolled',
  Lost: 'Dropped',
  Dropped: 'Dropped',
}

function normalizeStage(stage: string): string {
  return STAGE_MAP[stage] || stage
}

// Reusable paginated fetcher to bypass Supabase 1000 row limits
async function fetchAllFromTable<T>(
  supabase: any,
  table: string,
  selectFields: string,
  filterFn?: (query: any) => any
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  const PAGE_SIZE = 1000

  while (true) {
    let query = supabase.from(table).select(selectFields).range(from, from + PAGE_SIZE - 1)
    if (filterFn) {
      query = filterFn(query)
    }
    const { data, error } = await query
    if (error) {
      throw new Error(`Error fetching ${table}: ${error.message}`)
    }
    const batch = (data as T[] | null) ?? []
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return all
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  noStore()

  const currentRange = searchParams.range || 'thang_nay'
  const supabase = await createAdminClient()

  // 1. Fetch raw data in parallel using our admin client to bypass RLS limits
  const [rawLeads, rawHistory, rawTasks, rawProfiles, rawInteractions] = await Promise.all([
    fetchAllFromTable<any>(supabase, 'leads', '*'),
    fetchAllFromTable<any>(supabase, 'stage_history', '*'),
    fetchAllFromTable<any>(supabase, 'tasks', '*'),
    fetchAllFromTable<any>(supabase, 'user_profiles', '*', (q) => q.eq('role', 'sales')),
    fetchAllFromTable<any>(supabase, 'interactions', '*'),
  ])

  // Current anchored today context
  const today = new Date('2026-05-24T08:29:18Z')

  // Calculate Date Filters
  let filterStart: Date | null = null
  let filterEnd: Date | null = null

  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed, so 4 is May

  if (currentRange === 'thang_nay') {
    filterStart = new Date(Date.UTC(year, month, 1))
    filterEnd = new Date(Date.UTC(year, month + 1, 1))
  } else if (currentRange === 'quy_nay') {
    const currentQuarter = Math.floor(month / 3) // Q2 is 1 (Apr, May, Jun)
    filterStart = new Date(Date.UTC(year, currentQuarter * 3, 1))
    filterEnd = new Date(Date.UTC(year, (currentQuarter + 1) * 3, 1))
  } else if (currentRange === 'nam_nay') {
    filterStart = new Date(Date.UTC(year, 0, 1))
    filterEnd = new Date(Date.UTC(year + 1, 0, 1))
  }

  const isWithinRange = (dateStr: string) => {
    if (!filterStart || !filterEnd) return true
    const d = new Date(dateStr)
    return d >= filterStart && d < filterEnd
  }

  // Normalize stages on all leads
  const normalizedLeads = rawLeads.map((l) => ({
    ...l,
    stage: normalizeStage(l.stage),
  }))

  // Filter leads based on selected range
  const filteredLeads = normalizedLeads.filter((l) => isWithinRange(l.created_at))

  // Metric 1: Total Leads
  const totalLeads = filteredLeads.length

  // Metric 2: New Leads This Month (Always May 2026)
  const currentMonthStart = new Date(Date.UTC(year, month, 1))
  const currentMonthEnd = new Date(Date.UTC(year, month + 1, 1))
  const newLeadsThisMonth = normalizedLeads.filter((l) => {
    const d = new Date(l.created_at)
    return d >= currentMonthStart && d < currentMonthEnd
  }).length

  // Metric 3 & 4: Enrolled & Dropped counts
  const enrolledCount = filteredLeads.filter((l) => l.stage === 'Enrolled').length
  const droppedCount = filteredLeads.filter((l) => l.stage === 'Dropped').length

  // Metric 5: Conversion Rate
  const conversionRate = enrolledCount + droppedCount > 0
    ? (enrolledCount / (enrolledCount + droppedCount)) * 100
    : 0

  // Metric 6: Overdue Tasks count (due < today and status != done, regardless of filter range for backlog actionability)
  const overdueTasksCount = rawTasks.filter((t) => {
    const isNotDone = t.status !== 'done'
    const isOverdue = new Date(t.due_date) < today
    return isNotDone && isOverdue
  }).length

  // Metric 7: Estimated Revenue
  const estimatedRevenue = enrolledCount * 15000000

  // Metric 8: Sales Performance
  const salesPerformance = rawProfiles.map((rep) => {
    const repLeads = filteredLeads.filter((l) => l.assigned_to === rep.id)
    const assigned = repLeads.length
    const contacted = repLeads.filter((l) => l.stage === 'Contacted').length
    const consulting = repLeads.filter((l) => l.stage === 'Consulting').length
    const trial = repLeads.filter((l) => l.stage === 'Trial').length
    const enrolled = repLeads.filter((l) => l.stage === 'Enrolled').length
    const dropped = repLeads.filter((l) => l.stage === 'Dropped').length

    const repCR = enrolled + dropped > 0 ? (enrolled / (enrolled + dropped)) * 100 : 0

    return {
      id: rep.id,
      name: rep.full_name,
      assigned,
      contacted,
      consulting,
      trial,
      enrolled,
      dropped,
      conversionRate: repCR,
    }
  })

  // Metric 9: Stage Distribution
  const stages = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled', 'Dropped']
  const stageDistribution = stages.map((stage) => {
    const count = filteredLeads.filter((l) => l.stage === stage).length
    return { stage, count }
  })

  // Metric 10: Source Distribution
  const sourceDistribution = SOURCES.map((source) => {
    const count = filteredLeads.filter((l) => l.source === source).length
    return { name: source, count }
  })

  // Metric 11: Monthly Lead Trend (Enrolled counts grouped by month and sales rep over last 6 months)
  const trendMonths: Array<{ label: string; year: number; month: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const y = d.getFullYear()
    trendMonths.push({
      label: `${m}/${y}`,
      year: y,
      month: d.getMonth(),
    })
  }

  // Filter history to Enrolled transitions
  const enrolledHistory = rawHistory.filter(
    (h) => normalizeStage(h.new_stage) === 'Enrolled'
  )

  const monthlyLeadTrend = trendMonths.map((tm) => {
    const row: Record<string, string | number> = { month: tm.label }

    rawProfiles.forEach((rep) => {
      const count = enrolledHistory.filter((h) => {
        if (h.changed_by !== rep.id) return false
        const d = new Date(h.changed_at)
        return d.getFullYear() === tm.year && d.getMonth() === tm.month
      }).length
      row[rep.full_name] = count
    })

    return row as { month: string; [salesName: string]: string | number }
  })

  const salesNames = rawProfiles.map((p) => p.full_name)

  // Metric 12: Task Stats
  const filteredTasks = rawTasks.filter((t) => isWithinRange(t.created_at))
  const taskStats = {
    todo: filteredTasks.filter((t) => t.status === 'todo').length,
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress').length,
    done: filteredTasks.filter((t) => t.status === 'done').length,
    overdue: filteredTasks.filter((t) => {
      const isNotDone = t.status !== 'done'
      const isOverdue = new Date(t.due_date) < today
      return isNotDone && isOverdue
    }).length,
  }

  // Metric 13: Upcoming Tasks (due in next 7 days, or overdue, not done, limit 5)
  // We sort upcoming first, then overdue, limiting to 5.
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const leadMap = new Map(rawLeads.map((l) => [l.id, l.name]))
  const profileMap = new Map(rawProfiles.map((p) => [p.id, p.full_name]))

  const upcomingTasks = rawTasks
    .filter((t) => {
      const isNotDone = t.status !== 'done'
      const dueDate = new Date(t.due_date)
      return isNotDone && dueDate < sevenDaysFromNow
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title,
      lead_name: leadMap.get(t.lead_id) || 'Chưa rõ',
      assigned_name: profileMap.get(t.assigned_to) || 'Chưa rõ',
      due_date: t.due_date,
      status: t.status,
      priority: t.priority,
    }))

  // Add: Recent Activities (last 5 interactions joined with lead/profile names)
  const recentActivities = [...rawInteractions]
    .filter((i) => isWithinRange(i.created_at))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      lead_id: i.lead_id,
      lead_name: leadMap.get(i.lead_id) || 'Chưa rõ',
      note: i.note,
      created_by_name: profileMap.get(i.created_by) || 'Hệ thống',
      created_at: i.created_at,
    }))

  // Add: Lead Source Effectiveness (Leads, Enrolled, Conversion Rate per source)
  const sourceEffectiveness = SOURCES.map((source) => {
    const sLeads = filteredLeads.filter((l) => l.source === source)
    const sTotal = sLeads.length
    const sEnrolled = sLeads.filter((l) => l.stage === 'Enrolled').length
    const sDropped = sLeads.filter((l) => l.stage === 'Dropped').length
    const sCR = sEnrolled + sDropped > 0 ? (sEnrolled / (sEnrolled + sDropped)) * 100 : 0

    return {
      source,
      totalLeads: sTotal,
      enrolledCount: sEnrolled,
      conversionRate: sCR,
    }
  })

  // Matrix Performance Table Data
  const performanceTableData = salesPerformance.map((s) => ({
    id: s.id,
    name: s.name,
    assigned: s.assigned,
    contacted: s.contacted,
    consulting: s.consulting,
    trial: s.trial,
    enrolled: s.enrolled,
    dropped: s.dropped,
    conversionRate: s.conversionRate,
    estimatedRevenue: s.enrolled * 15000000,
  }))

  const metrics = {
    totalLeads,
    newLeadsThisMonth,
    enrolledCount,
    droppedCount,
    conversionRate,
    overdueTasksCount,
    estimatedRevenue,
    salesPerformance,
    stageDistribution,
    sourceDistribution,
    monthlyLeadTrend,
    salesNames,
    taskStats,
    upcomingTasks,
    recentActivities,
    sourceEffectiveness,
    performanceTableData,
    heatmapSales: rawProfiles.map((p) => ({ id: p.id, name: p.full_name })),
    heatmapLeads: rawLeads.map((l) => ({
      assigned_to: l.assigned_to,
      created_at: l.created_at,
    })),
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-[1600px]">
        <DashboardClient metrics={metrics} />
      </div>
    </div>
  )
}