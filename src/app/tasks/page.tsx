'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkflowTask, TASK_STATUS_LABELS, UserProfile } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { NewTaskModal } from '@/components/tasks/new-task-modal'
import { AssignTaskButton } from '@/components/tasks/assign-task-button'
import { applyTaskFilter } from '@/lib/data-filters'

type PopupType = 'approve' | 'revert_admin' | 'accept' | 'complete' | 'revert_sales' | 'delete' | 'info' | 'complete_admin' | null

export default function TasksPage() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [salesList, setSalesList] = useState<UserProfile[]>([])
  const [selectedSales, setSelectedSales] = useState<string[]>([])
  const [popup, setPopup] = useState<{ type: PopupType; task?: WorkflowTask; ids?: string[] } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showTrash, setShowTrash] = useState(false)
  const { profile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (profile?.role !== 'admin') return
    supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('role', 'sales')
      .then(({ data }) => { if (data) setSalesList(data as UserProfile[]) })
  }, [profile])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const query = supabase
      .from('tasks')
      .select('*, lead:leads(id, name, stage, course_interest, phone, email), assignee:user_profiles(id, full_name, email)')
      .is('deleted_at', null)
    const filteredQuery = applyTaskFilter(query, profile)
    const { data, error } = await filteredQuery.order('created_at', { ascending: false })
    if (error) { console.error(error); setFetchError(error.message) }
    else setFetchError(null)
    if (data) setTasks(data as unknown as WorkflowTask[])
    setLoading(false)
  }, [supabase, profile])

  useEffect(() => { void fetchTasks() }, [fetchTasks])

  const visibleTasks = selectedSales.length === 0
    ? tasks
    : tasks.filter(t => t.assigned_to && selectedSales.includes(t.assigned_to))

  // Toggle chọn 1 card
  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Chọn tất cả trong 1 cột
  function selectAll(status: string) {
    const ids = visibleTasks.filter(t => t.status === status).map(t => t.id)
    const alreadyAll = ids.every(id => selectedIds.includes(id))
    if (alreadyAll) setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    else setSelectedIds(prev => prev.concat(ids.filter(id => !prev.includes(id))))
  }

  function handleCardClick(task: WorkflowTask) {
    if (selectedIds.length > 0) {
      toggleSelect(task.id, { stopPropagation: () => {} } as any)
      return
    }
    if (profile?.role === 'admin') {
      if (task.status === 'pending_approval') setPopup({ type: 'approve', task })
      else if (task.status === 'done') setPopup({ type: 'revert_admin', task })
      else setPopup({ type: 'complete_admin', task })
      return
    }
    if (profile?.role === 'sales') {
      if (task.status === 'todo') setPopup({ type: 'accept', task })
      else if (task.status === 'in_progress') setPopup({ type: 'complete', task })
      else if (task.status === 'pending_approval') setPopup({ type: 'revert_sales', task })
      else setPopup({ type: 'info', task })
      return
    }
    setPopup({ type: 'info', task })
  }

  // Bulk action cho 1 cột
  function handleBulkAction(status: string) {
    const ids = visibleTasks
      .filter(t => t.status === status && selectedIds.includes(t.id))
      .map(t => t.id)
    if (!ids.length) return
    const type = getBulkType(status)
    if (type) setPopup({ type, ids })
  }

  function getBulkType(status: string): PopupType {
    if (profile?.role === 'admin') {
      if (status === 'todo' || status === 'in_progress') return 'complete_admin'
      if (status === 'pending_approval') return 'approve'
      if (status === 'done') return 'revert_admin'
    }
    if (profile?.role === 'sales') {
      if (status === 'todo') return 'accept'
      if (status === 'in_progress') return 'complete'
      if (status === 'pending_approval') return 'revert_sales'
    }
    return null
  }

  async function updateStatus(ids: string[], status: string) {
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: status as WorkflowTask['status'] } : t))
    await Promise.all(ids.map(id => supabase.from('tasks').update({ status }).eq('id', id)))
    setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    setPopup(null)
  }

  async function deleteTasks(ids: string[]) {
    const now = new Date().toISOString()
    setTasks(prev => prev.filter(t => !ids.includes(t.id)))
    await Promise.all(ids.map(id => supabase.from('tasks').update({ deleted_at: now }).eq('id', id)))
    setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    setPopup(null)
  }

  function getDueDateStatus(dueDate: string, isDone: boolean) {
    const due = new Date(dueDate)
    const now = new Date()
    // So sánh theo ngày, bỏ giờ
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    // diffDays < 0 = quá hạn, diffDays === 0 = hôm nay là ngày hạn (tính là quá hạn 1 ngày)
    if (diffDays <= 0) {
      const overdue = Math.abs(diffDays) === 0 ? 0 : Math.abs(diffDays)
      return { label: overdue === 0 ? 'Hết hạn hôm nay' : `Quá hạn ${overdue} ngày`, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' }
    }
    if (isDone) return { label: 'Đúng hạn', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' }
    return { label: `Còn ${diffDays} ngày`, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high':   return '#f97316'
      case 'medium': return '#eab308'
      case 'low':    return '#22c55e'
      default:       return '#94a3b8'
    }
  }

  const ADMIN_STATUSES  = ['todo', 'in_progress', 'pending_approval', 'done'] as const
  const SALES_STATUSES  = ['todo', 'in_progress', 'pending_approval', 'done'] as const
  const VIEWER_STATUSES = ['todo', 'in_progress', 'done'] as const
  const VISIBLE_STATUSES =
    profile?.role === 'admin' ? ADMIN_STATUSES :
    profile?.role === 'sales' ? SALES_STATUSES :
    VIEWER_STATUSES

  const COLUMN_STYLE: Record<string, { border: string; label: string }> = {
    todo:             { border: 'rgba(255,255,255,0.05)', label: '#64748b' },
    in_progress:      { border: 'rgba(59,130,246,0.2)',   label: '#3b82f6' },
    pending_approval: { border: 'rgba(234,179,8,0.25)',   label: '#eab308' },
    done:             { border: 'rgba(34,197,94,0.2)',    label: '#22c55e' },
  }

  function isClickable(_status: string) {
    return true
  }

  // Label cột todo khác nhau theo role
  function getColumnLabel(status: string) {
    if (status === 'todo' && profile?.role === 'admin') return 'Chưa nhận'
    return TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS]
  }

  const gridCols = profile?.role === 'admin' || profile?.role === 'sales' ? 'md:grid-cols-4' : 'md:grid-cols-3'

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 bg-[#0a0c10]">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Nhiệm vụ</h1>
            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Hệ thống điều phối công việc tư vấn</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (() => {
              // Tính bulk actions từ các ticket đang được chọn
              type BulkPopupType = Exclude<NonNullable<PopupType>, 'info'>
              const bulkActions: { type: BulkPopupType; ids: string[]; cfg: typeof POPUP_CONFIG[BulkPopupType] }[] = []
              const statusGroups = new Map<string, string[]>()
              selectedIds.forEach(id => {
                const task = tasks.find(t => t.id === id)
                if (task) {
                  const s = statusGroups.get(task.status) ?? []
                  s.push(id)
                  statusGroups.set(task.status, s)
                }
              })
              statusGroups.forEach((ids, status) => {
                const type = getBulkType(status)
                if (type && type !== 'info') bulkActions.push({ type: type as BulkPopupType, ids, cfg: POPUP_CONFIG[type as BulkPopupType] })
              })
              return (
                <div className="flex items-center gap-2">
                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => setPopup({ type: 'delete', ids: selectedIds })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                      Xóa ({selectedIds.length})
                    </button>
                  )}
                  {bulkActions.map(({ type, ids, cfg }) => (
                    <button
                      key={type}
                      onClick={() => setPopup({ type, ids })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all"
                      style={{ backgroundColor: cfg.btnColor, borderColor: cfg.iconColor + '50', color: cfg.iconColor }}
                    >
                      {cfg.btnText} ({ids.length})
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedIds([])}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/[0.04] transition-all"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Bỏ chọn ({selectedIds.length})
                  </button>
                </div>
              )
            })()}
            {profile?.role === 'admin' && salesList.length > 0 && (
              <SalesDropdown
                salesList={salesList}
                selectedSales={selectedSales}
                onToggle={id => setSelectedSales(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])}
                onSelectAll={() => setSelectedSales(salesList.map(s => s.id))}
                onClear={() => setSelectedSales([])}
                totalVisible={visibleTasks.length}
              />
            )}
            {profile?.role === 'admin' && (
              <button
                onClick={() => setShowTrash(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                title="Thùng rác"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Thùng rác
              </button>
            )}
            <button onClick={fetchTasks} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Làm mới
            </button>
            {profile?.role !== 'sales' && <NewTaskModal onTaskCreated={fetchTasks} />}
          </div>
        </div>

        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
            <h3 className="font-bold">Lỗi truy vấn dữ liệu từ Supabase:</h3>
            <p>{fetchError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
            {VISIBLE_STATUSES.map((status) => {
              const colStyle = COLUMN_STYLE[status]
              const colTasks = visibleTasks.filter(t => t.status === status)
              const colSelectedIds = colTasks.filter(t => selectedIds.includes(t.id)).map(t => t.id)
              const allSelected = colTasks.length > 0 && colTasks.every(t => selectedIds.includes(t.id))
              const bulkType = getBulkType(status)
              const showCheckbox = !!bulkType || profile?.role === 'admin'
              const clickable = isClickable(status)

              return (
                <div key={status} className="flex flex-col gap-3">
                  {/* Header cột */}
                  <div
                    className="group/header flex items-center justify-between px-3 py-2 rounded-xl border"
                    style={{ borderColor: colStyle.border, backgroundColor: colStyle.border }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Checkbox chọn tất cả — ẩn mặc định, hiện khi hover header */}
                      {colTasks.length > 0 && showCheckbox && (
                        <button
                          onClick={() => selectAll(status)}
                          className="h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                          style={allSelected
                            ? { backgroundColor: colStyle.label + '40', borderColor: colStyle.label, opacity: 1 }
                            : { backgroundColor: 'transparent', borderColor: colStyle.label + '50', opacity: colSelectedIds.length > 0 ? 1 : 0 }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => { if (!allSelected && colSelectedIds.length === 0) e.currentTarget.style.opacity = '0' }}
                        >
                          {allSelected && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={colStyle.label} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )}
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: colStyle.label }}>
                        {getColumnLabel(status)}
                      </h2>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums"
                      style={{ backgroundColor: colStyle.label + '20', color: colStyle.label, border: `1px solid ${colStyle.label}40` }}>
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/[0.04] p-8 text-center">
                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Trống</p>
                      </div>
                    ) : colTasks.map((task) => {
                      const isSelected = selectedIds.includes(task.id)
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleCardClick(task)}
                          className={`bg-[#0f1219] rounded-2xl p-5 transition-all group shadow-xl relative border ${
                            clickable || selectedIds.length > 0 ? 'cursor-pointer hover:translate-y-[-2px]' : 'cursor-default'
                          }`}
                          style={{
                            borderColor: isSelected
                              ? colStyle.label + '60'
                              : status === 'pending_approval' ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.06)',
                            backgroundColor: isSelected ? colStyle.label + '08' : undefined,
                          }}
                        >
                          {/* Checkbox — absolute góc trái trên */}
                          {showCheckbox && (
                            <button
                              onClick={(e) => toggleSelect(task.id, e)}
                              className="absolute top-[18px] left-4 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all z-10"
                              style={isSelected
                                ? { backgroundColor: colStyle.label + '40', borderColor: colStyle.label, opacity: 1 }
                                : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.2)', opacity: 0 }}
                              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.opacity = '1' }}
                              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.opacity = '0' }}
                            >
                              {isSelected && (
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={colStyle.label} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          )}

                          <div className="flex items-start justify-between mb-4">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md${showCheckbox ? ' ml-6' : ''}`}
                              style={{ backgroundColor: `${getPriorityColor(task.priority)}15`, color: getPriorityColor(task.priority), border: `1px solid ${getPriorityColor(task.priority)}30` }}
                            >
                              {task.priority}
                            </span>
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getPriorityColor(task.priority), boxShadow: `0 0 10px ${getPriorityColor(task.priority)}` }} />
                          </div>

                          {/* Nút xóa — chỉ admin, cùng hàng với nút bút */}
                          {profile?.role === 'admin' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPopup({ type: 'delete', task, ids: [task.id] }) }}
                              className="absolute top-4 right-[3.25rem] opacity-0 group-hover:opacity-100 transition-opacity h-[29px] w-[29px] rounded-md flex items-center justify-center hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 bg-slate-800"
                              title="Xóa ticket"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          )}

                          {profile && <AssignTaskButton task={task} profile={profile} onAssign={fetchTasks} />}

                          <h4 className="text-sm font-bold text-white/90 mb-3 group-hover:text-white transition-colors leading-relaxed">
                            {task.title}
                          </h4>

                          {task.lead && (
                            <div className="flex items-center gap-2 mb-4 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.05]">
                              <div className="h-5 w-5 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                              <span className="text-[11px] text-slate-400 font-bold truncate uppercase tracking-tight">{task.lead.name}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.03]">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                {task.assignee?.full_name?.charAt(0) || 'U'}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-none mb-1">Phụ trách</span>
                                <span className="text-[11px] text-slate-200 font-bold leading-none">
                                  {task.assignee?.full_name || (task as any).assigned_to_name || 'Chưa gán'}
                                </span>
                              </div>
                            </div>
                            {task.due_date && (() => {
                              const ds = getDueDateStatus(task.due_date, status === 'done')
                              return (
                                <div className="text-right">
                                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Hạn chót</p>
                                  <p className="text-[10px] text-slate-400 font-bold mb-1">{new Date(task.due_date).toLocaleDateString('vi-VN')}</p>
                                  <span
                                    className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                                    style={{ color: ds.color, backgroundColor: ds.bg, border: `1px solid ${ds.border}` }}
                                  >
                                    {ds.label}
                                  </span>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Popup */}
      {popup && (() => {
        const ids = popup.ids ?? (popup.task ? [popup.task.id] : [])
        const handleConfirm = () => {
          const { type } = popup
          if (type === 'approve')        updateStatus(ids, 'done')
          if (type === 'revert_admin')   updateStatus(ids, 'in_progress')
          if (type === 'complete_admin') updateStatus(ids, 'done')
          if (type === 'accept')         updateStatus(ids, 'in_progress')
          if (type === 'complete')       updateStatus(ids, 'pending_approval')
          if (type === 'revert_sales')   updateStatus(ids, 'in_progress')
          if (type === 'delete')         deleteTasks(ids)
        }
        // Single task click → show detail popup with contact info
        if (popup.task && !popup.ids) {
          return (
            <TaskDetailPopup
              task={popup.task}
              popupType={popup.type}
              onClose={() => setPopup(null)}
              onConfirm={handleConfirm}
            />
          )
        }
        // Bulk action → simple confirm popup
        return (
          <ConfirmPopup
            popup={popup}
            onClose={() => setPopup(null)}
            onConfirm={handleConfirm}
          />
        )
      })()}

      {/* Trash Panel */}
      {showTrash && (
        <TrashPanel onClose={() => setShowTrash(false)} onRestored={fetchTasks} />
      )}
    </div>
  )
}

// ── Task Detail Popup (single task, hiện thông tin liên lạc) ─────────────────
function TaskDetailPopup({ task, popupType, onClose, onConfirm }: {
  task: WorkflowTask
  popupType: PopupType
  onClose: () => void
  onConfirm: () => void
}) {
  type ActionType = Exclude<NonNullable<PopupType>, 'info'>
  const actionTypes: ActionType[] = ['approve', 'revert_admin', 'complete_admin', 'accept', 'complete', 'revert_sales', 'delete']
  const hasAction = popupType && actionTypes.includes(popupType as ActionType)
  const cfg = hasAction ? POPUP_CONFIG[popupType as ActionType] : null
  const [copied, setCopied] = useState<'phone' | 'email' | null>(null)

  function copyText(text: string, field: 'phone' | 'email') {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 1800)
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#ef4444'
      case 'high':   return '#f97316'
      case 'medium': return '#eab308'
      case 'low':    return '#22c55e'
      default:       return '#94a3b8'
    }
  }

  const PRIORITY_LABEL: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', urgent: 'Khẩn cấp' }
  const STAGE_LABEL: Record<string, string> = {
    New: 'Mới', Contacted: 'Đã liên hệ', Consulting: 'Tư vấn', Trial: 'Dùng thử', Enrolled: 'Đã đăng ký', Dropped: 'Đã rời'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0f1219] border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-2"
              style={{ backgroundColor: `${getPriorityColor(task.priority)}15`, color: getPriorityColor(task.priority), border: `1px solid ${getPriorityColor(task.priority)}30` }}
            >
              {PRIORITY_LABEL[task.priority] ?? task.priority}
            </span>
            <h3 className="text-white font-black text-sm leading-snug">{task.title}</h3>
            {task.description && (
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">{task.description}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors mt-0.5 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Thông tin liên lạc học viên */}
          {task.lead ? (
            <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.04] overflow-hidden">
              <div className="px-4 pt-3 pb-2 flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-black text-sm leading-none">{task.lead.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {task.lead.course_interest && (
                      <span className="text-[9px] font-bold text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                        {task.lead.course_interest}
                      </span>
                    )}
                    {task.lead.stage && (
                      <span className="text-[9px] font-bold text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded-md">
                        {STAGE_LABEL[task.lead.stage] ?? task.lead.stage}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone */}
              {task.lead.phone ? (
                <div className="flex items-center gap-2 mx-3 mb-2">
                  <a
                    href={`tel:${task.lead.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/25 hover:bg-green-500/20 transition-colors group/phone"
                  >
                    <div className="h-7 w-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.47 2 2 0 0 1 3.56 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest leading-none mb-0.5">Gọi điện</p>
                      <p className="text-sm font-black text-green-400 group-hover/phone:text-green-300 transition-colors">{task.lead.phone}</p>
                    </div>
                  </a>
                  <button
                    onClick={e => { e.stopPropagation(); copyText(task.lead!.phone!, 'phone') }}
                    className="h-[46px] w-[42px] rounded-xl border flex items-center justify-center flex-shrink-0 transition-all"
                    style={copied === 'phone'
                      ? { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.35)' }
                      : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                    title="Copy số điện thoại"
                  >
                    {copied === 'phone' ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.47 2 2 0 0 1 3.56 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span className="text-[10px] text-slate-600 font-bold italic">Chưa có số điện thoại</span>
                </div>
              )}

              {/* Email */}
              {task.lead.email ? (
                <div className="flex items-center gap-2 mx-3 mb-3">
                  <a
                    href={`mailto:${task.lead.email}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors group/email min-w-0"
                  >
                    <div className="h-6 w-6 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 group-hover/email:text-slate-200 transition-colors truncate">{task.lead.email}</span>
                  </a>
                  <button
                    onClick={e => { e.stopPropagation(); copyText(task.lead!.email!, 'email') }}
                    className="h-[34px] w-[34px] rounded-xl border flex items-center justify-center flex-shrink-0 transition-all"
                    style={copied === 'email'
                      ? { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.35)' }
                      : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                    title="Copy email"
                  >
                    {copied === 'email' ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mx-3 mb-3 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] text-slate-700 font-bold italic">Chưa có email</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-center">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Không có học viên liên kết</p>
            </div>
          )}

          {/* Hạn chót */}
          {task.due_date && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Hạn chót</span>
              <span className="text-[11px] font-bold text-slate-400">{new Date(task.due_date).toLocaleDateString('vi-VN')}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-bold hover:bg-white/[0.04] transition-all"
          >
            {cfg ? 'Huỷ' : 'Đóng'}
          </button>
          {cfg && (
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-black transition-all"
              style={{ backgroundColor: cfg.btnColor, borderColor: cfg.iconColor + '50', color: cfg.iconColor }}
            >
              {cfg.btnText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Popup config ──────────────────────────────────────────────────────────────
const POPUP_CONFIG: Record<Exclude<NonNullable<PopupType>, 'info'>, {
  icon: string; iconBg: string; iconColor: string
  title: (count: number) => string; desc: string
  btnColor: string; btnText: string
}> = {
  approve: {
    icon: 'M20 6 9 17 4 12', iconBg: 'rgba(34,197,94,0.1)', iconColor: '#22c55e',
    title: n => n > 1 ? `Duyệt ${n} ticket?` : 'Duyệt hoàn thành?',
    desc: 'Ticket sẽ chuyển sang cột Hoàn thành.',
    btnColor: 'rgba(34,197,94,0.2)', btnText: 'Xác nhận duyệt',
  },
  revert_admin: {
    icon: 'M1 4v6h6M3.51 15a9 9 0 1 0 .49-4.5', iconBg: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6',
    title: n => n > 1 ? `Đưa ${n} ticket về Đang làm?` : 'Đưa về Đang làm?',
    desc: 'Ticket sẽ chuyển từ Hoàn thành về Đang làm.',
    btnColor: 'rgba(59,130,246,0.2)', btnText: 'Xác nhận',
  },
  accept: {
    icon: 'M9 11l3 3L22 4', iconBg: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6',
    title: n => n > 1 ? `Nhận ${n} công việc?` : 'Nhận công việc?',
    desc: 'Ticket sẽ chuyển sang cột Đang làm.',
    btnColor: 'rgba(59,130,246,0.2)', btnText: 'Nhận việc',
  },
  complete: {
    icon: 'M20 6 9 17 4 12', iconBg: 'rgba(234,179,8,0.1)', iconColor: '#eab308',
    title: n => n > 1 ? `Nộp ${n} ticket chờ duyệt?` : 'Nộp chờ duyệt?',
    desc: 'Ticket sẽ chuyển sang cột Chờ duyệt.',
    btnColor: 'rgba(234,179,8,0.2)', btnText: 'Xác nhận nộp',
  },
  revert_sales: {
    icon: 'M1 4v6h6M3.51 15a9 9 0 1 0 .49-4.5', iconBg: 'rgba(239,68,68,0.1)', iconColor: '#ef4444',
    title: n => n > 1 ? `Rút lại ${n} ticket?` : 'Rút lại công việc?',
    desc: 'Ticket sẽ chuyển từ Chờ duyệt về Đang làm.',
    btnColor: 'rgba(239,68,68,0.2)', btnText: 'Rút lại',
  },
  delete: {
    icon: 'M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2',
    iconBg: 'rgba(239,68,68,0.1)', iconColor: '#ef4444',
    title: n => n > 1 ? `Xóa ${n} ticket?` : 'Xóa ticket này?',
    desc: 'Hành động này không thể hoàn tác.',
    btnColor: 'rgba(239,68,68,0.2)', btnText: 'Xóa',
  },
  complete_admin: {
    icon: 'M20 6 9 17 4 12',
    iconBg: 'rgba(34,197,94,0.1)', iconColor: '#22c55e',
    title: n => n > 1 ? `Hoàn thành ${n} ticket?` : 'Hoàn thành ngay?',
    desc: 'Ticket sẽ chuyển thẳng sang cột Hoàn thành.',
    btnColor: 'rgba(34,197,94,0.2)', btnText: 'Hoàn thành ngay',
  },
}

function ConfirmPopup({ popup, onClose, onConfirm }: {
  popup: { type: PopupType; task?: WorkflowTask; ids?: string[] }
  onClose: () => void
  onConfirm: () => void
}) {
  if (!popup.type || popup.type === 'info') return null
  const cfg = POPUP_CONFIG[popup.type as Exclude<NonNullable<PopupType>, 'info'>]
  const count = popup.ids?.length ?? 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0f1219] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center border"
            style={{ backgroundColor: cfg.iconBg, borderColor: cfg.iconColor + '40' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={cfg.icon} />
            </svg>
          </div>
        </div>
        <h3 className="text-white font-black text-center text-base mb-1">{cfg.title(count)}</h3>
        {count === 1 && popup.task && (
          <p className="text-slate-500 text-sm text-center mb-1">
            <span className="text-white/80 font-bold">{popup.task.title}</span>
          </p>
        )}
        {count > 1 && (
          <p className="text-slate-500 text-sm text-center mb-1">
            <span className="text-white/80 font-bold">{count} ticket được chọn</span>
          </p>
        )}
        <p className="text-slate-600 text-xs text-center mb-6">{cfg.desc}</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-bold hover:bg-white/[0.04] transition-all">
            Huỷ
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-black transition-all"
            style={{ backgroundColor: cfg.btnColor, borderColor: cfg.iconColor + '50', color: cfg.iconColor }}>
            {cfg.btnText}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Dropdown lọc Sales ────────────────────────────────────────────────────────
function SalesDropdown({ salesList, selectedSales, onToggle, onSelectAll, onClear, totalVisible }: {
  salesList: UserProfile[]
  selectedSales: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
  totalVisible: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const label = selectedSales.length === 0 ? 'Tất cả Sales'
    : selectedSales.length === 1 ? salesList.find(s => s.id === selectedSales[0])?.full_name ?? '1 sales'
    : `${selectedSales.length} sales`

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all"
        style={{
          backgroundColor: selectedSales.length > 0 ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
          borderColor: selectedSales.length > 0 ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)',
          color: selectedSales.length > 0 ? '#60a5fa' : '#94a3b8',
        }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-[#0f1219] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sales</span>
            <div className="flex gap-2">
              <button onClick={onSelectAll} className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase">Tất cả</button>
              <span className="text-slate-700">·</span>
              <button onClick={onClear} className="text-[9px] text-slate-500 hover:text-slate-300 font-bold uppercase">Bỏ</button>
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {salesList.map(s => {
              const active = selectedSales.includes(s.id)
              return (
                <button key={s.id} onClick={() => onToggle(s.id)} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors">
                  <div className="h-4 w-4 rounded flex items-center justify-center border flex-shrink-0"
                    style={active ? { backgroundColor: 'rgba(59,130,246,0.3)', borderColor: '#3b82f6' } : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.12)' }}>
                    {active && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <span className="h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-black flex-shrink-0"
                    style={{ backgroundColor: active ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)', color: active ? '#60a5fa' : '#64748b' }}>
                    {s.full_name?.charAt(0) ?? '?'}
                  </span>
                  <span className="text-xs font-medium truncate" style={{ color: active ? '#e2e8f0' : '#64748b' }}>{s.full_name}</span>
                </button>
              )
            })}
          </div>
          {selectedSales.length > 0 && (
            <div className="px-3 py-2 border-t border-white/[0.06]">
              <span className="text-[9px] text-slate-600">{totalVisible} nhiệm vụ</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Trash Panel ───────────────────────────────────────────────────────────────
function TrashPanel({ onClose, onRestored }: { onClose: () => void; onRestored: () => void }) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailTask, setDetailTask] = useState<WorkflowTask | null>(null)
  const [confirmAction, setConfirmAction] = useState<'restore' | 'permanent' | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, lead:leads(id, name, stage, course_interest, phone, email), assignee:user_profiles(id, full_name, email)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    if (data) setTasks(data as unknown as WorkflowTask[])
    setLoading(false)
  }

  async function restore(ids: string[]) {
    setTasks(prev => prev.filter(t => !ids.includes(t.id)))
    await Promise.all(ids.map(id => supabase.from('tasks').update({ deleted_at: null }).eq('id', id)))
    setSelectedIds([])
    setConfirmAction(null)
    onRestored()
  }

  async function permanentDelete(ids: string[]) {
    setTasks(prev => prev.filter(t => !ids.includes(t.id)))
    await Promise.all(ids.map(id => supabase.from('tasks').delete().eq('id', id)))
    setSelectedIds([])
    setConfirmAction(null)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const allSelected = tasks.length > 0 && tasks.every(t => selectedIds.includes(t.id))

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#ef4444'
      case 'high':   return '#f97316'
      case 'medium': return '#eab308'
      case 'low':    return '#22c55e'
      default:       return '#94a3b8'
    }
  }

  const actionIds = selectedIds.length > 0 ? selectedIds : []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-2xl bg-[#0d1017] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </div>
            <div>
              <h2 className="text-white font-black text-sm">Thùng rác</h2>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{tasks.length} ticket đã xóa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={() => setConfirmAction('restore')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                  </svg>
                  Khôi phục ({selectedIds.length})
                </button>
                <button
                  onClick={() => setConfirmAction('permanent')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                  Xóa vĩnh viễn ({selectedIds.length})
                </button>
                <button onClick={() => setSelectedIds([])} className="text-slate-500 hover:text-white text-xs font-bold px-2 py-1.5">
                  Bỏ chọn
                </button>
              </>
            )}
            <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors ml-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Select all bar */}
        {tasks.length > 0 && (
          <div className="px-5 py-2.5 border-b border-white/[0.04] flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setSelectedIds(allSelected ? [] : tasks.map(t => t.id))}
              className="h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
              style={allSelected
                ? { backgroundColor: 'rgba(239,68,68,0.3)', borderColor: '#ef4444' }
                : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.15)' }}
            >
              {allSelected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              {selectedIds.length === 0 ? 'Chọn tất cả' : `Đã chọn ${selectedIds.length}/${tasks.length}`}
            </span>
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                </svg>
              </div>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Thùng rác trống</p>
            </div>
          ) : tasks.map(task => {
            const isSelected = selectedIds.includes(task.id)
            const pc = getPriorityColor(task.priority)
            return (
              <div
                key={task.id}
                className="group flex items-center gap-3 bg-[#0f1219] rounded-xl border px-4 py-3 transition-all"
                style={{ borderColor: isSelected ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)', backgroundColor: isSelected ? 'rgba(239,68,68,0.04)' : undefined }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(task.id)}
                  className="h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                  style={isSelected
                    ? { backgroundColor: 'rgba(239,68,68,0.3)', borderColor: '#ef4444' }
                    : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  {isSelected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>

                {/* Info — click to view detail */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailTask(task)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md"
                      style={{ color: pc, backgroundColor: pc + '15', border: `1px solid ${pc}25` }}>
                      {task.priority}
                    </span>
                    <span className="text-xs font-bold text-white/80 truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {task.lead && (
                      <span className="text-[10px] text-slate-500 font-bold truncate">
                        👤 {task.lead.name}{task.lead.phone ? ` · ${task.lead.phone}` : ''}
                      </span>
                    )}
                    {task.deleted_at && (
                      <span className="text-[9px] text-slate-700 font-bold flex-shrink-0">
                        Xóa {new Date(task.deleted_at).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Restore button */}
                <button
                  onClick={() => restore([task.id])}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-green-500/25 bg-green-500/10 text-green-400 text-[10px] font-black hover:bg-green-500/20 transition-all flex-shrink-0"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                  </svg>
                  Khôi phục
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail popup when clicking a trash item */}
      {detailTask && (
        <TaskDetailPopup
          task={detailTask}
          popupType="info"
          onClose={() => setDetailTask(null)}
          onConfirm={() => setDetailTask(null)}
        />
      )}

      {/* Confirm bulk action */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#0f1219] border border-white/[0.08] rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="text-white font-black text-center text-base mb-1">
              {confirmAction === 'restore' ? `Khôi phục ${actionIds.length} ticket?` : `Xóa vĩnh viễn ${actionIds.length} ticket?`}
            </h3>
            <p className="text-slate-600 text-xs text-center mb-5">
              {confirmAction === 'restore' ? 'Ticket sẽ trở lại danh sách nhiệm vụ.' : 'Hành động này không thể hoàn tác.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-bold hover:bg-white/[0.04] transition-all">
                Huỷ
              </button>
              <button
                onClick={() => confirmAction === 'restore' ? restore(actionIds) : permanentDelete(actionIds)}
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-black transition-all"
                style={confirmAction === 'restore'
                  ? { backgroundColor: 'rgba(34,197,94,0.2)', borderColor: 'rgba(34,197,94,0.4)', color: '#22c55e' }
                  : { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
              >
                {confirmAction === 'restore' ? 'Khôi phục' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
