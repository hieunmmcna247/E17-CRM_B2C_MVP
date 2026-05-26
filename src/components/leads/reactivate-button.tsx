'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types'

export function ReactivateButton({ lead }: { lead: Lead }) {
  const [confirmClone, setConfirmClone] = useState(false)
  const [cloning, setCloning] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleClone() {
    setCloning(true)
    const newName = `${lead.name} (Tái kích hoạt)`

    try {
      // 1. Tạo mới khách hàng
      const { data, error: insertError } = await supabase.from('leads').insert({
        name: newName,
        phone: lead.phone,
        email: lead.email,
        course_interest: lead.course_interest,
        source: lead.source,
        stage: 'New',
        assigned_to: null,
        assigned_to_name: null,
      }).select('id').single()
      
      if (insertError) throw insertError
      const newId = data.id

      // 2. Thêm ghi chú chéo
      await Promise.all([
        supabase.from('interactions').insert({
          lead_id: lead.id,
          note: `[Hệ thống] Đã nhân bản sang khách hàng mới để tái kích hoạt (ID: ${newId})`
        }),
        supabase.from('interactions').insert({
          lead_id: newId,
          note: `[Hệ thống] Bản ghi này được nhân bản từ khách hàng cũ (ID: ${lead.id})`
        })
      ])

      setConfirmClone(false)
      router.refresh() // Làm mới trang chi tiết hiện tại để thấy ghi chú mới
    } catch (e) {
      alert('Có lỗi xảy ra khi nhân bản!')
    } finally {
      setCloning(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmClone(true)}
        className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:bg-blue-500/20"
        style={{
          background: 'rgba(59,130,246,0.1)',
          color: '#60a5fa',
          border: '1px solid rgba(59,130,246,0.3)',
        }}
      >
        Tái kích hoạt
      </button>

      {confirmClone && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
          <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', width: '320px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', marginTop: 0 }}>Xác nhận tái kích hoạt</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
              Hệ thống sẽ tạo một bản ghi mới mang tên <strong style={{ color: '#fff' }}>{lead.name} (Tái kích hoạt)</strong> ở trạng thái New.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirmClone(false)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleClone} disabled={cloning} style={{ flex: 1, padding: '8px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '6px', cursor: cloning ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                {cloning ? 'Đang tạo...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
