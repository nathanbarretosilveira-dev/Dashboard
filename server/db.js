import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data.db');

let db;

export function initializeDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }

      db.run('PRAGMA foreign_keys = ON', async (err) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          await createTables();
          console.log(`Database initialized at ${DB_PATH}`);
          resolve(db);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
}

async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS monthly_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes TEXT UNIQUE NOT NULL,
      ano INTEGER NOT NULL,
      data_importacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      kpi_geral_ebitda_bwt REAL,
      kpi_geral_ebitda_subcontratado REAL,
      kpi_geral_resultado_total REAL,
      data_completa TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS faturamento_por_dia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_data_id INTEGER NOT NULL,
      dia TEXT NOT NULL,
      bwt REAL,
      subcontratado REAL,
      faturamento REAL,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS rotas_realizadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_data_id INTEGER NOT NULL,
      rota TEXT NOT NULL,
      viagens INTEGER,
      valor_total REAL,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS frota_veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_data_id INTEGER NOT NULL,
      modelo TEXT,
      ano INTEGER,
      placa TEXT,
      rota TEXT,
      motorista TEXT,
      km_carregado REAL,
      km_vazio REAL,
      hodometro REAL,
      faturamento REAL,
      ebitda_estimado REAL,
      ebitda_atingido REAL,
      resultado REAL,
      margem REAL,
      km_l REAL,
      litros REAL,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS faturamento_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_data_id INTEGER NOT NULL,
      cte TEXT,
      data TEXT,
      motorista TEXT,
      placa TEXT,
      rota TEXT,
      tomador TEXT,
      quantidade REAL,
      peso REAL,
      valor_total REAL,
      pedagio REAL,
      empresa TEXT,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS rotas_catalogo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_data_id INTEGER NOT NULL,
      origem TEXT,
      destino TEXT,
      rota TEXT,
      km REAL,
      pedagios INTEGER,
      valor_pedagios REAL,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS telemetria_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_data_id INTEGER NOT NULL,
      motorista TEXT,
      placa TEXT,
      km_rodado REAL,
      litros REAL,
      media REAL,
      motor_parado REAL,
      faixa_verde REAL,
      faixa_azul REAL,
      faixa_amarela REAL,
      faixa_vermelha REAL,
      FOREIGN KEY(monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
    )`
  ];

  for (const sql of tables) {
    await dbRun(sql);
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }
  return db;
}

export function closeDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
}

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
