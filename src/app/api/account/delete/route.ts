import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  }

  const { error: boardsError } = await supabase
    .from('boards')
    .delete()
    .eq('user_id', user.id);

  if (boardsError) {
    return NextResponse.json({ error: boardsError.message }, { status: 500 });
  }

  if (user.email) {
    await supabase.from('board_members').delete().eq('user_email', user.email);
  }

  let authDeleted = false;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    authDeleted = !deleteError;
  }

  await supabase.auth.signOut();

  return NextResponse.json({
    success: true,
    authDeleted,
    message: authDeleted
      ? 'Hesabınız ve tüm verileriniz silindi.'
      : 'Panolarınız ve üyelikleriniz silindi. Auth kaydı için yönetici anahtarı gerekli.',
  });
}
