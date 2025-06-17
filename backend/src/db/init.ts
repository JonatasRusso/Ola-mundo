const pool = require('./db');

const createTables = async () => {
  try {
    // Tabela para ingredientes base
    await pool.query(`
      CREATE TABLE IF NOT EXISTS base_ingredients (
        id UUID PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        image_url VARCHAR(255),
        unit VARCHAR(50),
        price NUMERIC(10, 2)
      );
    `);
    console.log('Tabela base_ingredients criada ou já existe.');

    // Tabela para receitas
    // 'ingredients' é um tipo JSONB para armazenar o array de ingredientes aninhados
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        image_url VARCHAR(255),
        prep_time VARCHAR(50),
        unit_price NUMERIC(10, 2),
        ingredients JSONB NOT NULL
      );
    `);
    console.log('Tabela recipes criada ou já existe.');

  } catch (err) {
    console.error('Erro ao criar tabelas:', err);
    process.exit(1);
  } finally {
    pool.end(); // Fecha a conexão com o banco após a criação das tabelas
  }
};

createTables();