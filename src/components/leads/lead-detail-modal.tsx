'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Interaction, Lead, SOURCES } from '@/types'

type Source = (typeof SOURCES)[number]

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#161b27',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: '13px',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#475569',
  marginBottom: '5px',
}

const STAGE_COLOR: Record<string, string> = {
  New: '#3b82f6',
  Contacted: '#60a5fa',
  Consulting: '#fbbf24',
  Trial: '#818cf8',
  Enrolled: '#4ade80',
  Dropped: '#f87171',
}

// ── Tab: Thông tin ─────────────────────────────────────
function InfoTab({
  lead,
  onUpdated,
}: {
  lead: Lead
  onUpdated: (updated: Lead) => void
}) {
  const supabase = createClient()
  const [name, setName] = useState(lead.name)
  const [phone, setPhone] = useState(lead.phone ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [courseInterest, setCourseInterest] = useState(lead.course_interest ?? '')
  const [source, setSource] = useState<Source>(lead.source)
  const [assignedToName, setAssignedToName] = useState<string>(lead.assigned_to_name ?? '') // Sử dụng field name tự điền
  const [staffs, setStaffs] = useState<{ id: string, full_name: string, email: string, role: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  useEffect(() => {
    async function loadStaffs() {
      const { data } = await supabase.from('user_profiles').select('id, full_name, email, role').order('role', { ascending: true })
      if (data) setStaffs(data as any[])
    }
    loadStaffs()
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setSaveErr('Họ tên không được để trống'); return }
    setSaving(true); setSaveErr(null); setSaveMsg(null)

    // Tìm xem tên nhập vào có khớp với ID nào không
    const matchedStaff = staffs.find(s => s.full_name === assignedToName || s.email === assignedToName)

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          course_interest: courseInterest.trim() || null,
          source,
          assigned_to: matchedStaff?.id || null,
          assigned_to_name: assignedToName.trim() || null,
        })
        .eq('id', lead.id)
        .select()
        .single()

      setSaving(false)
      if (error) { 
        setSaveErr(error.message); 
        alert('Lỗi khi lưu: ' + error.message + '\n\nLưu ý: Hãy đảm bảo bạn đã chạy câu lệnh SQL thêm cột assigned_to_name trong Supabase.');
        return; 
      }
      setSaveMsg('Đã lưu thay đổi!')
      setTimeout(() => setSaveMsg(null), 2000)
      if (data) onUpdated(data as Lead)
    } catch (err: any) {
      setSaving(false)
      alert('Lỗi hệ thống: ' + err.message);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label style={labelStyle}>Họ tên *</label>
        <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Nguyễn Văn A" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Số điện thoại</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="0987654321" />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="email@..." />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Khóa học quan tâm</label>
        <input value={courseInterest} onChange={e => setCourseInterest(e.target.value)} style={inputStyle} placeholder="IELTS 6.5, TOEIC 700+..." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Nguồn</label>
          <select
            value={source}
            onChange={e => setSource(e.target.value as Source)}
            style={{ ...inputStyle, appearance: 'none', colorScheme: 'dark' }}
          >
            {SOURCES.map(s => <option key={s} value={s} className="bg-[#161b27] text-white">{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Người phụ trách</label>
          <input 
            list="staff-list-detail"
            value={assignedToName}
            onChange={e => setAssignedToName(e.target.value)}
            placeholder="Gõ tên hoặc chọn..."
            style={inputStyle}
          />
          <datalist id="staff-list-detail">
            {staffs.map((s, idx) => {
              const role = s.role === 'admin' ? 'Admin' : s.role === 'sales' ? 'Sale' : 'Tư vấn';
              const name = (s.full_name && s.full_name !== 'User') ? s.full_name : s.email;
              return <option key={s.id} value={name}>{idx + 1}. {role} - {name}</option>
            })}
          </datalist>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '4px' }}>
        <div>
          <label style={labelStyle}>Ngày tạo (read-only)</label>
          <p style={{ fontSize: '13px', color: '#64748b', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {formatDateTime(lead.created_at)}
          </p>
        </div>
        <div>
          <label style={labelStyle}>Giai đoạn</label>
          <p style={{ fontSize: '13px', color: STAGE_COLOR[lead.stage] ?? '#94a3b8', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {lead.stage}
          </p>
        </div>
      </div>

      {saveErr && <p style={{ fontSize: '12px', color: '#f87171' }}>{saveErr}</p>}
      {saveMsg && <p style={{ fontSize: '12px', color: '#4ade80' }}>{saveMsg}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          type="submit"
          disabled={saving}
          style={{ background: '#3b82f6', color: '#fff', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}

// ── Tab: Timeline ──────────────────────────────────────
function TimelineTab({ lead }: { lead: Lead }) {
  const supabase = createClient()
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  useEffect(() => {
    void fetchInteractions()
  }, [lead.id])

  async function fetchInteractions() {
    setLoadingList(true)
    const { data } = await supabase
      .from('interactions')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
    setInteractions((data as Interaction[] | null) ?? [])
    setLoadingList(false)
  }

  async function handleSubmitNote(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) { setSubmitErr('Vui lòng nhập nội dung ghi chú'); return }
    setSubmitting(true); setSubmitErr(null)

    const { error } = await supabase.from('interactions').insert({
      lead_id: lead.id,
      note: note.trim(),
    })

    setSubmitting(false)
    if (error) { setSubmitErr(error.message); return }
    setNote('')
    void fetchInteractions()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <form onSubmit={handleSubmitNote} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Ghi chú cuộc gọi..."
          style={{
            ...inputStyle,
            resize: 'vertical',
            lineHeight: '1.5',
            fontFamily: 'inherit',
          }}
        />
        {submitErr && <p style={{ fontSize: '12px', color: '#f87171' }}>{submitErr}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{ background: '#3b82f6', color: '#fff', borderRadius: '8px', padding: '7px 18px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Đang lưu...' : 'Lưu ghi chú'}
          </button>
        </div>
      </form>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {loadingList ? (
        <p style={{ fontSize: '13px', color: '#475569', textAlign: 'center', padding: '24px 0' }}>Đang tải...</p>
      ) : interactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '20px' }}>💬</p>
          <p style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>Chưa có ghi chú nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
          {interactions.map(item => (
            <article
              key={item.id}
              style={{
                background: '#161b27',
                borderLeft: '2px solid rgba(59,130,246,0.35)',
                borderRadius: '0 8px 8px 0',
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff', flexShrink: 0,
                }}>
                  {item.created_by ? item.created_by.charAt(0).toUpperCase() : 'C'}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {item.created_by ?? 'Consultant'}
                </span>
                <span style={{ fontSize: '11px', color: '#334155', marginLeft: 'auto' }}>
                  {formatDateTime(item.created_at)}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {item.note}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export function LeadDetailModal({
  lead,
  onClose,
  onLeadUpdated,
}: {
  lead: Lead
  onClose: () => void
  onLeadUpdated?: (updated: Lead) => void
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info')
  const [currentLead, setCurrentLead] = useState(lead)
  const [confirmClone, setConfirmClone] = useState(false)
  const [cloning, setCloning] = useState(false)
  const supabase = createClient()

  useEffect(() => { setCurrentLead(lead) }, [lead])

  async function handleClone() {
    setCloning(true)
    const newName = `${currentLead.name} (Tái kích hoạt)`

    try {
      // 1. Tạo mới khách hàng
      const { data, error: insertError } = await supabase.from('leads').insert({
        name: newName,
        phone: currentLead.phone,
        email: currentLead.email,
        course_interest: currentLead.course_interest,
        source: currentLead.source,
        stage: 'New',
        assigned_to: null,
        assigned_to_name: null,
      }).select('id').single()
      
      if (insertError) throw insertError
      const newId = data.id

      // 2. Thêm ghi chú chéo
      await Promise.all([
        supabase.from('interactions').insert({
          lead_id: currentLead.id,
          note: `[Hệ thống] Đã nhân bản sang khách hàng mới để tái kích hoạt (ID: ${newId})`
        }),
        supabase.from('interactions').insert({
          lead_id: newId,
          note: `[Hệ thống] Bản ghi này được nhân bản từ khách hàng cũ (ID: ${currentLead.id})`
        })
      ])

      onClose()
      // Kích hoạt reload pipeline
      onLeadUpdated?.({ ...currentLead, id: newId, name: newName, stage: 'New' })
    } catch (e) {
      alert('Có lỗi xảy ra khi nhân bản!')
    } finally {
      setCloning(false)
      setConfirmClone(false)
    }
  }

  function handleUpdated(updated: Lead) {
    setCurrentLead(updated)
    onLeadUpdated?.(updated)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
    color: active ? '#e2e8f0' : '#64748b',
    background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all .15s',
  })

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%', maxWidth: '540px', borderRadius: '14px', background: '#0f1219',
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 72px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column', maxHeight: '85vh',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#fff', fontSize: '14px',
            }}>
              {currentLead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>{currentLead.name}</h2>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{currentLead.phone ?? currentLead.email ?? '—'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentLead.stage === 'Dropped' && (
              <button
                onClick={() => setConfirmClone(true)}
                style={{
                  background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)',
                  padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="hover:bg-blue-500/20"
              >
                Tái kích hoạt
              </button>
            )}
            <button
              onClick={onClose}
              style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#64748b', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', padding: '10px 20px 0', flexShrink: 0 }}>
          <button style={tabStyle(activeTab === 'info')} onClick={() => setActiveTab('info')}>Thông tin</button>
          <button style={tabStyle(activeTab === 'timeline')} onClick={() => setActiveTab('timeline')}>Timeline</button>
        </div>

        <div style={{ padding: '16px 20px 20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'info'
            ? <InfoTab lead={currentLead} onUpdated={handleUpdated} />
            : <TimelineTab lead={currentLead} />
          }
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmClone && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
          <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', width: '320px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', marginTop: 0 }}>Xác nhận tái kích hoạt</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
              Hệ thống sẽ tạo một bản ghi mới mang tên <strong style={{ color: '#fff' }}>{currentLead.name} (Tái kích hoạt)</strong> ở trạng thái New.
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
    </div>
  )
}
