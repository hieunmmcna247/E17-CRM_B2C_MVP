import { notFound, redirect } from 'next/navigation'
import { InvoiceDetailClient } from '@/components/invoices/invoice-detail-client'
import { createClient } from '@/lib/supabase/server'
import { getAllowedCourseIds } from '@/lib/data-filters'
import { UserProfile } from '@/types'

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string }
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

  if (!currentProfile) {
    notFound()
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, course_id')
    .eq('id', params.id)
    .single()

  if (!invoice) {
    notFound()
  }

  if (currentProfile.role === 'sales') {
    const assignedCourses = currentProfile.assigned_courses ?? []

    if (assignedCourses.length === 0) {
      notFound()
    } else {
      const { data: allCourses } = await supabase
        .from('courses')
        .select('id, name, code')

      const allowedCourseIds = getAllowedCourseIds(assignedCourses, allCourses ?? [])
      if (allowedCourseIds.length === 0 || !allowedCourseIds.includes(invoice.course_id)) {
        notFound()
      }
    }
  }

  return <InvoiceDetailClient invoiceId={params.id} />
}
