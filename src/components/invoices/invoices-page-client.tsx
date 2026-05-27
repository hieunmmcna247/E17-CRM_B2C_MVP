'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useInvoices } from '@/hooks/use-invoices'
import { RecordPaymentModal } from '@/components/invoices/record-payment-modal'
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS, Invoice, InvoiceStatus } from '@/types'

interface InvoicesPageClientProps {
  courseIds?: string[]
  initialStatus: InvoiceStatus | 'all' | 'overdue'
  initialMonth: string
}

const STATUS_OPTIONS: Array<InvoiceStatus | 'all' | 'overdue'> = ['all', 'draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('vi-VN')
}

function isOverdue(invoice: Invoice) {
  if (!invoice.due_date || invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false
  }
  return new Date(invoice.due_date) < new Date()
}

function getVisualStatus(invoice: Invoice): InvoiceStatus {
  return isOverdue(invoice) ? 'overdue' : invoice.status
}

function buildLink(status: string, month: string) {
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (month) params.set('month', month)
  return `/invoices${params.size ? `?${params.toString()}` : ''}`
}

export function InvoicesPageClient({ courseIds, initialStatus, initialMonth }: InvoicesPageClientProps) {
  const router = useRouter()
  const { invoices, loading, error, refresh } = useInvoices({ courseIds, status: initialStatus, month: initialMonth })

  const filteredInvoices = useMemo(() => {
    let list = [...invoices]

    if (initialStatus === 'overdue') {
      list = list.filter((invoice) => isOverdue(invoice))
    } else if (initialStatus !== 'all') {
      list = list.filter((invoice) => invoice.status === initialStatus)
    }

    if (initialMonth) {
      const start = new Date(`${initialMonth}-01T00:00:00.000Z`)
      const end = new Date(start)
      end.setUTCMonth(end.getUTCMonth() + 1)
      list = list.filter((invoice) => {
        const createdAt = new Date(invoice.created_at)
        return createdAt >= start && createdAt < end
      })
    }

    return list
  }, [invoices, initialMonth, initialStatus])

  const totalCollected = filteredInvoices.reduce((sum, invoice) => {
    return sum + (invoice.payments ?? []).reduce((amount, payment) => amount + Number(payment.amount || 0), 0)
  }, 0)

  const monthOptions = useMemo(() => {
    const current = new Date()
    const months = [] as string[]

    for (let index = 0; index < 6; index += 1) {
      const month = new Date(current.getFullYear(), current.getMonth() - index, 1)
      months.push(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`)
    }

    return months
  }, [])

  return (
    <div className="min-h-screen px-4 py-6 md:px-6" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em]" style={{ color: '#94a3b8' }}>
              Quản lý hóa đơn
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
              Hóa đơn & Thanh toán
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
              Theo dõi trạng thái thanh toán và ghi nhận các đợt thu tiền cho học viên đã ghi danh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl px-3 py-2" style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
                Đã thu
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-300">{formatCurrency(totalCollected)}</p>
            </div>
            <div className="rounded-xl px-3 py-2" style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
                Số hóa đơn
              </p>
              <p className="mt-1 text-lg font-bold text-white">{filteredInvoices.length}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((status) => {
            const selected = initialStatus === status
            const label = status === 'all' ? 'Tất cả' : status === 'overdue' ? 'Quá hạn' : INVOICE_STATUS_LABELS[status]
            return (
              <Link
                key={status}
                href={buildLink(status, initialMonth)}
                className="rounded-full px-3 py-1.5 text-sm font-semibold transition-all"
                style={{
                  background: selected ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)',
                  color: selected ? '#dbeafe' : '#cbd5e1',
                  border: `1px solid ${selected ? 'rgba(96,165,250,0.28)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm" style={{ color: '#cbd5e1' }}>
            Tháng
          </label>
          <select
            value={initialMonth}
            onChange={(event) => {
              router.push(buildLink(initialStatus, event.target.value))
            }}
            className="rounded-xl border px-3 py-2 text-sm"
            style={{
              background: '#0f1219',
              borderColor: 'rgba(255,255,255,0.06)',
              color: '#f8fafc',
            }}
          >
            <option value="">Tất cả tháng</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/5 bg-[#0f1219] p-4">
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && filteredInvoices.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0f1219] px-6 py-10 text-center">
            <p className="text-lg font-semibold text-white">Chưa có hóa đơn phù hợp</p>
            <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>
              Khi lead được chuyển sang Enrolled, hóa đơn sẽ được tạo tự động và hiển thị tại đây.
            </p>
          </div>
        )}

        {!loading && !error && filteredInvoices.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0f1219]">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.75)', color: '#94a3b8' }}>
                  <th className="px-4 py-3 text-left">Mã HĐ</th>
                  <th className="px-4 py-3 text-left">Học viên</th>
                  <th className="px-4 py-3 text-left">Khóa học</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3 text-right">Đã thu</th>
                  <th className="px-4 py-3 text-right">Còn lại</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày hết hạn</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const visualStatus = getVisualStatus(invoice)
                  const statusStyle = INVOICE_STATUS_COLORS[visualStatus]
                  const collected = (invoice.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
                  const remaining = Math.max(Number(invoice.final_amount || 0) - collected, 0)
                  const rowStyle = isOverdue(invoice)
                    ? { background: 'rgba(239,68,68,0.08)' }
                    : undefined

                  return (
                    <tr key={invoice.id} style={rowStyle} className="border-t border-white/5">
                      <td className="px-4 py-3 font-semibold text-blue-300">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white">
                        <div className="font-medium">{invoice.lead?.name || '—'}</div>
                        <div className="text-xs" style={{ color: '#64748b' }}>{invoice.lead?.email || invoice.lead?.phone || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {invoice.course?.name || invoice.course?.code || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-100">{formatCurrency(Number(invoice.final_amount || 0))}</td>
                      <td className="px-4 py-3 text-right text-emerald-300">{formatCurrency(collected)}</td>
                      <td className="px-4 py-3 text-right text-amber-200">{formatCurrency(remaining)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                          {INVOICE_STATUS_LABELS[visualStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{formatDate(invoice.due_date)}</td>
                      <td className="px-4 py-3">
                        <RecordPaymentModal invoice={invoice} onSuccess={refresh} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
