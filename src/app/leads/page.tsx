import { ExportLeadsButton } from '@/components/leads/export-leads-button'
import { NewLeadModal } from '@/components/leads/new-lead-modal'
import { LeadsTable } from '@/components/leads/leads-table'
import { createClient } from '@/lib/supabase/server'
import { Lead } from '@/types'

import { applyLeadFilter } from '@/lib/data-filters'

export default async function LeadsPage() {
  const supabase = await createClient()
  
  // Fetch user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const query = supabase.from('leads').select('*')
  const filteredQuery = applyLeadFilter(query, profile)
  
  const { data } = await filteredQuery.order('created_at', { ascending: false })
  const leads = ((data as Lead[] | null) ?? []) as Lead[]

  return (
    <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.02em' }}
            >
              Leads
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
              Danh sách khách hàng tiềm năng
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportLeadsButton />
            <NewLeadModal />
          </div>
        </div>

        {/* Table container */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <LeadsTable leads={leads} />
        </div>
      </div>
    </div>
  )
}