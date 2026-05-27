'use client'

import Link from 'next/link'
import { useInvoice } from '@/hooks/use-invoices'
import { RecordPaymentModal } from '@/components/invoices/record-payment-modal'
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types'

interface InvoiceDetailClientProps {
  invoiceId: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

function isOverdue(invoice: NonNullable<ReturnType<typeof useInvoice>['invoice']>) {
  if (!invoice || !invoice.due_date || invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false
  }
  return new Date(invoice.due_date) < new Date()
}

function getVisualStatus(invoice: NonNullable<ReturnType<typeof useInvoice>['invoice']>) {
  return isOverdue(invoice) ? 'overdue' : invoice.status
}

export function InvoiceDetailClient({ invoiceId }: InvoiceDetailClientProps) {
  const { invoice, loading, error, refresh } = useInvoice(invoiceId)

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="rounded-2xl border border-white/5 bg-[#0f1219] p-5">
          <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-5 w-72 animate-pulse rounded bg-white/5" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
          {error || 'Không tìm thấy hóa đơn'}
        </div>
      </div>
    )
  }

  const visualStatus = getVisualStatus(invoice)
  const statusStyle = INVOICE_STATUS_COLORS[visualStatus]
  const totalPaid = (invoice.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const remaining = Math.max(Number(invoice.final_amount || 0) - totalPaid, 0)
  const progress = invoice.final_amount > 0 ? Math.min((totalPaid / invoice.final_amount) * 100, 100) : 100

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
        <Link href="/invoices" className="hover:text-blue-300">Hóa đơn</Link>
        <span>/</span>
        <span className="text-slate-200">{invoice.invoice_number}</span>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0f1219] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em]" style={{ color: '#94a3b8' }}>
              {invoice.invoice_number}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
              {invoice.lead?.name || 'Học viên'}
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#cbd5e1' }}>
              Khóa học: <span className="font-semibold text-white">{invoice.course?.name || invoice.course?.code || '—'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: statusStyle.bg, color: statusStyle.color }}>
              {INVOICE_STATUS_LABELS[visualStatus]}
            </span>
            <RecordPaymentModal invoice={invoice} onSuccess={refresh} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>Tổng tiền</p>
            <p className="mt-2 text-lg font-bold text-white">{formatCurrency(Number(invoice.final_amount || 0))}</p>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>Đã thu</p>
            <p className="mt-2 text-lg font-bold text-emerald-300">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>Còn lại</p>
            <p className="mt-2 text-lg font-bold text-amber-200">{formatCurrency(remaining)}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span style={{ color: '#94a3b8' }}>Tiến độ thanh toán</span>
            <span className="font-semibold text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5">
            <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>Thông tin liên hệ</p>
            <div className="mt-3 space-y-1 text-sm text-slate-200">
              <p>SĐT: {invoice.lead?.phone || '—'}</p>
              <p>Email: {invoice.lead?.email || '—'}</p>
            </div>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>Hạn chót</p>
            <p className="mt-3 text-sm text-white">{formatDate(invoice.due_date)}</p>
            {invoice.note && (
              <p className="mt-2 text-sm" style={{ color: '#cbd5e1' }}>{invoice.note}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/5 bg-[#0f1219] p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Timeline thanh toán</h2>
            <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
              Các đợt thu tiền được ghi nhận theo thời gian.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {(invoice.payments ?? []).length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm" style={{ color: '#94a3b8' }}>
              Chưa có thanh toán nào được ghi nhận.
            </div>
          )}

          {(invoice.payments ?? []).map((payment) => (
            <div key={payment.id} className="rounded-xl border border-white/5 px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{formatCurrency(Number(payment.amount || 0))}</p>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    {PAYMENT_METHOD_LABELS[payment.method]} · {formatDate(payment.paid_at)}
                  </p>
                </div>
                <div className="text-sm" style={{ color: '#cbd5e1' }}>
                  {payment.note || 'Không có ghi chú'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
