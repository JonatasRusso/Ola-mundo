const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' }); // Carrega variáveis do .env na raiz

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, // 'db' é o nome do serviço no docker-compose
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('error', (err, client) => {
  console.error('Erro inesperado no cliente de DB ocioso', err);
  process.exit(-1);
});

module.exports = pool;