import { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { UserProfile } from '@/types'

export function applyLeadFilter<T extends Record<string, any>>(
  query: PostgrestFilterBuilder<any, T, any>,
  profile: UserProfile | null
) {
  if (!profile) return query
  // Admin, viewer, manager: xem tất cả lead
  if (profile.role === 'admin' || profile.role === 'viewer' || profile.role === 'manager') return query

  // Marketing: chỉ thấy lead do mình tạo
  if (profile.role === 'marketing') {
    return query.eq('created_by', profile.id)
  }

  // Sales: chỉ thấy lead được giao hoặc đúng khóa học
  if (profile.role === 'sales') {
    const courses = profile.assigned_courses ?? []
    if (courses.length === 0) {
      return query.eq('assigned_to', profile.id)
    }
    const courseFilter = courses.map((c: string) => `course_interest.eq.${c}`).join(',')
    return query.or(`${courseFilter},assigned_to.eq.${profile.id}`)
  }

  return query
}

export function applyTaskFilter<T extends Record<string, any>>(
  query: PostgrestFilterBuilder<any, T, any>,
  profile: UserProfile | null
) {
  if (!profile) return query
  // Admin, viewer, manager: xem tất cả task
  if (profile.role === 'admin' || profile.role === 'viewer' || profile.role === 'manager') return query

  // Sales & marketing: chỉ thấy task được giao
  if (profile.role === 'sales' || profile.role === 'marketing') {
    return query.eq('assigned_to', profile.id)
  }

  return query
}

export function isAllowedLead(lead: any, profile: UserProfile | null): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'viewer' || profile.role === 'manager') return true

  if (profile.role === 'marketing') {
    return lead.created_by === profile.id
  }

  if (profile.role === 'sales') {
    const courses = profile.assigned_courses || []
    return courses.includes(lead.course_interest) || lead.assigned_to === profile.id
  }

  return false
}