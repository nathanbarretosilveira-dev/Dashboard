import pg from 'pg';

const { Pool } = pg;

let pool;

export async function initializeDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL não encontrada. Verifique se o arquivo .env existe na raiz do projeto e se server/index.js possui import "dotenv/config".'
    );
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
  });

  await createTables();

  console.log('Postgres database initialized');

  return pool;
}

async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS monthly_data (
      id SERIAL PRIMARY KEY,
      mes TEXT NOT NULL,
      ano INTEGER NOT NULL,
      data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      kpi_geral_ebitda_bwt DOUBLE PRECISION,
      kpi_geral_ebitda_subcontratado DOUBLE PRECISION,
      kpi_geral_resultado_total DOUBLE PRECISION,
      data_completa TEXT NOT NULL,
      CONSTRAINT monthly_data_mes_ano_unique UNIQUE (mes, ano)
    )`,

    `CREATE TABLE IF NOT EXISTS faturamento_por_dia (
      id SERIAL PRIMARY KEY,
      monthly_data_id INTEGER NOT NULL,
      dia TEXT NOT NULL,
      bwt DOUBLE PRECISION,
      subcontratado DOUBLE PRECISION,
      faturamento DOUBLE PRECISION,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS rotas_realizadas (
      id SERIAL PRIMARY KEY,
      monthly_data_id INTEGER NOT NULL,
      rota TEXT NOT NULL,
      viagens INTEGER,
      valor_total DOUBLE PRECISION,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS frota_veiculos (
      id SERIAL PRIMARY KEY,
      monthly_data_id INTEGER NOT NULL,
      modelo TEXT,
      ano INTEGER,
      placa TEXT,
      rota TEXT,
      motorista TEXT,
      km_carregado DOUBLE PRECISION,
      km_vazio DOUBLE PRECISION,
      hodometro DOUBLE PRECISION,
      faturamento DOUBLE PRECISION,
      ebitda_estimado DOUBLE PRECISION,
      ebitda_atingido DOUBLE PRECISION,
      resultado DOUBLE PRECISION,
      margem DOUBLE PRECISION,
      km_l DOUBLE PRECISION,
      litros DOUBLE PRECISION,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS faturamento_data (
      id SERIAL PRIMARY KEY,
      monthly_data_id INTEGER NOT NULL,
      cte TEXT,
      data TEXT,
      motorista TEXT,
      placa TEXT,
      rota TEXT,
      tomador TEXT,
      quantidade DOUBLE PRECISION,
      peso DOUBLE PRECISION,
      valor_total DOUBLE PRECISION,
      pedagio DOUBLE PRECISION,
      empresa TEXT,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS rotas_catalogo (
      id SERIAL PRIMARY KEY,
      monthly_data_id INTEGER NOT NULL,
      origem TEXT,
      destino TEXT,
      rota TEXT,
      km DOUBLE PRECISION,
      pedagios INTEGER,
      valor_pedagios DOUBLE PRECISION,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS telemetria_data (
      id SERIAL PRIMARY KEY,
      monthly_data_id INTEGER NOT NULL,
      motorista TEXT,
      placa TEXT,
      km_rodado DOUBLE PRECISION,
      litros DOUBLE PRECISION,
      media DOUBLE PRECISION,
      motor_parado DOUBLE PRECISION,
      faixa_verde DOUBLE PRECISION,
      faixa_azul DOUBLE PRECISION,
      faixa_amarela DOUBLE PRECISION,
      faixa_vermelha DOUBLE PRECISION,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,
  ];

  for (const sql of tables) {
    await dbRun(sql);
  }
}

function convertSqlitePlaceholders(sql) {
  let index = 0;

  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function normalizeReturning(sql) {
  const trimmed = sql.trim();

  if (
    /^insert\s+into\s+monthly_data/i.test(trimmed) &&
    !/returning\s+id/i.test(trimmed)
  ) {
    return `${sql} RETURNING id`;
  }

  return sql;
}

export function getDB() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }

  return pool;
}

export async function closeDB() {
  if (pool) {
    await pool.end();
  }
}

export async function dbRun(sql, params = []) {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }

  const pgSql = normalizeReturning(convertSqlitePlaceholders(sql));
  const result = await pool.query(pgSql, params);

  return {
    lastID: result.rows?.[0]?.id,
    changes: result.rowCount,
  };
}

export async function dbGet(sql, params = []) {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }

  const pgSql = convertSqlitePlaceholders(sql);
  const result = await pool.query(pgSql, params);

  return result.rows[0];
}

export async function dbAll(sql, params = []) {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }

  const pgSql = convertSqlitePlaceholders(sql);
  const result = await pool.query(pgSql, params);

  return result.rows || [];
}