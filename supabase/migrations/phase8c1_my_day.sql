-- Phase 8C-1: My Day implementation

create table if not exists public.task_daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  planned_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, task_id, planned_date)
);

create index if not exists idx_task_daily_plans_user_date
on public.task_daily_plans(user_id, planned_date);

alter table public.task_daily_plans enable row level security;

drop policy if exists "Kullanicilar kendi planlarini gorebilir"
on public.task_daily_plans;

create policy "Kullanicilar kendi planlarini gorebilir"
on public.task_daily_plans
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Kullanicilar erisebildigi gorevleri planlayabilir"
on public.task_daily_plans;

create policy "Kullanicilar erisebildigi gorevleri planlayabilir"
on public.task_daily_plans
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.tasks t
    where t.id = task_daily_plans.task_id
      and (
        public.is_board_owner(t.board_id)
        or public.is_board_viewer_or_editor(t.board_id)
      )
  )
);

drop policy if exists "Kullanicilar kendi planlarini silebilir"
on public.task_daily_plans;

create policy "Kullanicilar kendi planlarini silebilir"
on public.task_daily_plans
for delete
to authenticated
using (user_id = auth.uid());
