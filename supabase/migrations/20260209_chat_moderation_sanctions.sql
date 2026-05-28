-- Chat moderation: sanctions + warnings + enforcement trigger

create table if not exists public.chat_user_sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  sanction_type text not null check (sanction_type in ('mute', 'ban')),
  reason text null,
  expires_at timestamptz null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create index if not exists chat_user_sanctions_user_id_idx on public.chat_user_sanctions (user_id);
create index if not exists chat_user_sanctions_active_idx on public.chat_user_sanctions (user_id, sanction_type, revoked_at, expires_at);

create table if not exists public.chat_user_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  chat_id uuid null,
  warning_message text not null,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists chat_user_warnings_user_id_idx on public.chat_user_warnings (user_id);
create index if not exists chat_user_warnings_chat_id_idx on public.chat_user_warnings (chat_id);

create or replace function public.assert_chat_can_send()
returns trigger
language plpgsql
security definer
as $$
declare
  active_ban boolean;
  active_mute boolean;
begin
  -- Allow server-side/service-role inserts (e.g., moderation tooling)
  if auth.role() = 'service_role' or auth.uid() is null then
    return new;
  end if;

  select exists(
    select 1
    from public.chat_user_sanctions s
    where s.user_id = auth.uid()
      and s.sanction_type = 'ban'
      and s.revoked_at is null
      and (s.expires_at is null or s.expires_at > now())
  ) into active_ban;

  if active_ban then
    raise exception 'CHAT_BANNED';
  end if;

  select exists(
    select 1
    from public.chat_user_sanctions s
    where s.user_id = auth.uid()
      and s.sanction_type = 'mute'
      and s.revoked_at is null
      and (s.expires_at is null or s.expires_at > now())
  ) into active_mute;

  if active_mute then
    raise exception 'CHAT_MUTED';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_assert_chat_can_send on public.chat_messages;
create trigger trg_assert_chat_can_send
before insert on public.chat_messages
for each row
execute function public.assert_chat_can_send();
