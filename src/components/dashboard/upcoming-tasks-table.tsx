'use client'

export interface UpcomingTaskItem {
  id: string
  title: string
  lead_name: string
  assigned_name: string
  due_date: string
  status: string
  priority: string
}

interface UpcomingTasksTableProps {
  data: UpcomingTaskItem[]
}

const PRIORITY_BADGES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    label: 'Cao',
  },
  medium: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    label: 'Trung bình',
  },
  low: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    text: 'text-slate-400',
    label: 'Thấp',
  },
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
}

function getDueDateStyle(dueDateStr: string, status: string) {
  if (status === 'done') return 'text-slate-500'
  
  const today = new Date('2026-05-24T00:00:00Z') // Anchored to current time metadata
  const due = new Date(dueDateStr)
  
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const dueTime = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
  const oneDay = 24 * 60 * 60 * 1000

  if (dueTime < todayTime) {
    return 'text-red-400 font-semibold' // Overdue
  } else if (dueTime === todayTime || dueTime === todayTime + oneDay) {
    return 'text-amber-400 font-semibold' // Due today or tomorrow
  }
  return 'text-slate-400'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function UpcomingTasksTable({ data }: UpcomingTasksTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Không có nhiệm vụ sắp tới
      </div>
    )
  }

  return (
    <div className="h-[220px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/[0.04] text-slate-500 font-semibold uppercase tracking-wider">
            <th className="py-2.5 px-3">Nhiệm vụ</th>
            <th className="py-2.5 px-3">Học viên</th>
            <th className="py-2.5 px-3">Phụ trách</th>
            <th className="py-2.5 px-3">Hạn chót</th>
            <th className="py-2.5 px-3 text-right">Mức độ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.02]">
          {data.slice(0, 5).map((task) => {
            const badge = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.low
            const dateStyle = getDueDateStyle(task.due_date, task.status)
            
            return (
              <tr
                key={task.id}
                className="hover:bg-white/[0.02] transition-colors group"
              >
                <td className="py-2 px-3 text-white font-medium max-w-[120px] truncate">
                  {task.title}
                  <span className="block text-[10px] text-slate-500 mt-0.5 font-normal">
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-300 max-w-[100px] truncate">
                  {task.lead_name}
                </td>
                <td className="py-2 px-3 text-slate-300 max-w-[90px] truncate">
                  {task.assigned_name}
                </td>
                <td className={`py-2 px-3 ${dateStyle}`}>
                  {formatDate(task.due_date)}
                </td>
                <td className="py-2 px-3 text-right">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
