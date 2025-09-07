// Einmalige Migration - führt CREATE TABLE IF NOT EXISTS aus
const { executeQuery, getPgClient } = require('/opt/nodejs/pgClient');

const SQL = `
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_magic_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  user_agent text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_magic_tokens_hash ON auth_magic_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_magic_tokens_email ON auth_magic_tokens(email);
`;

exports.handler = async () => {
  console.log('AuthDbMigrateFn start');
  await getPgClient();
  
  for (const statement of SQL.split(';\n').map(s => s.trim()).filter(Boolean)) {
    console.log('Running:', statement.slice(0, 80) + '...');
    await executeQuery(statement);
  }
  
  console.log('AuthDbMigrateFn done');
  return { ok: true };
};