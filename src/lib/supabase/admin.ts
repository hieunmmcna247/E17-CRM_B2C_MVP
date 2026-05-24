import { createClient } from '@supabase/supabase-js'

// Client dùng service_role key — chỉ dùng ở server side (API routes)
// KHÔNG bao giờ expose key này ra client/browser
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
