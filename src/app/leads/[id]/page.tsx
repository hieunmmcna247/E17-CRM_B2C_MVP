import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AddInteractionForm } from '@/components/leads/add-interaction-form'
import { LeadStageTimeline } from '@/components/leads/lead-stage-timeline'
import { ReactivateButton } from '@/components/leads/reactivate-button'
import { RealtimeSubscriber } from '@/components/shared/realtime-subscriber'
import { createClient } from '@/lib/supabase/server'
import { Interaction, Lead, StageHistory } from '@/types'

const STAGE_STYLE: Record<string, { bg: string; color: string }> = {
  New: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  Contacted: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  Consulting: { bg: 'rgba(234,179,8,0.15)', color: '#fbbf24' },
  Trial: { bg: 'rgba(129,140,248,0.15)', color: '#818cf8' },
  Enrolled: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  Dropped: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(dateString))
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#475569' }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: '#e2e8f0' }}>{value}</p>
    </div>
  )
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [
    { data: leadData, error: leadError },
    { data: interactionData, error: interactionError },
    { data: historyData }
  ] = await Promise.all([
      supabase.from('leads').select('*').eq('id', params.id).single(),
      supabase.from('interactions').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }),
      supabase.from('stage_history').select('*').eq('lead_id', params.id).order('changed_at', { ascending: true }),
    ])

  // RLS tự kiểm quyền — nếu không có data thì trả 404
  if (leadError || !leadData) notFound()

  const lead = leadData as Lead
  const interactions = (interactionData as Interaction[] | null) ?? []
  const history = (historyData as StageHistory[] | null) ?? []
  const stageBadge = STAGE_STYLE[lead.stage] ?? STAGE_STYLE['New']

  type ActivityItem =
    | { type: 'interaction'; data: Interaction; date: Date }
    | { type: 'stage_change'; data: StageHistory; date: Date }

  const activities: ActivityItem[] = [
    ...interactions.map(i => ({ type: 'interaction' as const, data: i, date: new Date(i.created_at) })),
    ...history.map(h => ({ type: 'stage_change' as const, data: h, date: new Date(h.changed_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
      <RealtimeSubscriber leadId={lead.id} />
      <div className="mx-auto max-w-4xl space-y-5">

        {/* Back button */}
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: '#475569' }}
        >
          ← Quay lai danh sach
        </Link>

        {/* Lead info card */}
        <section
          className="rounded-xl p-5"
          style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Card header */}
          <div className="flex items-start justify-between mb-5 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: 'var(--font-syne)' }}
                >
                  {lead.name}
                </h1>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{lead.email || 'Chua co email'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: stageBadge.bg, color: stageBadge.color }}
              >
                {lead.stage}
              </span>
              {lead.stage === 'Dropped' && <ReactivateButton lead={lead} />}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="So dien thoai" value={lead.phone || '—'} />
            <InfoRow label="Khoa hoc" value={lead.course_interest || '—'} />
            <InfoRow label="Nguon" value={lead.source} />
            <InfoRow label="Ngay tao" value={formatDate(lead.created_at)} />
            <InfoRow label="Cap nhat" value={formatDate(lead.updated_at)} />
            <InfoRow label="ID" value={lead.id.slice(0, 8) + '...'} />
          </div>
        </section>

        {/* Timeline Stepper */}
        <section
          className="rounded-xl p-5"
          style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            className="text-base font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Hành trình khách hàng
          </h2>
          <LeadStageTimeline lead={lead} history={history} />
        </section>

        {/* Activity */}
        <section
          className="rounded-xl p-5"
          style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            className="text-base font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Timeline / Activity
          </h2>

          {/* Add note form */}
          <AddInteractionForm leadId={lead.id} />

          {/* Error */}
          {interactionError && (
            <div
              className="mt-3 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              {interactionError.message}
            </div>
          )}

          {/* Interaction list */}
          <div className="mt-4 space-y-3">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <span className="text-2xl">💬</span>
                <p className="text-sm" style={{ color: '#475569' }}>Chua co hoat dong nao.</p>
              </div>
            ) : (
              activities.map((item) => {
                if (item.type === 'interaction') {
                  const interaction = item.data
                  return (
                    <article
                      key={`int-${interaction.id}`}
                      className="rounded-lg p-3"
                      style={{
                        background: '#161b27',
                        borderLeft: '2px solid rgba(59,130,246,0.3)',
                      }}
                    >
                      <p className="whitespace-pre-wrap text-sm" style={{ color: '#e2e8f0' }}>
                        {interaction.note}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                        <span>{formatDate(interaction.created_at)}</span>
                        {interaction.created_by && (
                          <>
                            <span>•</span>
                            <span>{interaction.created_by}</span>
                          </>
                        )}
                      </div>
                    </article>
                  )
                } else {
                  const h = item.data
                  return (
                    <article
                      key={`hist-${h.id}`}
                      className="rounded-lg p-3"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderLeft: '2px solid rgba(168,85,247,0.4)',
                      }}
                    >
                      <p className="text-sm" style={{ color: '#e2e8f0' }}>
                        Đã chuyển từ <span className="font-bold text-slate-400">{h.old_stage}</span> sang{' '}
                        <span className="font-bold text-white">{h.new_stage}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                        <span>{formatDate(h.changed_at)}</span>
                        {h.reason && (
                          <>
                            <span>•</span>
                            <span className="italic text-red-400">Lý do: {h.reason}</span>
                          </>
                        )}
                      </div>
                    </article>
                  )
                }
              })
            )}
          </div>
        </section>

      </div>
    </div>
  )
}