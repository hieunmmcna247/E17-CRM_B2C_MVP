'use client'

import { createClient } from '@/lib/supabase/client'
import { exportToCSV } from '@/lib/export-csv'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

const LEAD_COLUMNS =
  'id, name, phone, email, course_interest, source, stage, created_at, updated_at' as const

const PAGE_SIZE = 1000

function dateStamp(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export function ExportLeadsButton() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  async function handleExport() {
    setLoading(true)
    try {
      const supabase = createClient()
      const all: Record<string, unknown>[] = []
      let from = 0

      const q = searchParams.get('q')
      const stage = searchParams.get('stage')
      const source = searchParams.get('source')
      const course = searchParams.get('course')

      while (true) {
        let query = supabase.from('leads').select(LEAD_COLUMNS)

        if (q) {
          query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
        }
        if (stage) {
          query = query.eq('stage', stage)
        }
        if (source) {
          query = query.eq('source', source)
        }
        if (course) {
          query = query.ilike('course_interest', `%${course}%`)
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1)

        if (error) throw new Error(error.message)
        const batch = (data as Record<string, unknown>[] | null) ?? []
        all.push(...batch)
        if (batch.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }

      exportToCSV(`leads_export_${dateStamp()}.csv`, all)
    } catch (e) {
      console.error(e)
      window.alert(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleExport()}
      disabled={loading}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Đang xuất...' : '↓ Export Leads'}
    </button>
  )
}
