-- Advanced delivery chat features: reply, voice messages, receipts (delivered/read)

-- 1) Extend messages table for replies + voice metadata
alter table if exists public.delivery_chat_messages
add column if not exists reply_to_message_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'delivery_chat_messages_reply_fk'
  ) then
    alter table public.delivery_chat_messages
    add constraint delivery_chat_messages_reply_fk
    foreign key (reply_to_message_id) references public.delivery_chat_messages(id) on delete set null;
  end if;
end $$;

alter table if exists public.delivery_chat_messages
add column if not exists audio_url text null;

alter table if exists public.delivery_chat_messages
add column if not exists audio_duration_ms integer null;

-- Expand message types
do $$
begin
  alter table public.delivery_chat_messages
  drop constraint if exists delivery_chat_messages_message_type_check;
exception when others then
  -- ignore
end $$;

alter table if exists public.delivery_chat_messages
add constraint delivery_chat_messages_message_type_check
check (message_type in ('text', 'system', 'voice'));

create index if not exists delivery_chat_messages_reply_to_idx
on public.delivery_chat_messages (reply_to_message_id);

-- 2) Receipts (delivered/read) per user per message
create table if not exists public.delivery_chat_message_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.delivery_chat_messages(id) on delete cascade,
  conversation_id uuid not null references public.delivery_chat_conversations(id) on delete cascade,
  user_id uuid not null,
  delivered_at timestamptz not null default now(),
  read_at timestamptz null,
  unique(message_id, user_id)
);

create index if not exists delivery_chat_message_receipts_message_idx
on public.delivery_chat_message_receipts (message_id);

create index if not exists delivery_chat_message_receipts_conversation_user_idx
on public.delivery_chat_message_receipts (conversation_id, user_id);

create index if not exists delivery_chat_message_receipts_read_at_idx
on public.delivery_chat_message_receipts (read_at);

-- 3) Auto-create receipts on insert (for all participants except sender)
create or replace function public.create_delivery_chat_receipts_for_message()
returns trigger
language plpgsql
security definer
as $$
declare
  p record;
begin
  for p in
    select dp.user_id
    from public.delivery_chat_participants dp
    where dp.conversation_id = new.conversation_id
      and dp.user_id <> new.sender_id
  loop
    insert into public.delivery_chat_message_receipts (message_id, conversation_id, user_id, delivered_at)
    values (new.id, new.conversation_id, p.user_id, now())
    on conflict (message_id, user_id) do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_create_delivery_chat_receipts on public.delivery_chat_messages;
create trigger trg_create_delivery_chat_receipts
after insert on public.delivery_chat_messages
for each row
execute function public.create_delivery_chat_receipts_for_message();

-- 4) Enable RLS + policies for receipts
alter table public.delivery_chat_message_receipts enable row level security;

-- Read: participants or super admin
drop policy if exists "delivery_chat_message_receipts_select" on public.delivery_chat_message_receipts;
create policy "delivery_chat_message_receipts_select"
on public.delivery_chat_message_receipts
for select
using (
  public.is_super_admin_uid(auth.uid())
  or public.is_delivery_chat_participant(delivery_chat_message_receipts.conversation_id, auth.uid())
);

-- Insert: only yourself, and you must be a participant (for backfill from clients)
drop policy if exists "delivery_chat_message_receipts_insert" on public.delivery_chat_message_receipts;
create policy "delivery_chat_message_receipts_insert"
on public.delivery_chat_message_receipts
for insert
with check (
  user_id = auth.uid()
  and (public.is_super_admin_uid(auth.uid()) or public.is_delivery_chat_participant(conversation_id, auth.uid()))
);

-- Update: only your own receipt (mark as read), participant required
drop policy if exists "delivery_chat_message_receipts_update_own" on public.delivery_chat_message_receipts;
create policy "delivery_chat_message_receipts_update_own"
on public.delivery_chat_message_receipts
for update
using (
  user_id = auth.uid()
  and (public.is_super_admin_uid(auth.uid()) or public.is_delivery_chat_participant(conversation_id, auth.uid()))
)
with check (
  user_id = auth.uid()
  and (public.is_super_admin_uid(auth.uid()) or public.is_delivery_chat_participant(conversation_id, auth.uid()))
);

-- 4b) Realtime publication (best-effort)
do $$
begin
  alter publication supabase_realtime add table public.delivery_chat_message_receipts;
exception when others then
  -- ignore
end $$;

-- 5) Storage bucket for chat attachments (voice)
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "chat_attachments_insert_own" on storage.objects;
create policy "chat_attachments_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and name like (auth.uid()::text || '/%')
  );

drop policy if exists "chat_attachments_update_own" on storage.objects;
create policy "chat_attachments_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and name like (auth.uid()::text || '/%')
  )
  with check (
    bucket_id = 'chat-attachments'
    and name like (auth.uid()::text || '/%')
  );

drop policy if exists "chat_attachments_delete_own" on storage.objects;
create policy "chat_attachments_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and name like (auth.uid()::text || '/%')
  );
