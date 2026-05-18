'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, UserRole, ROLE_LABELS } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { RoleBadge } from '@/components/auth/role-badge'

export default function SettingsPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
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

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 bg-[#0a0c10]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>Cài đặt hệ thống</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý người dùng và phân quyền truy cập</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* User Management Section */}
          <section className="bg-[#0f1219] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Danh sách thành viên</h2>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                {users.length} THÀNH VIÊN
              </span>
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
                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white">
                            {u.full_name?.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-white">{u.full_name}</span>
                          {u.id === profile?.id && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold">BẠN</span>}
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
    </div>
  )
}
