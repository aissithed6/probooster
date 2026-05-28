-- RLS for 1-to-1 chats (user_chats + chat_messages)
-- Business rule:
-- - Client can start a conversation with any vendor.
-- - Vendor cannot create new conversations (can only reply in existing ones).
-- - Only participants (or super_admin/service_role) can read/write.

-- Helper: is participant of a chat
create or replace function public.is_user_chat_participant(p_chat_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.user_chats c
    where c.id = p_chat_id
      and (c.participant1_id = p_uid or c.participant2_id = p_uid)
  );
$$;

-- Helper: role checks
create or replace function public.is_super_admin_uid(p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.users u
    where u.id = p_uid
      and lower(replace(coalesce(u.role, ''), '-', '_')) in ('super_admin', 'superadmin', 'admin')
  );
$$;

create or replace function public.is_client_uid(p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.users u
    where u.id = p_uid
      and lower(replace(coalesce(u.role, ''), '-', '_')) in ('client', 'customer', 'buyer')
  );
$$;

create or replace function public.is_vendor_uid(p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.users u
    where u.id = p_uid
      and lower(replace(coalesce(u.role, ''), '-', '_')) in ('vendor', 'seller')
  );
$$;

create or replace function public.is_vendor_or_super_admin_uid(p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select public.is_vendor_uid(p_uid) or public.is_super_admin_uid(p_uid);
$$;

-- Enable RLS
alter table if exists public.user_chats enable row level security;
alter table if exists public.chat_messages enable row level security;

-- user_chats
-- Select: participants or super admin
drop policy if exists "user_chats_select_participants" on public.user_chats;
create policy "user_chats_select_participants"
on public.user_chats
for select
using (
  public.is_super_admin_uid(auth.uid())
  or public.is_user_chat_participant(user_chats.id, auth.uid())
);

-- Insert: only client can create, and must create with a vendor
drop policy if exists "user_chats_insert_client_to_vendor" on public.user_chats;
create policy "user_chats_insert_client_to_vendor"
on public.user_chats
for insert
with check (
  auth.role() = 'service_role'
  or (
    auth.uid() is not null
    and participant1_id = auth.uid()
    and public.is_client_uid(auth.uid())
    and public.is_vendor_or_super_admin_uid(participant2_id)
  )
);

-- Update: participants (and super admin/service_role)
drop policy if exists "user_chats_update_participants" on public.user_chats;
create policy "user_chats_update_participants"
on public.user_chats
for update
using (
  auth.role() = 'service_role'
  or public.is_super_admin_uid(auth.uid())
  or public.is_user_chat_participant(user_chats.id, auth.uid())
)
with check (
  auth.role() = 'service_role'
  or public.is_super_admin_uid(auth.uid())
  or public.is_user_chat_participant(user_chats.id, auth.uid())
);

-- chat_messages
-- Select: participants of the chat or super admin
drop policy if exists "chat_messages_select_participants" on public.chat_messages;
create policy "chat_messages_select_participants"
on public.chat_messages
for select
using (
  public.is_super_admin_uid(auth.uid())
  or public.is_user_chat_participant(chat_messages.chat_id, auth.uid())
);

-- Insert: sender must be auth.uid and be a participant of chat
drop policy if exists "chat_messages_insert_participant" on public.chat_messages;
create policy "chat_messages_insert_participant"
on public.chat_messages
for insert
with check (
  auth.role() = 'service_role'
  or (
    auth.uid() is not null
    and sender_id = auth.uid()
    and (public.is_super_admin_uid(auth.uid()) or public.is_user_chat_participant(chat_id, auth.uid()))
  )
);

-- Update: participants can mark is_read (and moderation tooling)
drop policy if exists "chat_messages_update_participant" on public.chat_messages;
create policy "chat_messages_update_participant"
on public.chat_messages
for update
using (
  auth.role() = 'service_role'
  or public.is_super_admin_uid(auth.uid())
  or public.is_user_chat_participant(chat_messages.chat_id, auth.uid())
)
with check (
  auth.role() = 'service_role'
  or public.is_super_admin_uid(auth.uid())
  or public.is_user_chat_participant(chat_messages.chat_id, auth.uid())
);

-- Realtime publication (best-effort)
do $$
begin
  alter publication supabase_realtime add table public.user_chats;
exception when others then
  -- ignore
end $$;

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception when others then
  -- ignore
end $$;
