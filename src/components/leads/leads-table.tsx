'use client'
import { useRouter } from 'next/navigation'
import { Lead } from '@/types'

const STAGE_BADGE: Record<string, { bg: string; color: string }> = {
  New: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
  Contacted: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
  Qualified: { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  Proposal: { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308' },
  Consulting: { bg: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6' },
  Trial: { bg: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' },
  Won: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
  Enrolled: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
  Lost: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
  Dropped: { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b' },
}

const SOURCE_COLOR: Record<string, string> = {
  'Facebook Ads': '#60a5fa',
  'Google Ads': '#fbbf24',
  'Zalo': '#4ade80',
  'TikTok': '#f472b6',
  'Website': '#818cf8',
  'Referral': '#34d399',
  'Event': '#fb923c',
  'Other': '#94a3b8',
}

const AVATAR_GRADIENTS_TBL = [
  ['#3b82f6', '#6366f1'],
  ['#8b5cf6', '#ec4899'],
  ['#14b8a6', '#3b82f6'],
  ['#f59e0b', '#ef4444'],
  ['#22c55e', '#14b8a6'],
  ['#6366f1', '#8b5cf6'],
]
function getTableAvatar(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS_TBL.length
  const [a, b] = AVATAR_GRADIENTS_TBL[idx]
  return `linear-gradient(135deg, ${a}, ${b})`
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter()

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Chưa có Lead nào</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Nhấn "+ New Lead" để thêm khách hàng đầu tiên</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        {/* Header */}
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Ho ten', 'SDT', 'Khoa hoc', 'Nguon', 'Stage', 'Ngay tao'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: '#475569', background: '#0a0c10' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {leads.map((lead, i) => (
            <tr
              key={lead.id}
              className="cursor-pointer group transition-all"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                borderLeft: '2px solid transparent',
                transition: 'background .15s, border-left-color .15s',
              }}
              onClick={() => router.push(`/leads/${lead.id}`)}
              onMouseEnter={(e) => {
                const row = e.currentTarget as HTMLTableRowElement
                row.style.background = 'rgba(59,130,246,0.05)'
                row.style.borderLeftColor = '#3b82f6'
              }}
              onMouseLeave={(e) => {
                const row = e.currentTarget as HTMLTableRowElement
                row.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                row.style.borderLeftColor = 'transparent'
              }}
            >
              {/* Name */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                    style={{
                      background: getTableAvatar(lead.name),
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
                    {lead.name}
                  </span>
                </div>
              </td>

              {/* Phone */}
              <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                {lead.phone || '—'}
              </td>

              {/* Course Interest */}
              <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                {lead.course_interest || '—'}
              </td>

              {/* Source */}
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: SOURCE_COLOR[lead.source] ?? '#94a3b8' }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ background: SOURCE_COLOR[lead.source] ?? '#94a3b8' }}
                  />
                  {lead.source}
                </span>
              </td>

              {/* Stage */}
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: (STAGE_BADGE[lead.stage] || STAGE_BADGE['New']).bg,
                    color: (STAGE_BADGE[lead.stage] || STAGE_BADGE['New']).color,
                  }}
                >
                  {lead.stage}
                </span>
              </td>

              {/* Created At */}
              <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>
                {formatDate(lead.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}