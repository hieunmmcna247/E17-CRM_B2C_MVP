'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkflowTask, UserProfile } from '@/types'

interface AssignTaskButtonProps {
  task: WorkflowTask
  profile: UserProfile
  onAssign: () => void
}

export function AssignTaskButton({ task, profile, onAssign }: AssignTaskButtonProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (profile?.role === 'admin' && isOpen && users.length === 0) {
      const fetchUsers = async () => {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .order('full_name')
        if (data) {
          setUsers(data as UserProfile[])
        }
      }
      void fetchUsers()
    }
  }, [profile?.role, isOpen, supabase, users.length])

  const handleAssign = async (userId: string, userName: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: userId, assigned_to_name: userName })
      .eq('id', task.id)
    
    setLoading(false)
    setIsOpen(false)
    
    if (!error) {
      onAssign()
    } else {
      console.error('Error assigning task:', error)
    }
  }

  const isAssigned = !!task.assigned_to

  if (profile?.role === 'sales') {
    if (isAssigned) return null
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          void handleAssign(profile.id, profile.full_name)
        }}
        disabled={loading}
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg"
      >
        {loading ? 'Đang nhận...' : 'Nhận nhiệm vụ'}
      </button>
    )
  }

  if (profile?.role === 'admin') {
    return (
      <div className={`absolute top-4 right-4 ${isAssigned ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} onClick={(e) => e.stopPropagation()}>
        {!isAssigned ? (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1"
            >
              Chỉ định
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 max-h-48 overflow-y-auto">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleAssign(u.id, u.full_name)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {u.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
             <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 p-1.5 rounded-md shadow-lg flex items-center justify-center transition-colors"
              title="Chỉ định lại"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 max-h-48 overflow-y-auto">
                {users.map(u => (
                   <button
                   key={u.id}
                   onClick={() => handleAssign(u.id, u.full_name)}
                   className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex justify-between items-center"
                 >
                   <span>{u.full_name}</span>
                   {task.assigned_to === u.id && (
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
                       <path d="M20 6L9 17l-5-5" />
                     </svg>
                   )}
                 </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
