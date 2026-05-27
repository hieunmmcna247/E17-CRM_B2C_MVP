export interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  course_interest: string | null
  source:
  | 'Facebook Ads'
  | 'Google Ads'
  | 'Zalo'
  | 'TikTok'
  | 'Website'
  | 'Referral'
  | 'Event'
  | 'Other'
  stage: 'New' | 'Contacted' | 'Consulting' | 'Trial' | 'Enrolled' | 'Dropped'
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface StageHistory {
  id: string
  lead_id: string
  old_stage: string
  new_stage: string
  changed_by: string | null
  changed_at: string
  reason: string | null
}

export interface Interaction {
  id: string
  lead_id: string
  note: string
  created_by: string | null
  created_at: string
}

// ── Role & Permission ─────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'manager' | 'marketing' | 'sales' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  assigned_courses: string[] | null
  avatar_url: string | null
  created_at: string
}

// ── Invoices & Payments ──────────────────────────────────────────────────────
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'momo' | 'vnpay' | 'other'

export interface Course {
  id: string
  name: string
  code: string
  category: string
  level: string | null
  duration_weeks: number | null
  price: number
  max_students: number | null
  description: string | null
  status: 'active' | 'inactive' | 'upcoming'
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  method: PaymentMethod
  paid_at: string
  note: string | null
  recorded_by: string | null
  created_at: string
  recorder?: Pick<UserProfile, 'id' | 'full_name'> | null
}

export interface Invoice {
  id: string
  enrollment_id: string
  lead_id: string
  course_id: string
  invoice_number: string
  total_amount: number
  discount: number
  final_amount: number
  status: InvoiceStatus
  due_date: string | null
  note: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  lead?: Pick<Lead, 'id' | 'name' | 'phone' | 'email'> | null
  course?: Pick<Course, 'id' | 'name' | 'code'> | null
  payments?: Payment[]
}

// ── Task Workflow ─────────────────────────────────────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'pending_approval' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WorkflowTask {
  id: string
  title: string
  description: string | null
  lead_id: string | null
  assigned_to: string | null
  assigned_to_name: string | null
  created_by: null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  notes: Array<{ text: string; by: string; by_id: string; by_role?: string; at: string }> | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  // Joined — thêm course_interest để filterTasksClientSide hoạt động
  lead?: Pick<Lead, 'id' | 'name' | 'stage' | 'course_interest' | 'phone' | 'email'> | null
  assignee?: Pick<UserProfile, 'id' | 'full_name' | 'email'> | null
}

// ── Notification ──────────────────────────────────────────────────────────────
export type NotificationType =
  | 'stage_changed'
  | 'lead_assigned'
  | 'task_assigned'
  | 'task_due_soon'
  | 'lead_created'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  entity_type: 'lead' | 'task' | null
  entity_id: string | null
  created_at: string
}

// ── Approval Workflow ─────────────────────────────────────────────────────────
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface StageApproval {
  id: string
  lead_id: string
  requested_by: string
  reviewed_by: string | null
  from_stage: string
  to_stage: string
  status: ApprovalStatus
  note: string | null
  created_at: string
  updated_at: string
  // Joined
  lead?: Pick<Lead, 'id' | 'name' | 'stage'> | null
  requester?: Pick<UserProfile, 'id' | 'full_name'> | null
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const STAGES = [
  'New',
  'Contacted',
  'Consulting',
  'Trial',
  'Enrolled',
  'Dropped',
] as const
export type Stage = (typeof STAGES)[number]

export const SOURCES = [
  'Facebook Ads',
  'Google Ads',
  'Zalo',
  'TikTok',
  'Website',
  'Referral',
  'Event',
  'Other',
] as const

export const DROPPED_REASONS = [
  'Lý do giá',
  'Không sắp xếp được lịch',
  'Chọn đối thủ khác',
  'Không có nhu cầu',
  'Không liên lạc được',
  'Khác',
] as const

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  marketing: 'Marketing',
  sales: 'Sales',
  viewer: 'Viewer',
}

export const ROLE_COLORS: Record<UserRole, { bg: string; color: string; border: string }> = {
  admin:     { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)'  },
  manager:   { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', border: 'rgba(34,197,94,0.3)'   },
  marketing: { bg: 'rgba(236,72,153,0.15)',  color: '#ec4899', border: 'rgba(236,72,153,0.3)'  },
  sales:     { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c', border: 'rgba(251,146,60,0.3)'  },
  viewer:    { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
}


// Fix: thêm dấu tiếng Việt
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  pending_approval: 'Chờ duyệt',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Nháp',
  sent: 'Đã gửi',
  partial: 'Đã cọc',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
  cancelled: 'Đã huỷ',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, { bg: string; color: string }> = {
  draft: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  sent: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  partial: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  paid: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  overdue: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  cancelled: { bg: 'rgba(100,116,139,0.10)', color: '#475569' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPay',
  other: 'Khác',
}