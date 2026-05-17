'use client'

import { useAuth } from '@/hooks/use-auth'
import { PermissionAction } from '@/lib/permissions'

interface PermissionGateProps {
  children: React.ReactNode
  action: PermissionAction
  fallback?: React.ReactNode
}

/**
 * Component bọc các UI cần phân quyền.
 * Nếu user có quyền thực hiện 'action', hiển thị children.
 * Ngược lại hiển thị fallback (mặc định là null).
 */
export function PermissionGate({ children, action, fallback = null }: PermissionGateProps) {
  const { can, loading } = useAuth()

  if (loading) return null
  
  if (!can(action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
