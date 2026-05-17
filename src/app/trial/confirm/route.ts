import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
  )
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const action = searchParams.get('action')

  if (!token || action !== 'accept') {
    return NextResponse.redirect(`${APP_URL}/trial/invalid`)
  }

  const { data: confirmation } = await supabase
    .from('trial_confirmations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!confirmation) {
    return NextResponse.redirect(`${APP_URL}/trial/invalid`)
  }

  const leadId = confirmation.lead_id

  await supabase
    .from('leads')
    .update({ stage: 'Enrolled', updated_at: new Date().toISOString() })
    .eq('id', leadId)

  await supabase.from('stage_history').insert({
    lead_id: leadId,
    old_stage: 'Trial',
    new_stage: 'Enrolled',
    changed_by: null,
    reason: 'Lead tu dong dong y qua email xac nhan',
  })

  await supabase
    .from('trial_confirmations')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('token', token)

  return NextResponse.redirect(`${APP_URL}/trial/success`)
}
