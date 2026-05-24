'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, UserRole, ROLE_LABELS, ROLE_COLORS } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { RoleBadge } from '@/components/auth/role-badge'

// ── Modal tạo tài khoản ───────────────────────────────────────
function CreateUserModal({ onCreated, onClose }: { onCreated: (u: UserProfile) => void; onClose: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('sales')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Đã có lỗi xảy ra')
        return
      }

      onCreated({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role,
        assigned_courses: [],
        avatar_url: null,
        created_at: new Date().toISOString(),
      })
    } catch {
      setError('Không thể kết nối server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0f1219] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-white font-black text-base">Tạo tài khoản mới</h2>
            <p className="text-slate-500 text-xs mt-0.5">Thêm thành viên vào hệ thống CRM</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Họ tên */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              placeholder="Nguyễn Văn A"
              className="w-full bg-[#161b27] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="email@congty.com"
              className="w-full bg-[#161b27] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full bg-[#161b27] border border-white/[0.08] rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Vai trò */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ROLE_LABELS) as [UserRole, string][])
                .filter(([r]) => r !== 'admin') // Không cho tạo tài khoản admin qua form
                .map(([r, label]) => {
                  const colors = ROLE_COLORS[r]
                  const active = role === r
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left"
                      style={active
                        ? { backgroundColor: colors.bg, borderColor: colors.border, color: colors.color }
                        : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#475569' }
                      }
                    >
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: active ? colors.color : '#334155' }} />
                      {label}
                    </button>
                  )
                })}
            </div>
          </div>

          {/* Lỗi */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-bold hover:bg-white/[0.04] transition-all"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa' }}
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tạo tài khoản
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Settings Page ─────────────────────────────────────────────
export default function SettingsPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [savingNameId, setSavingNameId] = useState<string | null>(null)
  const { profile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setUsers(data as UserProfile[])
      }
      setLoading(false)
    }

    fetchUsers()
  }, [supabase])

  const updateRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }
  }

  function startEditName(u: UserProfile) {
    setEditingNameId(u.id)
    setEditingNameValue(u.full_name ?? '')
  }

  async function saveEditName(userId: string) {
    const trimmed = editingNameValue.trim()
    if (!trimmed) { setEditingNameId(null); return }
    setSavingNameId(userId)
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: trimmed })
      .eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, full_name: trimmed } : u))
      setSuccessMsg(`Đã cập nhật tên thành công!`)
      setTimeout(() => setSuccessMsg(null), 3000)
    }
    setSavingNameId(null)
    setEditingNameId(null)
  }

  function handleNameKeyDown(e: React.KeyboardEvent, userId: string) {
    if (e.key === 'Enter') saveEditName(userId)
    if (e.key === 'Escape') setEditingNameId(null)
  }

  function handleCreated(newUser: UserProfile) {
    setUsers(prev => [newUser, ...prev])
    setShowCreateModal(false)
    setSuccessMsg(`Đã tạo tài khoản "${newUser.full_name}" thành công!`)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 bg-[#0a0c10]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>Cài đặt hệ thống</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý người dùng và phân quyền truy cập</p>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm text-green-400 font-medium">{successMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* User Management Section */}
          <section className="bg-[#0f1219] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Danh sách thành viên</h2>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                  {users.length} THÀNH VIÊN
                </span>
              </div>
              {profile?.role === 'admin' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all"
                  style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tạo tài khoản
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/[0.04]">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Người dùng</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vai trò</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500 text-sm">Đang tải dữ liệu...</td>
                    </tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group/row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {(editingNameId === u.id ? editingNameValue : u.full_name)?.charAt(0) || '?'}
                          </div>

                          {editingNameId === u.id ? (
                            /* ── Inline edit mode ── */
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={editingNameValue}
                                onChange={e => setEditingNameValue(e.target.value)}
                                onKeyDown={e => handleNameKeyDown(e, u.id)}
                                onBlur={() => saveEditName(u.id)}
                                className="bg-[#161b27] border border-blue-500/50 rounded-lg px-2.5 py-1 text-sm text-white font-bold focus:outline-none w-40"
                              />
                              {savingNameId === u.id && (
                                <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin flex-shrink-0" />
                              )}
                            </div>
                          ) : (
                            /* ── Display mode ── */
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{u.full_name}</span>
                              {u.id === profile?.id && (
                                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold">BẠN</span>
                              )}
                              {profile?.role === 'admin' && (
                                <button
                                  onClick={() => startEditName(u)}
                                  className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-600 hover:text-slate-300 flex-shrink-0"
                                  title="Sửa tên"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                          disabled={u.id === profile?.id}
                          className="bg-[#161b27] border border-white/[0.08] text-xs text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-blue-500/50 disabled:opacity-30 transition-all cursor-pointer"
                          style={{ colorScheme: 'dark' }}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value} className="bg-[#161b27]">{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Other Settings Mock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f1219] border border-white/[0.06] rounded-2xl p-6 opacity-50 cursor-not-allowed">
              <h3 className="text-white font-bold mb-2">Cấu hình Pipeline</h3>
              <p className="text-slate-500 text-xs">Thay đổi tên và thứ tự các giai đoạn (Sắp ra mắt)</p>
            </div>
            <div className="bg-[#0f1219] border border-white/[0.06] rounded-2xl p-6 opacity-50 cursor-not-allowed">
              <h3 className="text-white font-bold mb-2">Tích hợp API</h3>
              <p className="text-slate-500 text-xs">Kết nối với Facebook Ads và Google Sheets (Sắp ra mắt)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal tạo tài khoản */}
      {showCreateModal && (
        <CreateUserModal
          onCreated={handleCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
