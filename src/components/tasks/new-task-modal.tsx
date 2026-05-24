'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { applyLeadFilter } from '@/lib/data-filters'
import { useAuth } from '@/hooks/use-auth'
import { ROLE_LABELS } from '@/types'

export function NewTaskModal({ onTaskCreated }: { onTaskCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [leadId, setLeadId] = useState('')
  const [assignedToName, setAssignedToName] = useState('') // Tự điền tên
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')

  const [leads, setLeads] = useState<any[]>([])
  const [staffs, setStaffs] = useState<any[]>([])
  const [leadSearch, setLeadSearch] = useState('')
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false)
  const leadBoxRef = useRef<HTMLDivElement>(null)
  const { profile } = useAuth()

  const supabase = createClient()

  useEffect(() => {
    if (open) {
      void loadData()
    }
  }, [open])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (leadBoxRef.current && !leadBoxRef.current.contains(e.target as Node)) {
        setLeadDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter lead theo tên hoặc SĐT
  const filteredLeads = leads.filter(l => {
    const q = leadSearch.toLowerCase()
    if (!q) return true
    return (
      l.name?.toLowerCase().includes(q) ||
      (l.phone && l.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')))
    )
  })

  const selectedLead = leads.find(l => l.id === leadId)

  async function loadData() {
    const query = supabase.from('leads').select('id, name, phone, course_interest')
    const filteredQuery = applyLeadFilter(query, profile)
    const { data: leadsData } = await filteredQuery.order('name')

    const { data: staffsData } = await supabase.from('user_profiles').select('id, full_name, email, role').order('role', { ascending: true })
    if (leadsData) setLeads(leadsData as any)
    if (staffsData) setStaffs(staffsData as any)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    // Tìm xem tên nhập vào có khớp với ID nào không (để giữ data integrity nếu có thể)
    const matchedStaff = staffs.find(s => s.full_name === assignedToName || s.email === assignedToName)

    try {
      const { error } = await supabase.from('tasks').insert({
        title: title.trim(),
        description: description.trim() || null,
        lead_id: leadId || null,
        assigned_to: matchedStaff?.id || null,
        assigned_to_name: assignedToName.trim() || null,
        priority,
        due_date: dueDate || null,
        status: 'todo',
      })

      setLoading(false)
      if (error) {
        alert('Lỗi khi lưu: ' + error.message + '\n\nLưu ý: Hãy đảm bảo bạn đã chạy câu lệnh SQL thêm cột assigned_to_name trong Supabase.');
        console.error(error);
        return;
      }

      setOpen(false)
      setTitle(''); setDescription(''); setLeadId(''); setLeadSearch(''); setAssignedToName(''); setPriority('medium'); setDueDate('')
      onTaskCreated()
    } catch (err: any) {
      setLoading(false)
      alert('Lỗi hệ thống: ' + err.message);
    }
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-600/10 transition-all"
    >
      + Thêm nhiệm vụ
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0f1219] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Thêm nhiệm vụ mới</h2>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tiêu đề *</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#161b27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              placeholder="VD: Gọi điện tư vấn khóa IELTS"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Gọi điện tư vấn IELTS',
                'Gọi điện tư vấn TOEIC',
                'Gọi điện tư vấn DA',
                'Gọi điện tư vấn DE',
                'Gọi điện tư vấn AI',
                'Gọi điện tư vấn DS',
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all"
                  style={
                    title === preset
                      ? { backgroundColor: 'rgba(59,130,246,0.2)', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.4)' }
                      : { backgroundColor: 'rgba(255,255,255,0.04)', color: '#64748b', borderColor: 'rgba(255,255,255,0.08)' }
                  }
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mô tả</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#161b27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 min-h-[100px]"
              placeholder="Chi tiết nội dung cần làm..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Học viên liên quan</label>
              <div ref={leadBoxRef} className="relative">
                {/* Trigger button */}
                <button
                  type="button"
                  onClick={() => { setLeadDropdownOpen(v => !v); setLeadSearch('') }}
                  className="w-full bg-[#161b27] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-left focus:outline-none focus:border-blue-500/50 flex items-center justify-between gap-2 transition-colors hover:border-white/20"
                >
                  {selectedLead ? (
                    <span className="text-white truncate">
                      {selectedLead.name}
                      {selectedLead.phone && <span className="text-slate-500 ml-1.5 text-xs">({selectedLead.phone})</span>}
                    </span>
                  ) : (
                    <span className="text-slate-600">-- Chọn học viên --</span>
                  )}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round"
                    className={`flex-shrink-0 transition-transform ${leadDropdownOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown */}
                {leadDropdownOpen && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-[#161b27] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    style={{ maxHeight: '260px', display: 'flex', flexDirection: 'column' }}>
                    {/* Search input */}
                    <div className="px-2.5 py-2 border-b border-white/[0.06] flex items-center gap-2 flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        autoFocus
                        type="text"
                        value={leadSearch}
                        onChange={e => setLeadSearch(e.target.value)}
                        placeholder="Tìm tên hoặc số điện thoại..."
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                      {leadSearch && (
                        <button type="button" onClick={() => setLeadSearch('')} className="text-slate-600 hover:text-slate-400">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto flex-1">
                      {/* Tuỳ chọn trống */}
                      <button
                        type="button"
                        onClick={() => { setLeadId(''); setLeadDropdownOpen(false) }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.04] ${!leadId ? 'text-blue-400 font-bold' : 'text-slate-600 italic'}`}
                      >
                        -- Không chọn --
                      </button>

                      {filteredLeads.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-slate-600 italic text-center">Không tìm thấy học viên nào</p>
                      ) : (
                        filteredLeads.map(l => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => { setLeadId(l.id); setLeadDropdownOpen(false); setLeadSearch('') }}
                            className={`w-full px-3 py-2 text-left transition-colors hover:bg-white/[0.04] flex items-baseline justify-between gap-2
                              ${leadId === l.id ? 'bg-blue-500/10' : ''}`}
                          >
                            <span className={`text-sm font-bold truncate ${leadId === l.id ? 'text-blue-300' : 'text-white'}`}>
                              {l.name}
                            </span>
                            {l.phone && (
                              <span className="text-[11px] text-slate-500 flex-shrink-0 font-mono">{l.phone}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Footer: đang hiển thị bao nhiêu */}
                    {leads.length > 0 && (
                      <div className="px-3 py-1.5 border-t border-white/[0.05] flex-shrink-0">
                        <p className="text-[9px] text-slate-700 font-bold">
                          {filteredLeads.length}/{leads.length} học viên
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Người phụ trách</label>
              <input
                list="staff-list"
                value={assignedToName}
                onChange={e => setAssignedToName(e.target.value)}
                placeholder="Gõ tên hoặc chọn..."
                className="w-full bg-[#161b27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
              <datalist id="staff-list">
                {staffs.map((s, idx) => {
                  const role = ROLE_LABELS[s.role as keyof typeof ROLE_LABELS] ?? s.role;
                  const name = (s.full_name && s.full_name !== 'User') ? s.full_name : s.email;
                  return <option key={s.id} value={name}>{idx + 1}. {role} - {name}</option>
                })}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-[#161b27] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="low" className="bg-[#161b27] text-white">Thấp</option>
                <option value="medium" className="bg-[#161b27] text-white">Trung bình</option>
                <option value="high" className="bg-[#161b27] text-white">Cao</option>
                <option value="urgent" className="bg-[#161b27] text-white">Khẩn cấp</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Hạn chót</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[#161b27] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-6 py-2.5 text-sm font-semibold text-slate-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-blue-900/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Đang tạo...' : 'Tạo nhiệm vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
