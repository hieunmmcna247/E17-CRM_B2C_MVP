import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL

  const { data: leads, error } = await supabase.rpc('get_expired_trial_leads')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!leads || leads.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Khong co lead nao het han' })
  }

  let sent = 0
  const errors: string[] = []

  for (const lead of leads) {
    try {
      const { data: confirmation, error: insertError } = await supabase
        .from('trial_confirmations')
        .insert({ lead_id: lead.lead_id })
        .select('token')
        .single()

      if (insertError || !confirmation) {
        errors.push(`${lead.lead_name}: ${insertError?.message}`)
        continue
      }

      const acceptUrl = `${APP_URL}/trial/confirm?token=${confirmation.token}&action=accept`
      const courseName = lead.lead_course || 'khoa hoc tai MCNA'

      const { error: emailError } = await resend.emails.send({
        from: 'MCNA <onboarding@resend.dev>',
        to: lead.lead_email,
        subject: `Loi moi dang ky chinh thuc - ${courseName}`,
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0c10;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#0f1219;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1d4ed8,#6366f1);padding:32px 40px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#fff;">E17 CRM</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">MCNA EDUCATION</div>
    </div>
    <div style="padding:40px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Xin chao,</p>
      <h2 style="color:#fff;font-size:20px;margin:0 0 20px;">${lead.lead_name}</h2>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 16px;">
        3 ngay trai nghiem <strong style="color:#fff;">${courseName}</strong> cua ban tai MCNA da ket thuc.
      </p>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 32px;">
        Ban co muon <strong style="color:#4ade80;">chinh thuc dang ky ${courseName}</strong> khong?
      </p>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;text-decoration:none;">
          Dong y - Dang ky ngay
        </a>
      </div>
      <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
        Lien ket se het han sau <strong style="color:#64748b;">48 gio</strong>.
      </p>
    </div>
    <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="color:#334155;font-size:11px;margin:0;">MCNA Education Group | E17 CRM</p>
    </div>
  </div>
</body></html>`
      })

      if (emailError) {
        errors.push(`${lead.lead_name}: ${emailError.message}`)
      } else {
        sent++
      }
    } catch (err: any) {
      errors.push(`${lead.lead_name}: ${err.message}`)
    }
  }

  return NextResponse.json({ sent, total: leads.length, errors })
}