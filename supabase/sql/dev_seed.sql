-- Partner
insert into partners (id, name) values ('PARTNER_ABC','Demo Partner') on conflict do nothing;

-- Allowed Origin (Demo)
insert into partner_origins (partner_id, origin) values ('PARTNER_ABC','https://demo.partner.example') on conflict do nothing;

-- Feature flag
insert into feature_flags (key, enabled) values ('vc_stub_runner', true) on conflict do nothing;
-- Pa
rtner Credits Seed Data
-- Augustiner: 100 Credits, Standard-Policies
insert into partner_credits(partner_id, billing_mode, overage_policy, unit_price_eur, credits_granted)
values ('AUGUSTINER', 'issue', 'allow_and_invoice', 0.00, 100)
on conflict (partner_id) do nothing;

insert into partner_credit_ledger(partner_id, kind, quantity, reason, created_by)
values ('AUGUSTINER','grant',100,'Initial Promo Kontingent','super_admin');

-- Additional test partners for development
insert into partner_credits(partner_id, billing_mode, overage_policy, unit_price_eur, credits_granted)
values 
  ('SPATEN', 'redeem', 'block_when_exhausted', 2.50, 50),
  ('LOEWENBRAEU', 'issue', 'allow_and_invoice', 1.80, 200)
on conflict (partner_id) do nothing;

insert into partner_credit_ledger(partner_id, kind, quantity, reason, created_by)
values 
  ('SPATEN','grant',50,'Test Partner - Redeem Mode','super_admin'),
  ('LOEWENBRAEU','grant',200,'Test Partner - High Volume','super_admin');