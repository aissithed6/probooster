        -- Supabase schema for advanced point management (settings, fees, limits, exchange rates)
        -- Generated to support admin, seller and client dashboards synchronization

        create table if not exists point_settings (
          id uuid primary key default gen_random_uuid(),
          scope text not null check (scope in ('global', 'vendor', 'customer')),
          default_currency text not null,
          conversion_rate numeric(18,6) not null default 1,
          min_balance numeric(18,2) not null default 0,
          max_balance numeric(18,2),
          transfer_enabled boolean not null default true,
          exchange_enabled boolean not null default true,
          withdrawal_enabled boolean not null default true,
          metadata jsonb not null default '{}'::jsonb,
          updated_by uuid references user_profiles(id),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create unique index if not exists point_settings_scope_unique on point_settings(scope);

        create table if not exists point_operation_fees (
          id uuid primary key default gen_random_uuid(),
          operation_type text not null check (operation_type in ('transfer', 'exchange', 'withdrawal')),
          scope text not null check (scope in ('global', 'vendor', 'customer')),
          flat_fee numeric(18,2) not null default 0,
          percentage_fee numeric(7,4) not null default 0,
          minimum_fee numeric(18,2) not null default 0,
          maximum_fee numeric(18,2),
          currency text not null,
          metadata jsonb not null default '{}'::jsonb,
          updated_by uuid references user_profiles(id),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create unique index if not exists point_operation_fees_scope_unique
          on point_operation_fees(operation_type, scope);

        create table if not exists point_operation_limits (
          id uuid primary key default gen_random_uuid(),
          operation_type text not null check (operation_type in ('transfer', 'exchange', 'withdrawal')),
          scope text not null check (scope in ('global', 'vendor', 'customer')),
          min_amount numeric(18,2) not null default 0,
          max_amount numeric(18,2),
          daily_limit numeric(18,2),
          monthly_limit numeric(18,2),
          metadata jsonb not null default '{}'::jsonb,
          updated_by uuid references user_profiles(id),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create unique index if not exists point_operation_limits_scope_unique
          on point_operation_limits(operation_type, scope);

        create table if not exists point_exchange_rates (
          id uuid primary key default gen_random_uuid(),
          currency text not null,
          scope text not null default 'global' check (scope in ('global', 'vendor', 'customer')),
          rate numeric(18,6) not null,
          is_default boolean not null default false,
          metadata jsonb not null default '{}'::jsonb,
          updated_by uuid references user_profiles(id),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create unique index if not exists point_exchange_rates_currency_scope_unique
          on point_exchange_rates(currency, scope);

        create index if not exists point_exchange_rates_scope_idx
          on point_exchange_rates(scope);

        create unique index if not exists point_exchange_rates_default_unique
          on point_exchange_rates(is_default)
          where is_default = true;

        create table if not exists point_withdrawal_methods (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          description text,
          is_active boolean not null default true,
          metadata jsonb not null default '{}'::jsonb,
          updated_by uuid references user_profiles(id),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create table if not exists point_withdrawal_method_limits (
          id uuid primary key default gen_random_uuid(),
          method_id uuid not null references point_withdrawal_methods(id) on delete cascade,
          min_amount numeric(18,2) not null default 0,
          max_amount numeric(18,2),
          currency text not null,
          processing_time text,
          metadata jsonb not null default '{}'::jsonb,
          updated_by uuid references user_profiles(id),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create table if not exists point_exchange_history (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references user_profiles(id),
          from_currency text not null,
          to_currency text not null,
          points_amount numeric(18,2) not null,
          converted_amount numeric(18,2) not null,
          fee_amount numeric(18,2) not null default 0,
          rate numeric(18,6) not null,
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now()
        );

        create index if not exists point_exchange_history_user_id_idx
          on point_exchange_history(user_id, created_at desc);

        create table if not exists point_transfer_requests (
          id uuid primary key default gen_random_uuid(),
          sender_id uuid not null references user_profiles(id),
          recipient_id uuid not null references user_profiles(id),
          points_amount numeric(18,2) not null,
          fee_amount numeric(18,2) not null default 0,
          status text not null check (status in ('pending', 'approved', 'rejected', 'failed', 'completed')),
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          processed_at timestamptz,
          processed_by uuid references user_profiles(id)
        );

        create index if not exists point_transfer_requests_sender_idx
          on point_transfer_requests(sender_id, created_at desc);

        create index if not exists point_transfer_requests_recipient_idx
          on point_transfer_requests(recipient_id, created_at desc);

        create table if not exists point_withdrawal_requests (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references user_profiles(id),
          method_id uuid not null references point_withdrawal_methods(id),
          points_amount numeric(18,2) not null,
          payout_amount numeric(18,2) not null,
          fee_amount numeric(18,2) not null default 0,
          currency text not null,
          status text not null check (status in ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          processed_at timestamptz,
          processed_by uuid references user_profiles(id)
        );

create index if not exists point_withdrawal_requests_user_idx
  on point_withdrawal_requests(user_id, created_at desc);

-- TODO: add RLS policies matching your security model (admins vs vendors vs customers)

create table if not exists loyalty_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rule_type text not null check (rule_type in ('purchase', 'bonus', 'referral', 'social', 'custom')),
  description text,
  points_value numeric(18,4) not null default 0,
  multiplier numeric(18,4),
  min_amount numeric(18,2),
  max_points numeric(18,2),
  is_active boolean not null default true,
  conditions text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references user_profiles(id),
  updated_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_rules_active_idx on loyalty_rules(is_active);

create table if not exists loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  reward_type text not null check (reward_type in ('discount', 'free_shipping', 'free_product', 'cashback', 'voucher')),
  description text,
  points_cost numeric(18,2) not null,
  value numeric(18,2) not null default 0,
  value_type text not null check (value_type in ('percentage', 'fixed', 'points')),
  min_order_amount numeric(18,2),
  max_usage integer,
  current_usage integer not null default 0,
  is_active boolean not null default true,
  start_date date,
  end_date date,
  categories text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references user_profiles(id),
  updated_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_rewards_status_idx on loyalty_rewards(is_active);
create index if not exists loyalty_rewards_period_idx on loyalty_rewards(start_date, end_date);

create table if not exists loyalty_members (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  total_points numeric(18,2) not null default 0,
  available_points numeric(18,2) not null default 0,
  lifetime_points numeric(18,2) not null default 0,
  total_orders integer not null default 0,
  total_spent numeric(18,2) not null default 0,
  referral_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  joined_at date not null default current_date,
  last_activity timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_members_status_idx on loyalty_members(status);
create index if not exists loyalty_members_tier_idx on loyalty_members(tier);

create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  rule_id uuid references loyalty_rules(id) on delete set null,
  reward_id uuid references loyalty_rewards(id) on delete set null,
  transaction_type text not null check (transaction_type in ('earn', 'spend', 'expire', 'adjustment')),
  points numeric(18,2) not null,
  balance_after numeric(18,2),
  description text,
  reference text,
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_user_idx on loyalty_transactions(user_id, created_at desc);
create index if not exists loyalty_transactions_type_idx on loyalty_transactions(transaction_type);

create table if not exists loyalty_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_period text not null check (snapshot_period in ('1month', '3months', '6months', '1year')),
  total_points numeric(18,2) not null default 0,
  active_members integer not null default 0,
  exchanged_points numeric(18,2) not null default 0,
  total_value numeric(18,2) not null default 0,
  monthly_growth numeric(10,2) not null default 0,
  member_growth numeric(10,2) not null default 0,
  point_growth numeric(10,2) not null default 0,
  value_growth numeric(10,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

create index if not exists loyalty_analytics_period_idx on loyalty_analytics_snapshots(snapshot_period, captured_at desc);

create table if not exists loyalty_member_activity (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references loyalty_members(user_id) on delete cascade,
  activity_type text not null check (activity_type in ('purchase', 'reward', 'referral', 'social_share', 'adjustment')),
  points_delta numeric(18,2) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_member_activity_member_idx on loyalty_member_activity(member_id, created_at desc);

create or replace view loyalty_members_with_profiles as
  select
    lm.user_id,
    up.first_name,
    up.last_name,
    u.email,
    up.phone,
    lm.tier,
    lm.total_points,
    lm.available_points,
    lm.lifetime_points,
    lm.total_orders,
    lm.total_spent,
    lm.referral_count,
    lm.status,
    lm.last_activity,
    lm.metadata,
    lm.updated_at
  from loyalty_members lm
  join user_profiles up on up.id = lm.user_id
  join users u on u.id = up.user_id;
