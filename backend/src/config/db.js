const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Soporte dual:
// 1. Conexión directa o Transaction/Session Pooler de Supabase mediante DATABASE_URL / POSTGRES_URL / SUPABASE_DB_URL
// 2. Conexión local al contenedor Docker PostgreSQL (casona_postgres)
let connectionString = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  ''
).trim();

// Si se proporcionó el host directo IPv6 de Supabase (db.<ref>.supabase.co),
// convertir automáticamente al Session Pooler IPv4 (aws-0-us-east-1.pooler.supabase.com)
const directMatch = connectionString.match(
  /^postgres(?:ql)?:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co:5432\/postgres/i
);
if (directMatch) {
  const [, password, projectRef] = directMatch;
  connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
}

const isSupabaseConnection =
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase.com') ||
  process.env.DB_SSL === 'true';

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: isSupabaseConnection ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'casona_admin',
      password: process.env.DB_PASSWORD || 'casona_secret_2026',
      database: process.env.DB_NAME || 'supermercado_casona',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DATABASE] Error inesperado en el pool de clientes PostgreSQL/Supabase:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  isSupabaseConnection,
};
