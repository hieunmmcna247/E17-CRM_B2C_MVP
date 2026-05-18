import { UserRole } from '@/types'
import { hasPermission } from './permissions'

type Stage = 'New' | 'Contacted' | 'Consulting' | 'Trial' | 'Enrolled' | 'Dropped'

// ── Stage Order ───────────────────────────────────────────────────────────────
const STAGE_ORDER: Stage[] = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled']

function getStageIndex(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage)
}

// ── Transition Rules ──────────────────────────────────────────────────────────

/**
 * Whether a user with the given role can move a lead from `from` to `to`.
 *
 * Rules:
 *  - Admin: tự do di chuyển mọi chiều
 *  - Sales: chỉ tiến về phía trước, bao gồm cả Trial → Enrolled
 *  - Sales: luôn có thể chuyển sang Dropped
 *  - Viewer: không được kéo thả
 */
export function canTransition(role: UserRole, from: Stage, to: Stage): boolean {
  if (from === to) return false

  // Viewer — không được kéo thả
  if (!hasPermission(role, 'pipeline:drag_drop')) return false

  // Admin — tự do hoàn toàn
  if (
    hasPermission(role, 'stage:change_backwards') &&
    hasPermission(role, 'stage:change_to_enrolled')
  ) {
    return true
  }

  // Sales có thể Dropped bất kỳ lead nào
  if (to === 'Dropped') return true

  // Sales có thể chuyển sang Enrolled nếu có permission
  if (to === 'Enrolled') {
    return hasPermission(role, 'stage:change_to_enrolled')
  }

  // Forward-only: toIdx > fromIdx (các stage thông thường)
  const fromIdx = getStageIndex(from)
  const toIdx = getStageIndex(to)

  if (fromIdx === -1 || toIdx === -1) return false
  if (from === 'Dropped') return false // Sales không thể kéo ra khỏi Dropped

  return toIdx > fromIdx
}

/**
 * Danh sách stage mà user có thể chuyển đến từ stage hiện tại.
 */
export function getAllowedTransitions(role: UserRole, from: Stage): Stage[] {
  const allStages: Stage[] = ['New', 'Contacted', 'Consulting', 'Trial', 'Enrolled', 'Dropped']
  return allStages.filter((to) => canTransition(role, from, to))
}

/**
 * Chuyển sang Enrolled có cần admin duyệt không.
 * Hiện tại: Sales được phép chuyển thẳng, không cần approval.
 * Nếu sau này muốn bật lại approval workflow thì sửa hàm này.
 */
export function requiresApproval(_role: UserRole, _to: Stage): boolean {
  return false
}

/**
 * Chuyển sang stage này có cần nhập lý do không.
 */
export function requiresReason(to: Stage): boolean {
  return to === 'Dropped'
}

/**
 * Thông báo lỗi khi không được phép chuyển stage.
 */
export function getTransitionBlockReason(role: UserRole, from: Stage, to: Stage): string {
  if (role === 'viewer') return 'Viewer không có quyền thay đổi stage.'
  if (from === 'Dropped') return 'Không thể chuyển lead ra khỏi trạng thái Dropped.'
  const fromIdx = getStageIndex(from)
  const toIdx = getStageIndex(to)
  if (fromIdx !== -1 && toIdx !== -1 && toIdx < fromIdx) {
    return 'Sales chỉ có thể chuyển stage tiến về phía trước.'
  }
  return 'Không được phép thực hiện thao tác này.'
}