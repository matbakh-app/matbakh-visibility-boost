-- Partner Credits System
-- Manages credit allocations and consumption tracking for partners

create table if not exists partner_credits (
  partner_id text primary key,
  billing_mode text not null default 'issue', -- 'issue' | 'redeem'
  overage_policy text not null default 'allow_and_invoice', -- or 'block_when_exhausted'
  unit_price_eur numeric(10,2) default 0.00,
  credits_granted int not null default 0,
  credits_consumed int not null default 0,
  credits_expired int not null default 0,
  updated_at timestamptz default now()
);

-- Audit trail for all credit movements
create table if not exists partner_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  partner_id text not null,
  kind text not null, -- 'grant'|'consume'|'adjust'|'expire'
  quantity int not null,
  reason text,
  meta jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

-- Convenient view for current balances
create or replace view v_partner_credit_balance as
select
  pc.partner_id,
  pc.billing_mode,
  pc.overage_policy,
  pc.unit_price_eur,
  (pc.credits_granted - pc.credits_consumed - pc.credits_expired) as balance,
  pc.credits_granted,
  pc.credits_consumed,
  pc.credits_expired,
  pc.updated_at
from partner_credits pc;

-- Function to safely consume credits with overage policy enforcement
create or replace function consume_partner_credits(
  p_partner_id text,
  p_quantity int,
  p_reason text default null,
  p_created_by text default null
) returns jsonb as $$
declare
  current_balance int;
  overage_policy text;
  result jsonb;
begin
  -- Get current balance and policy
  select balance, pc.overage_policy 
  into current_balance, overage_policy
  from v_partner_credit_balance vcb
  join partner_credits pc on pc.partner_id = vcb.partner_id
  where vcb.partner_id = p_partner_id;
  
  -- Check if partner exists
  if current_balance is null then
    return jsonb_build_object('success', false, 'error', 'partner_not_found');
  end if;
  
  -- Check overage policy
  if current_balance < p_quantity and overage_policy = 'block_when_exhausted' then
    return jsonb_build_object('success', false, 'error', 'insufficient_credits', 'balance', current_balance);
  end if;
  
  -- Update credits consumed
  update partner_credits 
  set credits_consumed = credits_consumed + p_quantity,
      updated_at = now()
  where partner_id = p_partner_id;
  
  -- Add ledger entry
  insert into partner_credit_ledger (partner_id, kind, quantity, reason, created_by)
  values (p_partner_id, 'consume', p_quantity, p_reason, p_created_by);
  
  -- Return success with new balance
  select balance into current_balance from v_partner_credit_balance where partner_id = p_partner_id;
  
  return jsonb_build_object(
    'success', true, 
    'new_balance', current_balance,
    'overage', case when current_balance < 0 then abs(current_balance) else 0 end
  );
end;
$$ language plpgsql;

-- Indexes for performance
create index if not exists idx_partner_credit_ledger_partner_id on partner_credit_ledger(partner_id);
create index if not exists idx_partner_credit_ledger_created_at on partner_credit_ledger(created_at desc);
create index if not exists idx_partner_credit_ledger_kind on partner_credit_ledger(kind);

-- RLS policies (to be enabled when auth is configured)
-- alter table partner_credits enable row level security;
-- alter table partner_credit_ledger enable row level security;