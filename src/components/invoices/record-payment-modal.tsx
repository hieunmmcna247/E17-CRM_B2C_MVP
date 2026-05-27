'use client'

import { useMemo, useState } from 'react'
import { PermissionGate } from '@/components/auth/permission-gate'
import { PaymentMethod, Invoice } from '@/types'
import { recordPayment } from '@/hooks/use-invoices'

interface RecordPaymentModalProps {
  invoice: Invoice
  buttonLabel?: string
  onSuccess?: () => void
}

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'momo', label: 'MoMo' },
  { value: 'vnpay', label: 'VNPay' },
  { value: 'other', label: 'Khác' },
]

export function RecordPaymentModal({ invoice, buttonLabel = 'Ghi nhận thanh toán', onSuccess }: RecordPaymentModalProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const paidAmount = useMemo(() =>
    (invoice.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [invoice.payments]
  )

  const remaining = Math.max(Number(invoice.final_amount || 0) - paidAmount, 0)

  if (remaining <= 0) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Vui lòng nhập số tiền lớn hơn 0')
      return
    }

    if (numericAmount > remaining) {
      setError('Số tiền ghi nhận vượt quá số còn lại')
      return
    }

    setSubmitting(true)

    try {
      await recordPayment(invoice.id, {
        amount: numericAmount,
        method,
        paid_at: new Date(`${paidAt}T12:00:00`).toISOString(),
        note: note.trim() || null,
      })

      setToast('Đã ghi nhận thanh toán thành công')
      setTimeout(() => {
        setOpen(false)
        setToast(null)
        onSuccess?.()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ghi nhận thanh toán')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PermissionGate action="payment:record">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg px-3 py-2 text-sm font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(99,102,241,0.14))',
            color: '#dbeafe',
            border: '1px solid rgba(96,165,250,0.28)',
          }}
        >
          {buttonLabel}
        </button>
      </PermissionGate>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
          <div
            className="w-full max-w-lg rounded-2xl p-5 shadow-2xl"
            style={{
              background: '#0f1219',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#94a3b8' }}>
                  Ghi nhận thanh toán
                </p>
                <h2 className="mt-2 text-lg font-bold text-white">
                  {invoice.invoice_number}
                </h2>
                <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
                  Còn lại: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remaining)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm"
                style={{ color: '#cbd5e1', background: 'rgba(255,255,255,0.03)' }}
              >
                Đóng
              </button>
            </div>

            {toast && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {toast}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Số tiền</label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="VD: 2000000"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: 'rgba(15,23,42,0.8)',
                    borderColor: 'rgba(255,255,255,0.06)',
                    color: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Phương thức</label>
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as PaymentMethod)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: 'rgba(15,23,42,0.8)',
                    borderColor: 'rgba(255,255,255,0.06)',
                    color: '#f8fafc',
                  }}
                >
                  {METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Ngày thu</label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(event) => setPaidAt(event.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: 'rgba(15,23,42,0.8)',
                    borderColor: 'rgba(255,255,255,0.06)',
                    color: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Ghi chú</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="VD: Khách thanh toán đợt 1"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: 'rgba(15,23,42,0.8)',
                    borderColor: 'rgba(255,255,255,0.06)',
                    color: '#f8fafc',
                  }}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{ color: '#cbd5e1', background: 'rgba(255,255,255,0.04)' }}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{
                    background: submitting ? 'rgba(59,130,246,0.2)' : 'linear-gradient(135deg, #2563eb, #6366f1)',
                    color: '#eff6ff',
                    opacity: submitting ? 0.8 : 1,
                  }}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thanh toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
