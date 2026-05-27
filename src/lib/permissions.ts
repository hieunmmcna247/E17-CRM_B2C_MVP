import { UserRole } from '@/types'

// ── Permission Actions ────────────────────────────────────────────────────────
export type PermissionAction =
  // Lead actions
  | 'lead:create'
  | 'lead:edit'
  | 'lead:delete'
  | 'lead:view'
  | 'lead:assign'
  | 'lead:export'
  // Stage actions
  | 'stage:change'
  | 'stage:change_to_enrolled'
  | 'stage:change_backwards'
  | 'stage:approve'
  // Task actions
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:assign'
  | 'task:view'
  // Settings
  | 'settings:view'
  | 'settings:manage_users'
  // Dashboard
  | 'dashboard:view'
  | 'dashboard:export'
  // Pipeline
  | 'pipeline:drag_drop'
  // Invoices & payments
  | 'invoice:view'
  | 'invoice:create'
  | 'invoice:edit'
  | 'invoice:delete'
  | 'payment:record'

// ── Permission Matrix ─────────────────────────────────────────────────────────
const PERMISSION_MATRIX: Record<UserRole, PermissionAction[]> = {
  admin: [
    'lead:create',
    'lead:edit',
    'lead:delete',
    'lead:view',
    'lead:assign',
    'lead:export',
    'stage:change',
    'stage:change_to_enrolled',
    'stage:change_backwards',
    'stage:approve',
    'task:create',
    'task:edit',
    'task:delete',
    'task:assign',
    'task:view',
    'settings:view',
    'settings:manage_users',
    'dashboard:view',
    'dashboard:export',
    'pipeline:drag_drop',
    'invoice:view',
    'invoice:create',
    'invoice:edit',
    'invoice:delete',
    'payment:record',
  ],
  // Manager: xem toàn bộ lead + phân chia lead cho sales, không thêm lead
  manager: [
    'lead:view',
    'lead:assign',   // Quyền chính: phân chia lead cho sales
    'lead:edit',
    'lead:export',
    'lead:delete',
    'stage:change',
    'stage:change_backwards',
    'stage:approve',
    'task:create',
    'task:edit',
    'task:delete',
    'task:assign',
    'task:view',
    'dashboard:view',
    'dashboard:export',
    'pipeline:drag_drop',
    // Không có settings:view — Manager không thấy trang Cài đặt
  ],
  // Marketing: nhập/thêm lead, không phân chia lead cho sales
  marketing: [
    'lead:create',   // Quyền chính: tạo/nhập lead mới
    'lead:edit',
    'lead:view',
    'lead:export',
    'stage:change',
    'task:view',
    'dashboard:view',
    'pipeline:drag_drop',
  ],
  sales: [
    'lead:create',
    'lead:edit',
    'lead:view',
    'lead:export',
    'stage:change',
    'stage:change_to_enrolled', // Sales được phép chuyển Trial → Enrolled
    'task:create',
    'task:edit',
    'task:view',
    'task:assign',
    'dashboard:view',
    'pipeline:drag_drop',
    'invoice:view',
    'payment:record',
  ],
  viewer: [
    'lead:view',
    'task:view',
    'dashboard:view',
    'settings:view',
    'invoice:view',
  ],
}

// ── Public API ────────────────────────────────────────────────────────────────

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  return PERMISSION_MATRIX[role]?.includes(action) ?? false
}

export function getPermissions(role: UserRole): PermissionAction[] {
  return PERMISSION_MATRIX[role] ?? []
}

export function hasAllPermissions(role: UserRole, actions: PermissionAction[]): boolean {
  return actions.every((action) => hasPermission(role, action))
}

export function hasAnyPermission(role: UserRole, actions: PermissionAction[]): boolean {
  return actions.some((action) => hasPermission(role, action))
}

// ── Role hierarchy ────────────────────────────────────────────────────────────
const ROLE_RANK: Record<UserRole, number> = {
  admin:     4,
  manager:   3,
  marketing: 2,
  sales:     2,
  viewer:    1,
}

export function roleAtLeast(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole]
}