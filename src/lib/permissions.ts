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
  ],
  viewer: [
    'lead:view',
    'task:view',
    'dashboard:view',
    'settings:view',
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
  admin: 3,
  sales: 2,
  viewer: 1,
}

export function roleAtLeast(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole]
}