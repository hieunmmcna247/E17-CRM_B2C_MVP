import { redirect } from 'next/navigation'
import { InvoicesPageClient } from '@/components/invoices/invoices-page-client'
import { createClient } from '@/lib/supabase/server'
import { getAllowedCourseIds } from '@/lib/data-filters'
import { UserProfile } from '@/types'

function parseStatus(value: string | string[] | undefined) {
  if (value === 'draft' || value === 'sent' || value === 'partial' || value === 'paid' || value === 'overdue' || value === 'cancelled') {
    return value
  }
  return 'all'
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const currentProfile = (profile as UserProfile | null) ?? null

  let courseIds: string[] | undefined = undefined

  if (currentProfile?.role === 'sales') {
    const assignedCourses = currentProfile.assigned_courses ?? []

    if (assignedCourses.length === 0) {
      courseIds = []
    } else {
      const { data: allCourses } = await supabase
        .from('courses')
        .select('id, name, code')

      courseIds = getAllowedCourseIds(assignedCourses, allCourses ?? [])
    }
  }

  const status = parseStatus(searchParams.status)
  const month = typeof searchParams.month === 'string' ? searchParams.month : ''

  return (
    <InvoicesPageClient
      courseIds={courseIds}
      initialStatus={status}
      initialMonth={month}
    />
  )
}
