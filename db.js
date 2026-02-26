// db.js - conexión a PostgreSQL
const { Pool } = require('pg');

// Si no le pasamos config, usa las variables de entorno:
// PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
const pool = new Pool();

// Helper para probar la conexión una vez al iniciar
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS now');
    console.log('Conectado a PostgreSQL. NOW() =', res.rows[0].now);
  } catch (err) {
    console.error('Error conectando a PostgreSQL:', err.message);
  }
}

testConnection();

module.exports = pool;
