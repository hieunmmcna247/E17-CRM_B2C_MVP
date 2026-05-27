import { unstable_noStore as noStore } from 'next/cache'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DashboardPage() {
  noStore()

  return (
    <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-[1600px]">
        <DashboardClient />
      </div>
    </div>
  )
}
