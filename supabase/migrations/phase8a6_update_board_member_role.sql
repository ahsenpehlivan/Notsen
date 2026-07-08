-- 1. update_board_member_role
create or replace function public.update_board_member_role(
  p_member_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
  v_owner_id uuid;
  v_current_role text;
  v_new_role text;
  v_user_email text;
begin
  v_new_role := lower(trim(p_role));

  -- Hedef role kontrolü
  if v_new_role not in ('editor', 'viewer') then
    raise exception 'INVALID_ROLE';
  end if;

  -- Member bilgilerini al
  select board_id, role, user_email
  into v_board_id, v_current_role, v_user_email
  from public.board_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'Kullanıcı bulunamadı.';
  end if;

  -- Board bilgilerini al
  select user_id
  into v_owner_id
  from public.boards
  where id = v_board_id;

  if not found then
    raise exception 'Pano bulunamadı.';
  end if;

  -- Sadece boards.user_id = auth.uid() olan owner role değiştirebilir.
  if v_owner_id != auth.uid() then
    raise exception 'Yalnızca pano sahibi üye yönetebilir.';
  end if;

  -- Owner'ın rolü değiştirilemez.
  if v_current_role = 'owner' then
    raise exception 'Pano sahibinin rolü değiştirilemez.';
  end if;

  -- Güncelle
  update public.board_members
  set role = v_new_role
  where id = p_member_id;

  -- Başarılı işlemden sonra activity log eklenir.
  insert into public.activity_logs (
    board_id,
    user_email,
    action,
    entity_type,
    entity_id,
    entity_title,
    metadata
  )
  values (
    v_board_id,
    auth.jwt() ->> 'email',
    'updated_member_role',
    'member',
    p_member_id::text,
    v_user_email,
    jsonb_build_object(
      'old_role', v_current_role,
      'new_role', v_new_role
    )
  );

end;
$$;

revoke execute on function public.update_board_member_role(uuid, text) from public;
revoke execute on function public.update_board_member_role(uuid, text) from anon;
grant execute on function public.update_board_member_role(uuid, text) to authenticated;


-- 2. remove_board_member
create or replace function public.remove_board_member(
  p_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
  v_owner_id uuid;
  v_current_role text;
  v_user_email text;
begin
  -- Member bilgilerini al
  select board_id, role, user_email
  into v_board_id, v_current_role, v_user_email
  from public.board_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'Kullanıcı bulunamadı.';
  end if;

  -- Board bilgilerini al
  select user_id
  into v_owner_id
  from public.boards
  where id = v_board_id;

  if not found then
    raise exception 'Pano bulunamadı.';
  end if;

  -- Sadece boards.user_id = auth.uid() olan owner remove edebilir
  if v_owner_id != auth.uid() then
    raise exception 'Yalnızca pano sahibi üye yönetebilir.';
  end if;

  -- Owner çıkarılamaz.
  if v_current_role = 'owner' then
    raise exception 'Pano sahibi çıkarılamaz.';
  end if;

  -- Sil
  delete from public.board_members
  where id = p_member_id;

  -- Başarılı işlemden sonra activity log eklenir.
  insert into public.activity_logs (
    board_id,
    user_email,
    action,
    entity_type,
    entity_id,
    entity_title,
    metadata
  )
  values (
    v_board_id,
    auth.jwt() ->> 'email',
    'removed_member',
    'member',
    p_member_id::text,
    v_user_email,
    '{}'::jsonb
  );

end;
$$;

revoke execute on function public.remove_board_member(uuid) from public;
revoke execute on function public.remove_board_member(uuid) from anon;
grant execute on function public.remove_board_member(uuid) to authenticated;
