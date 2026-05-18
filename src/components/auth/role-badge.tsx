import { UserRole, ROLE_LABELS, ROLE_COLORS } from '@/types'

export function RoleBadge({ role }: { role: UserRole }) {
  const style = ROLE_COLORS[role]
  
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        borderColor: style.border
      }}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
