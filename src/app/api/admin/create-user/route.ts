import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // 1. Xác minh người gọi là admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền tạo tài khoản' }, { status: 403 })
    }

    // 2. Lấy dữ liệu từ request
    const { full_name, email, password, role } = await req.json()

    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 })
    }

    const validRoles = ['admin', 'manager', 'marketing', 'sales', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 })
    }

    // 3. Tạo user trong Supabase Auth bằng admin client
    const adminClient = createAdminClient()
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Bỏ qua bước xác nhận email
      user_metadata: { full_name },
    })

    if (createError) {
      // Xử lý lỗi email đã tồn tại
      if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Email này đã được sử dụng' }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // 4. Tạo hoặc cập nhật user_profile
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .upsert({
        id: newUser.user.id,
        email,
        full_name,
        role,
        assigned_courses: [],
        avatar_url: null,
      })

    if (profileError) {
      // Rollback: xóa user vừa tạo nếu tạo profile thất bại
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: 'Không thể tạo hồ sơ người dùng: ' + profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: { id: newUser.user.id, email, full_name, role },
    })
  } catch (err) {
    console.error('create-user error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
