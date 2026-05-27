'use client'

import {
  AdminDashboard,
  type AdminDashboardLead,
  type AdminDashboardSalesProfile,
  type AdminDashboardStageHistory,
  type AdminDashboardTask,
} from '@/components/dashboard/admin-dashboard'

interface ViewerDashboardProps {
  leads: AdminDashboardLead[]
  stageHistory: AdminDashboardStageHistory[]
  tasks: AdminDashboardTask[]
  salesProfiles: AdminDashboardSalesProfile[]
}

export function ViewerDashboard({ leads, stageHistory, tasks, salesProfiles }: ViewerDashboardProps) {
  return (
    <AdminDashboard
      leads={leads}
      stageHistory={stageHistory}
      tasks={tasks}
      salesProfiles={salesProfiles}
      pageTitle="Xem bao cao tong quan"
      showPerformanceTable={false}
      showOverdueCard={false}
      showExportButton
      readOnlyLabels
    />
  )
}
