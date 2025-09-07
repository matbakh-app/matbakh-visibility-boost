-- Users (leichtgewichtig, passt zu bestehendem 'profiles')
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Magic-link Tokens
CREATE TABLE IF NOT EXISTS auth_magic_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  user_agent text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_magic_tokens_email ON auth_magic_tokens(email);
CREATE INDEX IF NOT EXISTS idx_auth_magic_tokens_expires ON auth_magic_tokens(expires_at);