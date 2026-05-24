'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { DROPPED_REASONS, Lead, SOURCES, STAGES, StageHistory } from '@/types'
import { NewLeadModal } from '@/components/leads/new-lead-modal'
import { LeadDetailModal } from '@/components/leads/lead-detail-modal'
import { useAuth } from '@/hooks/use-auth'
import { canTransition, getTransitionBlockReason } from '@/lib/workflow'
import { applyLeadFilter } from '@/lib/data-filters'

type Stage = (typeof STAGES)[number]

const COLUMN_COLORS: Record<Stage, string> = {
  New: '#3b82f6',
  Contacted: '#0ea5e9',
  Consulting: '#f59e0b',
  Trial: '#8b5cf6',
  Enrolled: '#10b981',
  Dropped: '#ef4444',
}

const SOURCE_COLORS: Record<(typeof SOURCES)[number], string> = {
  'Facebook Ads': '#1877f2',
  'Google Ads': '#ea4335',
  'Zalo': '#0068ff',
  'TikTok': '#ff0050',
  'Website': '#3b82f6',
  'Referral': '#8b5cf6',
  'Event': '#f59e0b',
  'Other': '#64748b',
}

function formatRelativeTime(dateString: string) {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = date - now
  const sec = Math.round(diffMs / 1000)
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(sec) >= secondsInUnit || unit === 'second') {
      return rtf.format(Math.round(sec / secondsInUnit), unit)
    }
  }
  return 'vua xong'
}

// Tinh so ngay con lai trong Trial (3 ngay ke tu khi chuyen vao Trial)
function getTrialDaysLeft(lead: Lead, stageHistory: StageHistory[]): number | null {
  if (lead.stage !== 'Trial') return null

  // Tim lan cuoi chuyen sang Trial
  const trialEntry = stageHistory
    .filter(h => h.lead_id === lead.id && h.new_stage === 'Trial')
    .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0]

  if (!trialEntry) return null

  const trialStart = new Date(trialEntry.changed_at).getTime()
  const now = Date.now()
  const diffDays = 3 - Math.floor((now - trialStart) / (1000 * 60 * 60 * 24))

  return diffDays
}

function StageColumn({ stage, count, children }: { stage: Stage; count: number; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage })
  const color = COLUMN_COLORS[stage]

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col h-full border-r border-white/5 last:border-r-0 transition-all duration-300"
      style={{
        width: 'calc(100% / 6)',
        minWidth: '150px',
        background: isOver ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}
    >
      <div style={{ height: '2px', width: '100%', backgroundColor: color }} />

      <div className="p-4 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white tracking-tight">{stage}</h3>
        <span
          className="h-5 w-7 flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {count}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-3 custom-scrollbar">
        {children}
      </div>
    </div>
  )
}

