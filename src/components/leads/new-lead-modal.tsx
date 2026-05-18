'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateUuidV4 } from '@/lib/uuid'
import { Lead, SOURCES } from '@/types'

type Source = (typeof SOURCES)[number]

type FormValues = {
  name: string
  phone: string
  email: string
  course_interest: string
  source: Source
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const phoneRegex = /^0[0-9]{9}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidSource(value: string): value is Source {
  return (SOURCES as readonly string[]).includes(value)
}

const inputStyle = {
  width: '100%',
  background: '#161b27',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: '13px',
  outline: 'none',
}

const inputErrorStyle = {
  ...inputStyle,
  border: '1px solid rgba(239,68,68,0.4)',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: '#475569',
  marginBottom: '5px',
}

import { PermissionGate } from '@/components/auth/permission-gate'

export function NewLeadModal({ onLeadCreated }: { onLeadCreated?: (lead: Lead) => void } = {}) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [values, setValues] = useState<FormValues>({
    name: '',
    phone: '',
    email: '',
    course_interest: '',
    source: SOURCES[0],
  })
  const [errors, setErrors] = useState<FormErrors>({})

  function clearFieldError(field: keyof FormValues) {
    setErrors((prev) => {
      if (prev[field] === undefined) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function validate(input: FormValues) {
    const nextErrors: FormErrors = {}
    const name = input.name.trim()
    if (!name) nextErrors.name = 'Vui lòng nhập họ tên'
    else if (name.length < 2) nextErrors.name = 'Họ tên phải có ít nhất 2 ký tự'

    const phone = input.phone.trim()
    if (!phone) nextErrors.phone = 'Vui lòng nhập số điện thoại'
    else if (!phoneRegex.test(phone))
      nextErrors.phone = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'

    const email = input.email.trim()
    if (email && !emailRegex.test(email))
      nextErrors.email = 'Email không đúng định dạng'

    if (!isValidSource(input.source))
      nextErrors.source = 'Vui lòng chọn nguồn hợp lệ'

    return nextErrors
  }

  function closeModal() {
    setOpen(false)
    setFormError(null)
    setErrors({})
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const id = generateUuidV4()
    const payload = {
      id,
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim() || null,
      course_interest: values.course_interest.trim() || null,
      source: values.source,
      stage: 'New' as const,
    }

    const { data, error } = await supabase.from('leads').insert(payload).select().single()
    setSubmitting(false)

    if (error) {
      setFormError(error.message)
      return
    }

    closeModal()
    setValues({ name: '', phone: '', email: '', course_interest: '', source: SOURCES[0] })

    if (onLeadCreated && data) {
      // Pipeline mode: update state directly, no reload
      onLeadCreated(data as Lead)
    } else {
      router.refresh()
    }
  }

  return (
    <>
      {/* Trigger button */}
      <PermissionGate action="lead:create">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ background: '#3b82f6' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
        >
          + New Lead
        </button>
      </PermissionGate>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-xl rounded-xl p-6"
            style={{
              background: '#0f1219',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between mb-5 pb-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2
                className="text-base font-bold text-white"
                style={{ fontFamily: 'var(--font-syne)' }}
              >
                Tao lead moi
              </h2>
              <button
                onClick={closeModal}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-lg transition-colors"
                style={{ color: '#475569', background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={onSubmit}>

              {/* Name */}
              <div>
                <label style={labelStyle}>Ho ten *</label>
                <input
                  value={values.name}
                  placeholder="Nguyen Van A"
                  onChange={(e) => { clearFieldError('name'); setValues((p) => ({ ...p, name: e.target.value })) }}
                  style={errors.name ? inputErrorStyle : inputStyle}
                />
                {errors.name && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.name}</p>}
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>So dien thoai *</label>
                  <input
                    value={values.phone}
                    placeholder="0987654321"
                    onChange={(e) => { clearFieldError('phone'); setValues((p) => ({ ...p, phone: e.target.value })) }}
                    style={errors.phone ? inputErrorStyle : inputStyle}
                  />
                  {errors.phone && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.phone}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    value={values.email}
                    placeholder="email@..."
                    onChange={(e) => { clearFieldError('email'); setValues((p) => ({ ...p, email: e.target.value })) }}
                    style={errors.email ? inputErrorStyle : inputStyle}
                  />
                  {errors.email && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.email}</p>}
                </div>
              </div>

              {/* Course Interest */}
              <div>
                <label style={labelStyle}>Khoa hoc quan tam</label>
                <input
                  value={values.course_interest}
                  placeholder="IELTS 6.5, TOEIC 700+..."
                  onChange={(e) => setValues((p) => ({ ...p, course_interest: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Source */}
              <div>
                <label style={labelStyle}>Nguon *</label>
                <select
                  value={values.source}
                  onChange={(e) => { clearFieldError('source'); setValues((p) => ({ ...p, source: e.target.value as Source })) }}
                  style={{ ...inputStyle, appearance: 'none' as const, colorScheme: 'dark' }}
                >
                  {SOURCES.map((s) => <option key={s} value={s} className="bg-[#161b27]">{s}</option>)}
                </select>
                {errors.source && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.source}</p>}
              </div>

              {/* Form error */}
              {formError && (
                <div
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                >
                  {formError}
                </div>
              )}

              {/* Footer */}
              <div
                className="flex justify-end gap-2 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', background: 'transparent' }}
                >
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: '#3b82f6' }}
                >
                  {submitting ? 'Dang luu...' : 'Luu lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}