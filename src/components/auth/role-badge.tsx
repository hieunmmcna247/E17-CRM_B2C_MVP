import { UserRole, ROLE_LABELS, ROLE_COLORS } from '@/types'

export function RoleBadge({ role }: { role: UserRole }) {
  const style = (role && ROLE_COLORS[role]) 
    ? ROLE_COLORS[role] 
    : { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        borderColor: style.border
      }}
    >
      {ROLE_LABELS[role] ?? role ?? 'unknown'}
    </span>
  )
}
