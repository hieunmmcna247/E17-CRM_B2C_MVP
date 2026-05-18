'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkflowTask, TASK_STATUS_LABELS } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { NewTaskModal } from '@/components/tasks/new-task-modal'
import { AssignTaskButton } from '@/components/tasks/assign-task-button'

import { applyTaskFilter } from '@/lib/data-filters'

export default function TasksPage() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const { profile } = useAuth()
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const query = supabase
      .from('tasks')
      .select('*, lead:leads(id, name, stage, course_interest), assignee:user_profiles(id, full_name, email)')
    
    const filteredQuery = applyTaskFilter(query, profile)
    
    const { data, error } = await filteredQuery.order('created_at', { ascending: false })

    if (error) {
      console.error('Lỗi khi tải nhiệm vụ:', error);
      setFetchError(error.message);
    } else {
      setFetchError(null);
    }
    
    if (data) {
      console.log('Dữ liệu tasks lấy được từ Supabase:', data);
      // Tạm thời tắt filter để debug
      /*
      let filteredData = data;
      if (profile?.role === 'sales' && profile.assigned_courses?.length) {
        filteredData = data.filter(task => {
          if (!task.lead) return task.assigned_to === profile.id;
          return profile.assigned_courses?.includes(task.lead.course_interest) || task.assigned_to === profile.id;
        });
      }
      */
      setTasks(data as unknown as WorkflowTask[])
    }
    setLoading(false)
  }, [supabase, profile])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  async function toggleTaskStatus(task: WorkflowTask) {
    const nextStatus: Record<string, string> = {
      todo: 'in_progress',
      in_progress: 'done',
      done: 'todo'
    }
    const newStatus = nextStatus[task.status] || 'todo'
    
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#22c55e'
      default: return '#94a3b8'
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 bg-[#0a0c10]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Nhiệm vụ</h1>
            <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest text-[10px] font-bold">Hệ thống điều phối công việc tư vấn</p>
          </div>
          <button 
            onClick={fetchTasks}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium mr-2"
          >
            Làm mới (Refresh)
          </button>
          <NewTaskModal onTaskCreated={fetchTasks} />
        </div>

        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
            <h3 className="font-bold">Lỗi truy vấn dữ liệu từ Supabase:</h3>
            <p>{fetchError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-[#0f1219] border border-white/[0.06] rounded-2xl p-20 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-2">Chưa có nhiệm vụ nào</h3>
            <p className="text-slate-500 text-sm">Bắt đầu tạo nhiệm vụ để theo dõi công việc của bạn.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['todo', 'in_progress', 'done'].map((status) => (
              <div key={status} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2 mb-2 border-b border-white/5 pb-3">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS]}
                  </h2>
                  <span className="bg-white/5 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-white/10 font-bold tabular-nums">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {tasks.filter(t => t.status === status).map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => toggleTaskStatus(task)}
                      className="bg-[#0f1219] border border-white/[0.06] hover:border-blue-500/30 rounded-2xl p-5 transition-all group cursor-pointer hover:translate-y-[-4px] shadow-xl hover:shadow-blue-900/10 relative"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span 
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                          style={{ backgroundColor: `${getPriorityColor(task.priority)}15`, color: getPriorityColor(task.priority), border: `1px solid ${getPriorityColor(task.priority)}30` }}
                        >
                          {task.priority}
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getPriorityColor(task.priority), boxShadow: `0 0 10px ${getPriorityColor(task.priority)}` }} />
                      </div>
                      
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
                        {task.due_date && (
                          <div className="text-right">
                             <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Hạn chót</p>
                             <p className="text-[10px] text-slate-400 font-bold">{new Date(task.due_date).toLocaleDateString('vi-VN')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
