'use client'

import { createClient } from '@/lib/supabase/client'
import { exportToCSV } from '@/lib/export-csv'
import { useEffect, useRef, useState } from 'react'

const PAGE_SIZE = 1000

function dateStamp(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

async function fetchAllPages(
  supabase: ReturnType<typeof createClient>,
  table: 'leads' | 'stage_history',
  orderCol: string
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderCol, { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const batch = (data as Record<string, unknown>[] | null) ?? []
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return all
}

export function ExportDataButton() {
  const [loading, setLoading] = useState<'leads' | 'history' | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleExport(type: 'leads' | 'history') {
    setOpen(false)
    setLoading(type)
    try {
      const supabase = createClient()
      if (type === 'leads') {
        const rows = await fetchAllPages(supabase, 'leads', 'created_at')
        exportToCSV(`leads_export_${dateStamp()}.csv`, rows)
      } else {
        const rows = await fetchAllPages(supabase, 'stage_history', 'changed_at')
        exportToCSV(`stage_history_export_${dateStamp()}.csv`, rows)
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Export thất bại.')
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !isLoading && setOpen((v) => !v)}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#0f1219',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '13px',
          fontWeight: '500',
          color: isLoading ? '#475569' : '#e2e8f0',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'border-color .15s, background .15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
      >
        {isLoading ? (
          <>⏳ Đang xuất...</>
        ) : (
          <>⬇ Export Data <span style={{ color: '#475569', fontSize: '10px' }}>▾</span></>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: '#0f1219',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          minWidth: '210px',
          zIndex: 100,
        }}>
          <button
            type="button"
            onClick={() => void handleExport('leads')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 14px', background: 'transparent',
              border: 'none', cursor: 'pointer', color: '#e2e8f0', fontSize: '13px', textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <span style={{ fontSize: '16px' }}>📋</span>
            <div>
              <div style={{ fontWeight: '500' }}>Export Leads (.csv)</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>Toàn bộ bảng Leads, ISO 8601</div>
            </div>
          </button>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 10px' }} />

          <button
            type="button"
            onClick={() => void handleExport('history')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 14px', background: 'transparent',
              border: 'none', cursor: 'pointer', color: '#e2e8f0', fontSize: '13px', textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <span style={{ fontSize: '16px' }}>📊</span>
            <div>
              <div style={{ fontWeight: '500' }}>Export Stage History (.csv)</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>Toàn bộ lịch sử chuyển stage</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
