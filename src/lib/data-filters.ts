import { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { Course, UserProfile } from '@/types'

const COURSE_ALIAS_MAP: Record<string, string[]> = {
  'ielts prep': ['ielts preparation', 'ielts'],
  'ielts preparation': ['ielts prep', 'ielts'],
  'web development': ['web dev'],
  'data science': ['data science'],
  'machine learning': ['ml'],
  'python data analysis': ['python analytics'],
  'business english': ['business english'],
  'ui ux design': ['ui/ux design', 'ux/ui design', 'uiux design'],
}

export function normalizeCourseKey(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function getCourseAliasValues(value: string | null | undefined) {
  const normalized = normalizeCourseKey(value)
  if (!normalized) {
    return []
  }

  const aliases = new Set<string>([normalized])

  const directAliases = COURSE_ALIAS_MAP[normalized] ?? []
  directAliases.forEach((alias) => aliases.add(normalizeCourseKey(alias)))

  return [...aliases]
}

export function expandCourseFilterValues(values: Array<string | null | undefined>) {
  const unique = new Set<string>()

  values.forEach((value) => {
    getCourseAliasValues(value).forEach((alias) => unique.add(alias))
  })

  return [...unique]
}

export function matchesCourseInterest(value: string | null | undefined, target: string | null | undefined) {
  if (!value || !target) {
    return false
  }

  const normalizedValue = normalizeCourseKey(value)
  const normalizedTarget = normalizeCourseKey(target)

  if (!normalizedValue || !normalizedTarget) {
    return false
  }

  if (normalizedValue === normalizedTarget) {
    return true
  }

  const valueAliases = getCourseAliasValues(value)
  const targetAliases = getCourseAliasValues(target)

  if (valueAliases.includes(normalizedTarget) || targetAliases.includes(normalizedValue)) {
    return true
  }

  if (normalizedValue.includes(normalizedTarget) || normalizedTarget.includes(normalizedValue)) {
    return true
  }

  const valueTokens = normalizedValue.split(' ').filter(Boolean)
  const targetTokens = normalizedTarget.split(' ').filter(Boolean)

  return targetTokens.length > 0 && targetTokens.every((token) => valueTokens.includes(token))
}

export function findCourseMatch<T extends Pick<Course, 'id' | 'name' | 'code'>>(
  courseInterest: string | null | undefined,
  courses: T[]
) {
  if (!courseInterest) {
    return undefined
  }

  return courses.find((course) => {
    return (
      matchesCourseInterest(course.name, courseInterest) ||
      matchesCourseInterest(course.code, courseInterest)
    )
  })
}

export function getAllowedCourseIds<T extends Pick<Course, 'id' | 'name' | 'code'>>(
  assignedCourses: Array<string | null | undefined>,
  courses: T[]
) {
  return courses
    .filter((course) => {
      return assignedCourses.some((assignedCourse) => {
        return (
          matchesCourseInterest(course.name, assignedCourse) ||
          matchesCourseInterest(course.code, assignedCourse)
        )
      })
    })
    .map((course) => course.id)
}

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

    const courseFilter = expandCourseFilterValues(courses)
      .map((course) => `course_interest.eq.${course}`)
      .join(',')

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
    return courses.some((course: string | null | undefined) => matchesCourseInterest(lead.course_interest, course)) || lead.assigned_to === profile.id
  }

  return false
}