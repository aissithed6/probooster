-- Delivery group chat (order-linked): conversations + participants + messages

-- 1) Deliveries: store the real driver UUID when assigned/accepted.
alter table if exists public.deliveries
add column if not exists driver_id uuid null;

create index if not exists deliveries_driver_id_idx on public.deliveries (driver_id);

-- 2) Group conversations linked to an order.
create table if not exists public.delivery_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_chat_conversations_order_id_idx on public.delivery_chat_conversations (order_id);

create table if not exists public.delivery_chat_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.delivery_chat_conversations(id) on delete cascade,
  user_id uuid not null,
  role_in_conversation text not null check (role_in_conversation in ('client', 'vendor', 'driver', 'super_admin')),
  joined_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

create index if not exists delivery_chat_participants_conversation_idx on public.delivery_chat_participants (conversation_id);
create index if not exists delivery_chat_participants_user_idx on public.delivery_chat_participants (user_id);

create table if not exists public.delivery_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.delivery_chat_conversations(id) on delete cascade,
  sender_id uuid not null,
  content text not null,
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  created_at timestamptz not null default now()
);

create index if not exists delivery_chat_messages_conversation_created_at_idx on public.delivery_chat_messages (conversation_id, created_at);
create index if not exists delivery_chat_messages_sender_id_idx on public.delivery_chat_messages (sender_id);

-- 2b) Maintain updated_at on conversations when messages arrive.
create or replace function public.touch_delivery_chat_conversation()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.delivery_chat_conversations
  set updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_touch_delivery_chat_conversation on public.delivery_chat_messages;
create trigger trg_touch_delivery_chat_conversation
after insert on public.delivery_chat_messages
for each row
execute function public.touch_delivery_chat_conversation();

-- 3) RLS helpers
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
      and lower(coalesce(u.role, '')) = 'super_admin'
  );
$$;

create or replace function public.is_delivery_chat_participant(p_conversation_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1
    from public.delivery_chat_participants p
    where p.conversation_id = p_conversation_id
      and p.user_id = p_uid
  );
$$;

-- 4) Enable RLS
alter table public.delivery_chat_conversations enable row level security;
alter table public.delivery_chat_participants enable row level security;
alter table public.delivery_chat_messages enable row level security;

-- 5) Policies
-- Conversations: participant or super admin can read.
drop policy if exists "delivery_chat_conversations_select" on public.delivery_chat_conversations;
create policy "delivery_chat_conversations_select"
on public.delivery_chat_conversations
for select
using (
  public.is_super_admin_uid(auth.uid())
  or exists (
    select 1
    from public.delivery_chat_participants p
    where p.conversation_id = delivery_chat_conversations.id
      and p.user_id = auth.uid()
  )
);

-- Conversations: only service role can insert (created through server/admin).
drop policy if exists "delivery_chat_conversations_insert_service" on public.delivery_chat_conversations;
create policy "delivery_chat_conversations_insert_service"
on public.delivery_chat_conversations
for insert
with check (auth.role() = 'service_role');

-- Participants: participant or super admin can read.
drop policy if exists "delivery_chat_participants_select" on public.delivery_chat_participants;
create policy "delivery_chat_participants_select"
on public.delivery_chat_participants
for select
using (
  public.is_super_admin_uid(auth.uid())
  or public.is_delivery_chat_participant(delivery_chat_participants.conversation_id, auth.uid())
);

-- Participants: only service role can insert (managed by server/admin).
drop policy if exists "delivery_chat_participants_insert_service" on public.delivery_chat_participants;
create policy "delivery_chat_participants_insert_service"
on public.delivery_chat_participants
for insert
with check (auth.role() = 'service_role');

-- Messages: participant or super admin can read.
drop policy if exists "delivery_chat_messages_select" on public.delivery_chat_messages;
create policy "delivery_chat_messages_select"
on public.delivery_chat_messages
for select
using (
  public.is_super_admin_uid(auth.uid())
  or public.is_delivery_chat_participant(delivery_chat_messages.conversation_id, auth.uid())
);

-- Messages: participant or super admin can insert.
drop policy if exists "delivery_chat_messages_insert" on public.delivery_chat_messages;
create policy "delivery_chat_messages_insert"
on public.delivery_chat_messages
for insert
with check (
  (public.is_super_admin_uid(auth.uid()) or public.is_delivery_chat_participant(delivery_chat_messages.conversation_id, auth.uid()))
  and auth.uid() = sender_id
);
