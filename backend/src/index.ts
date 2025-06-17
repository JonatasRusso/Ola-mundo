const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // Carrega variáveis do .env na raiz
const pool = require('./db/db'); // Importa o pool de conexão do banco
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.API_PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middlewares
app.use(cors({ origin: FRONTEND_URL })); // Configura CORS para permitir requisições do frontend
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// Rotas da API

// --- Rotas para Ingredientes Base ---
app.get('/api/base-ingredients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM base_ingredients ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar ingredientes base:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/base-ingredients', async (req, res) => {
  const { name, image_url, unit, price } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome do ingrediente é obrigatório.' });
  }
  const id = uuidv4();
  try {
    const result = await pool.query(
      'INSERT INTO base_ingredients (id, name, image_url, unit, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, image_url, unit, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao adicionar ingrediente base:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/base-ingredients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, image_url, unit, price } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome do ingrediente é obrigatório.' });
  }
  try {
    const result = await pool.query(
      'UPDATE base_ingredients SET name = $1, image_url = $2, unit = $3, price = $4 WHERE id = $5 RETURNING *',
      [name, image_url, unit, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente base não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar ingrediente base:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/base-ingredients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Verifica se o ingrediente base está sendo usado em alguma receita
    const checkUsage = await pool.query(
      'SELECT COUNT(*) FROM recipes WHERE ingredients @> $1::jsonb',
      [`[{"item_id": "${id}", "is_recipe": false}]`]
    );
    if (parseInt(checkUsage.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Não é possível deletar: ingrediente base em uso em uma ou mais receitas.' });
    }

    const result = await pool.query('DELETE FROM base_ingredients WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente base não encontrado.' });
    }
    res.status(204).send(); // No Content
  } catch (err) {
    console.error('Erro ao deletar ingrediente base:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// --- Rotas para Receitas ---
app.get('/api/recipes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recipes ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar receitas:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/recipes', async (req, res) => {
  const { name, image_url, prep_time, unit_price, ingredients } = req.body;
  if (!name || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Nome e ingredientes da receita são obrigatórios.' });
  }
  const id = uuidv4();
  try {
    const result = await pool.query(
      'INSERT INTO recipes (id, name, image_url, prep_time, unit_price, ingredients) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, image_url, prep_time, unit_price, JSON.stringify(ingredients)] // Armazenar ingredients como JSONB
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao adicionar receita:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, image_url, prep_time, unit_price, ingredients } = req.body;
  if (!name || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Nome e ingredientes da receita são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      'UPDATE recipes SET name = $1, image_url = $2, prep_time = $3, unit_price = $4, ingredients = $5 WHERE id = $6 RETURNING *',
      [name, image_url, prep_time, unit_price, JSON.stringify(ingredients), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receita não encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar receita:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Verifica se esta receita está sendo usada como ingrediente em outras receitas
    const checkUsage = await pool.query(
      'SELECT COUNT(*) FROM recipes WHERE ingredients @> $1::jsonb',
      [`[{"item_id": "${id}", "is_recipe": true}]`]
    );
    if (parseInt(checkUsage.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Não é possível deletar: esta receita é um ingrediente em outra(s) receita(s).' });
    }

    const result = await pool.query('DELETE FROM recipes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receita não encontrada.' });
    }
    res.status(204).send(); // No Content
  } catch (err) {
    console.error('Erro ao deletar receita:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Backend API rodando na porta ${PORT}`);
});