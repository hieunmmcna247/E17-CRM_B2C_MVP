import { ExportLeadsButton } from '@/components/leads/export-leads-button'
import { ImportLeadsModal } from '@/components/leads/import-leads-modal'
import { NewLeadModal } from '@/components/leads/new-lead-modal'
import { LeadsTable } from '@/components/leads/leads-table'
import { createClient } from '@/lib/supabase/server'
import { Lead } from '@/types'

import { SearchFilterForm } from '@/components/shared/search-filter-form'
import { Pagination } from '@/components/shared/pagination'
import { STAGES, SOURCES } from '@/types'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  
  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const stage = typeof searchParams.stage === 'string' ? searchParams.stage : ''
  const source = typeof searchParams.source === 'string' ? searchParams.source : ''
  const course = typeof searchParams.course === 'string' ? searchParams.course : ''
  const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const PAGE_SIZE = 10
  
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase.from('leads').select('*', { count: 'exact' })
  
  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
  }
  if (stage) {
    query = query.eq('stage', stage)
  }
  if (source) {
    query = query.eq('source', source)
  }
  if (course) {
    query = query.ilike('course_interest', `%${course}%`)
  }

  // RLS tự filter theo role ở DB level — không cần applyLeadFilter ở đây
  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const leads = ((data as Lead[] | null) ?? []) as Lead[]
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0

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
            <ImportLeadsModal />
            <ExportLeadsButton />
            <NewLeadModal />
          </div>
        </div>

        {/* Filters and Search row */}
        <div className="mb-6">
          <SearchFilterForm
            searchTitle="Search"
            searchPlaceholder="Tên, SĐT, email..."
            filters={[
              {
                paramKey: 'stage',
                title: 'Stage',
                type: 'select',
                label: 'Tất cả Stage',
                options: STAGES.map((s) => ({ label: s, value: s })),
              },
              {
                paramKey: 'source',
                title: 'Nguồn',
                type: 'select',
                label: 'Tất cả Nguồn',
                options: SOURCES.map((s) => ({ label: s, value: s })),
              },
              {
                paramKey: 'course',
                title: 'Khóa học',
                type: 'text',
                placeholder: 'VD: IELTS...',
              },
            ]}
          />
        </div>

        {/* Table container */}
        <div
          className="rounded-xl overflow-hidden mb-4"
          style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <LeadsTable leads={leads} />
        </div>
        
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  )
}