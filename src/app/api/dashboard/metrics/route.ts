import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { SOURCES, UserRole } from '@/types'

const STAGE_MAP: Record<string, string> = {
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

function normalizeStage(stage: string) {
  return STAGE_MAP[stage] || stage
}

function buildRangeFilter(range: string) {
  const today = new Date('2026-05-24T08:29:18Z')
  const year = today.getFullYear()
  const month = today.getMonth()
  let filterStart: Date | null = null
  let filterEnd: Date | null = null

  if (range === 'thang_nay') {
    filterStart = new Date(Date.UTC(year, month, 1))
    filterEnd = new Date(Date.UTC(year, month + 1, 1))
  } else if (range === 'quy_nay') {
    const currentQuarter = Math.floor(month / 3)
    filterStart = new Date(Date.UTC(year, currentQuarter * 3, 1))
    filterEnd = new Date(Date.UTC(year, (currentQuarter + 1) * 3, 1))
  } else if (range === 'nam_nay') {
    filterStart = new Date(Date.UTC(year, 0, 1))
    filterEnd = new Date(Date.UTC(year + 1, 0, 1))
  }

  return { today, filterStart, filterEnd }
}

function isWithinRange(dateStr: string, filterStart: Date | null, filterEnd: Date | null) {
  if (!filterStart || !filterEnd) return true
  const d = new Date(dateStr)
  return d >= filterStart && d < filterEnd
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const range = url.searchParams.get('range') || 'thang_nay'
  const requestedSalesId = url.searchParams.get('sales_id') || ''

  const authClient = await createClient()
  const {
    data: { session },
    error: sessionError,
  } = await authClient.auth.getSession()

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { data: profile, error: profileError } = await authClient
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Không thể tải thông tin người dùng' }, { status: 403 })
  }

  const role = profile.role as UserRole
  const isSales = role === 'sales'
  const isAdminOrManager = role === 'admin' || role === 'manager'

  if (!isSales && !isAdminOrManager) {
    return NextResponse.json({ error: 'Không có quyền xem báo cáo dashboard' }, { status: 403 })
  }

  const salesId = isSales ? userId : requestedSalesId || null
  const adminClient = await createAdminClient()

  const [salesProfilesResult, rawLeadsResult, rawHistoryResult, rawTasksResult, rawInteractionsResult] = await Promise.all([
    adminClient.from('user_profiles').select('id,full_name').in('role', ['sales']),
    adminClient.from('leads').select('*'),
    adminClient.from('stage_history').select('*'),
    adminClient.from('tasks').select('*'),
    adminClient.from('interactions').select('*'),
  ])

  if (salesProfilesResult.error || rawLeadsResult.error || rawHistoryResult.error || rawTasksResult.error || rawInteractionsResult.error) {
    return NextResponse.json({ error: 'Lỗi tải dữ liệu dashboard' }, { status: 500 })
  }

  const salesProfiles = salesProfilesResult.data ?? []
  const rawLeads = rawLeadsResult.data ?? []
  const rawHistory = rawHistoryResult.data ?? []
  const rawTasks = rawTasksResult.data ?? []
  const rawInteractions = rawInteractionsResult.data ?? []

  const { today, filterStart, filterEnd } = buildRangeFilter(range)

  const normalizedLeads = rawLeads.map((lead: any) => ({
    ...lead,
    stage: normalizeStage(lead.stage),
  }))

  let filteredLeads = normalizedLeads.filter((lead: any) => isWithinRange(lead.created_at, filterStart, filterEnd))
  if (salesId) {
    filteredLeads = filteredLeads.filter((lead: any) => lead.assigned_to === salesId)
  }

  const totalLeads = filteredLeads.length

  const currentMonthStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1))
  const currentMonthEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 1))
  const newLeadsThisMonth = normalizedLeads.filter((lead: any) => {
    const d = new Date(lead.created_at)
    return d >= currentMonthStart && d < currentMonthEnd
  }).length

  const enrolledCount = filteredLeads.filter((lead: any) => lead.stage === 'Enrolled').length
  const droppedCount = filteredLeads.filter((lead: any) => lead.stage === 'Dropped').length
  const conversionRate = enrolledCount + droppedCount > 0 ? (enrolledCount / (enrolledCount + droppedCount)) * 100 : 0
  const overdueTasksCount = rawTasks.filter((task: any) => {
    const isNotDone = task.status !== 'done'
    const isOverdue = new Date(task.due_date) < today
    return isNotDone && isOverdue && (!salesId || task.assigned_to === salesId)
  }).length
  const estimatedRevenue = enrolledCount * 15000000

  const viewSalesProfiles = salesId ? salesProfiles.filter((rep: any) => rep.id === salesId) : salesProfiles

  const salesPerformance = viewSalesProfiles.map((rep: any) => {
    const repLeads = filteredLeads.filter((lead: any) => lead.assigned_to === rep.id)
    const assigned = repLeads.length
    const contacted = repLeads.filter((lead: any) => lead.stage === 'Contacted').length
    const consulting = repLeads.filter((lead: any) => lead.stage === 'Consulting').length
    const trial = repLeads.filter((lead: any) => lead.stage === 'Trial').length
    const enrolled = repLeads.filter((lead: any) => lead.stage === 'Enrolled').length
    const dropped = repLeads.filter((lead: any) => lead.stage === 'Dropped').length
    const conversionRate = enrolled + dropped > 0 ? (enrolled / (enrolled + dropped)) * 100 : 0

    return {
      id: rep.id,
      name: rep.full_name,
      assigned,
      contacted,
      consulting,
      trial,
      enrolled,
      dropped,
      conversionRate,
    }
  })

  const stages = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled', 'Dropped']
  const stageDistribution = stages.map((stage) => ({
    stage,
    count: filteredLeads.filter((lead: any) => lead.stage === stage).length,
  }))

  const sourceDistribution = SOURCES.map((source) => ({
    name: source,
    count: filteredLeads.filter((lead: any) => lead.source === source).length,
  }))

  const trendMonths: Array<{ label: string; year: number; month: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    trendMonths.push({
      label: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
      year: d.getFullYear(),
      month: d.getMonth(),
    })
  }

  const enrolledHistory = rawHistory.filter((history: any) => normalizeStage(history.new_stage) === 'Enrolled')

  const monthlyLeadTrend = trendMonths.map((tm) => {
    const row: Record<string, string | number> = { month: tm.label }

    viewSalesProfiles.forEach((rep: any) => {
      const count = enrolledHistory.filter((history: any) => {
        if (history.changed_by !== rep.id) return false
        const d = new Date(history.changed_at)
        return d.getFullYear() === tm.year && d.getMonth() === tm.month
      }).length
      row[rep.full_name] = count
    })

    return row as { month: string; [salesName: string]: string | number }
  })

  const salesNames = viewSalesProfiles.map((rep: any) => rep.full_name)

  const filteredTasks = rawTasks.filter((task: any) => isWithinRange(task.created_at, filterStart, filterEnd) && (!salesId || task.assigned_to === salesId))
  const taskStats = {
    todo: filteredTasks.filter((task: any) => task.status === 'todo').length,
    in_progress: filteredTasks.filter((task: any) => task.status === 'in_progress').length,
    done: filteredTasks.filter((task: any) => task.status === 'done').length,
    overdue: filteredTasks.filter((task: any) => {
      const isNotDone = task.status !== 'done'
      const isOverdue = new Date(task.due_date) < today
      return isNotDone && isOverdue
    }).length,
  }

  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const leadMap = new Map(rawLeads.map((lead: any) => [lead.id, lead.name]))
  const leadAssignmentMap = new Map(rawLeads.map((lead: any) => [lead.id, lead.assigned_to]))
  const profileMap = new Map(salesProfiles.map((rep: any) => [rep.id, rep.full_name]))

  const upcomingTasks = filteredTasks
    .filter((task: any) => {
      const isNotDone = task.status !== 'done'
      const dueDate = new Date(task.due_date)
      return isNotDone && dueDate < sevenDaysFromNow
    })
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)
    .map((task: any) => ({
      id: task.id,
      title: task.title,
      lead_name: leadMap.get(task.lead_id) || 'Chưa rõ',
      assigned_name: profileMap.get(task.assigned_to) || 'Chưa rõ',
      due_date: task.due_date,
      status: task.status,
      priority: task.priority,
    }))

  const recentActivities = [...rawInteractions]
    .filter((interaction: any) => {
      if (!isWithinRange(interaction.created_at, filterStart, filterEnd)) return false
      if (salesId) {
        return interaction.created_by === salesId || leadAssignmentMap.get(interaction.lead_id) === salesId
      }
      return true
    })
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((interaction: any) => ({
      id: interaction.id,
      lead_id: interaction.lead_id,
      lead_name: leadMap.get(interaction.lead_id) || 'Chưa rõ',
      note: interaction.note,
      created_by_name: profileMap.get(interaction.created_by) || 'Hệ thống',
      created_at: interaction.created_at,
    }))

  const sourceEffectiveness = SOURCES.map((source) => {
    const sLeads = filteredLeads.filter((lead: any) => lead.source === source)
    const sTotal = sLeads.length
    const sEnrolled = sLeads.filter((lead: any) => lead.stage === 'Enrolled').length
    const sDropped = sLeads.filter((lead: any) => lead.stage === 'Dropped').length
    const conversionRate = sEnrolled + sDropped > 0 ? (sEnrolled / (sEnrolled + sDropped)) * 100 : 0

    return {
      source,
      totalLeads: sTotal,
      enrolledCount: sEnrolled,
      conversionRate,
    }
  })

  const performanceTableData = salesPerformance.map((result) => ({
    id: result.id,
    name: result.name,
    assigned: result.assigned,
    contacted: result.contacted,
    consulting: result.consulting,
    trial: result.trial,
    enrolled: result.enrolled,
    dropped: result.dropped,
    conversionRate: result.conversionRate,
    estimatedRevenue: result.enrolled * 15000000,
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
    heatmapSales: viewSalesProfiles.map((rep: any) => ({ id: rep.id, name: rep.full_name })),
    heatmapLeads: filteredLeads.map((lead: any) => ({ assigned_to: lead.assigned_to, created_at: lead.created_at })),
  }

  const salesOptions = salesProfiles.map((rep: any) => ({ id: rep.id, name: rep.full_name }))

  return NextResponse.json({ metrics, salesOptions })
}