function LeadCard({
  lead,
  onCardClick,
  stageHistory,
}: {
  lead: Lead
  onCardClick: (lead: Lead) => void
  stageHistory: StageHistory[]
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id, data: { leadId: lead.id, stage: lead.stage } })

  const sourceColor = SOURCE_COLORS[lead.source] || '#64748b'
  const daysLeft = getTrialDaysLeft(lead, stageHistory)

  // Mau sac badge dem nguoc
  const trialColor =
    daysLeft === null ? null :
      daysLeft <= 0 ? '#ef4444' :
        daysLeft === 1 ? '#f97316' :
          '#eab308'

  const trialLabel =
    daysLeft === null ? null :
      daysLeft <= 0 ? 'Het han trial!' :
        daysLeft === 1 ? 'Con 1 ngay' :
          `Con ${daysLeft} ngay`

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        background: '#1a1f2e',
        border: lead.stage === 'Trial' && daysLeft !== null && daysLeft <= 1
          ? `1px solid ${trialColor}40`
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'grab',
      }}
      className="hover:border-white/20 transition-all group shadow-lg"
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onCardClick(lead)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
          {lead.name.charAt(0)}
        </div>
        <p className="text-sm font-bold text-slate-100 group-hover:text-white truncate">{lead.name}</p>
      </div>

      <div className="space-y-2">
        <div className="flex">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${sourceColor}20`, color: sourceColor }}
          >
            {lead.source}
          </span>
        </div>

        {lead.course_interest && (
          <p className="text-[11px] text-slate-500 font-medium truncate">{lead.course_interest}</p>
        )}

        {/* Badge dem nguoc Trial */}
        {trialLabel && trialColor && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ background: `${trialColor}15`, border: `1px solid ${trialColor}30` }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full animate-pulse flex-shrink-0"
              style={{ background: trialColor }}
            />
            <span className="text-[10px] font-bold" style={{ color: trialColor }}>
              {trialLabel}
            </span>
          </div>
        )}

        <p className="text-[10px] text-slate-600 font-medium">{formatRelativeTime(lead.created_at)}</p>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { role, profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [leads, setLeads] = useState<Lead[]>([])
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<{ leadId: string; oldStage: Stage; newStage: Stage } | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const activeLead = useMemo(() => leads.find(l => l.id === activeId) ?? null, [activeId, leads])
  const groupedLeads = useMemo(() => {
    const groups = {} as Record<Stage, Lead[]>
    STAGES.forEach(s => (groups[s] = []))
    leads.forEach(l => { if (groups[l.stage]) groups[l.stage].push(l) })
    return groups
  }, [leads])

  const fetchLeads = async () => {
    const query = supabase.from('leads').select('*')
    const filteredQuery = applyLeadFilter(query, profile)
    const { data } = await filteredQuery.order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])

    // Fetch stage_history chi lay cac ban ghi chuyen sang Trial
    const { data: historyData } = await supabase
      .from('stage_history')
      .select('*')
      .eq('new_stage', 'Trial')
      .order('changed_at', { ascending: false })
    if (historyData) setStageHistory(historyData as StageHistory[])

    setLoading(false)
  }

  useEffect(() => { void fetchLeads() }, [supabase])

  async function applyMove(leadId: string, oldStage: Stage, newStage: Stage, reason: string | null) {
    setSaving(true)
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l))
    
    try {
      const { error: updateError } = await supabase.from('leads').update({ stage: newStage }).eq('id', leadId)
      if (updateError) throw updateError

      const { data: { user } } = await supabase.auth.getUser()
      const { error: insertError } = await supabase.from('stage_history').insert({
        id: crypto.randomUUID(),
        lead_id: leadId,
        old_stage: oldStage,
        new_stage: newStage,
        changed_by: user?.id ?? null,
        reason,
      })

      if (insertError) throw insertError

      // Fetch lai stage_history sau khi insert thanh cong
      if (newStage === 'Trial') {
        const { data: historyData } = await supabase
          .from('stage_history')
          .select('*')
          .eq('new_stage', 'Trial')
          .order('changed_at', { ascending: false })
        if (historyData) setStageHistory(historyData as StageHistory[])
      }
    } catch (e: any) {
      void fetchLeads()
      setError(e instanceof Error ? e.message : e?.message || 'Co loi xay ra')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#0a0c10]">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Pipeline</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Keo tha lead giua cac giai doan tu van.</p>
        </div>
        <div className="flex items-center gap-4">
          {saving && <div className="text-xs font-bold text-blue-500 animate-pulse">Dang luu...</div>}
          <NewLeadModal onLeadCreated={fetchLeads} />
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl font-bold">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden px-4 pb-4">
        <div className="flex h-full items-stretch border border-white/5 rounded-2xl bg-[#0f1219]/50 overflow-hidden">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 border-r border-white/5 animate-pulse bg-white/[0.01]" />
            ))
          ) : (
            <DndContext
              onDragStart={e => setActiveId(String(e.active.id))}
              onDragEnd={e => {
                setActiveId(null)
                const leadId = String(e.active.id)
                const newStage = e.over?.id as Stage
                const lead = leads.find(l => l.id === leadId)
                if (!lead || !newStage || lead.stage === newStage) return
                if (!canTransition(role, lead.stage, newStage)) {
                  setError(getTransitionBlockReason(role, lead.stage, newStage))
                  setTimeout(() => setError(null), 3000)
                  return
                }
                if (newStage === 'Dropped') {
                  setPendingMove({ leadId, oldStage: lead.stage, newStage })
                  return
                }
                void applyMove(leadId, lead.stage, newStage, null)
              }}
            >
              {STAGES.map(stage => (
                <StageColumn key={stage} stage={stage} count={groupedLeads[stage].length}>
                  {groupedLeads[stage].map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onCardClick={setSelectedLead}
                      stageHistory={stageHistory}
                    />
                  ))}
                </StageColumn>
              ))}

              <DragOverlay>
                {activeLead ? (
                  <div className="w-[200px] p-4 rounded-xl bg-[#1a1f2e] border border-blue-500/50 shadow-2xl rotate-1">
                    <p className="text-sm font-bold text-white truncate">{activeLead.name}</p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* Dropped Reason Modal */}
      {pendingMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-6">Ly do that bai?</h2>
            <div className="space-y-2">
              {DROPPED_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => {
                    void applyMove(pendingMove.leadId, pendingMove.oldStage, pendingMove.newStage, r)
                    setPendingMove(null)
                  }}
                  className="w-full text-left p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm font-bold text-slate-300 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPendingMove(null)}
              className="mt-4 w-full text-center text-xs text-slate-500 hover:text-white transition-colors"
            >
              Huy bo
            </button>
          </div>
        </div>
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={() => { void fetchLeads(); setSelectedLead(null) }}
        />
      )}
    </div>
  )
}
