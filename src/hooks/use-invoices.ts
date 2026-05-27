'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Invoice, InvoiceStatus, PaymentMethod } from '@/types'

export interface InvoiceFilters {
  status?: InvoiceStatus | 'all' | 'overdue'
  month?: string
  courseIds?: string[]
}

export interface PaymentInput {
  amount: number
  method: PaymentMethod
  paid_at: string
  note?: string | null
}

function sortPayments(items: Invoice['payments'] = []) {
  return [...items].sort((a, b) => new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime())
}

function normalizeInvoice(data: any): Invoice {
  return {
    ...data,
    payments: sortPayments((data.payments ?? []) as Invoice['payments']),
  }
}

export async function recordPayment(invoiceId: string, payment: PaymentInput) {
  const supabase = createClient()

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, final_amount, enrollment_id')
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    throw new Error(invoiceError?.message || 'Không tìm thấy hóa đơn')
  }

  const { data: authUser } = await supabase.auth.getUser()

  const { error: insertError } = await supabase
    .from('payments')
    .insert([{
      invoice_id: invoiceId,
      amount: payment.amount,
      method: payment.method,
      paid_at: payment.paid_at,
      note: payment.note ?? null,
      recorded_by: authUser?.user?.id ?? null,
    }])

  if (insertError) {
    throw new Error(insertError.message)
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)

  if (paymentsError) {
    throw new Error(paymentsError.message)
  }

  const totalPaid = (payments ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const finalAmount = Number(invoice.final_amount || 0)
  const newStatus = totalPaid >= finalAmount
    ? 'paid'
    : totalPaid > 0
      ? 'partial'
      : 'sent'

  const { error: invoiceUpdateError } = await supabase
    .from('invoices')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (invoiceUpdateError) {
    throw new Error(invoiceUpdateError.message)
  }

  const paymentStatus = newStatus === 'paid' ? 'paid' : newStatus === 'partial' ? 'partial' : 'unpaid'

  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .update({
      payment_status: paymentStatus,
      fee_paid: totalPaid,
    })
    .eq('id', invoice.enrollment_id)

  if (enrollmentError) {
    throw new Error(enrollmentError.message)
  }
}

export function useInvoices(filters: InvoiceFilters = {}) {
  const supabase = useMemo(() => createClient(), [])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (filters.courseIds !== undefined && filters.courseIds.length === 0) {
      setInvoices([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('invoices')
      .select('*, lead:lead_id(id,name,phone,email), course:course_id(id,name,code), payments:payments(*)')
      .order('created_at', { ascending: false })

    if (filters.courseIds && filters.courseIds.length > 0) {
      query = query.in('course_id', filters.courseIds)
    }

    if (filters.status && filters.status !== 'all' && filters.status !== 'overdue') {
      query = query.eq('status', filters.status)
    }

    if (filters.month) {
      const monthStart = new Date(`${filters.month}-01T00:00:00.000Z`)
      const monthEnd = new Date(monthStart)
      monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)
      query = query.gte('created_at', monthStart.toISOString()).lt('created_at', monthEnd.toISOString())
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
      setInvoices([])
      setLoading(false)
      return
    }

    const normalized = (data ?? []).map((row: any) => normalizeInvoice(row)) as Invoice[]
    setInvoices(normalized)
    setLoading(false)
  }, [filters.courseIds, filters.month, filters.status, supabase])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  useEffect(() => {
    const channel = supabase
      .channel('invoices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        loadInvoices()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadInvoices()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadInvoices, supabase])

  return {
    invoices,
    loading,
    error,
    refresh: loadInvoices,
  }
}

export function useInvoice(invoiceId: string) {
  const supabase = useMemo(() => createClient(), [])
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoice = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('invoices')
      .select('*, lead:lead_id(id,name,phone,email), course:course_id(id,name,code), payments:payments(*)')
      .eq('id', invoiceId)
      .single()

    if (error) {
      setError(error.message)
      setInvoice(null)
      setLoading(false)
      return
    }

    setInvoice(normalizeInvoice(data))
    setLoading(false)
  }, [invoiceId, supabase])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  useEffect(() => {
    const channel = supabase
      .channel(`invoice-${invoiceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `id=eq.${invoiceId}` }, () => {
        loadInvoice()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `invoice_id=eq.${invoiceId}` }, () => {
        loadInvoice()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [invoiceId, loadInvoice, supabase])

  return {
    invoice,
    loading,
    error,
    refresh: loadInvoice,
  }
}
