import express from 'express';
import pool from './db.js';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());  // Adicione esta linha
app.use(express.json());

app.post('/votos', async (req, res) => {
    const { number } = req.body;

    if (number === undefined) {
        return res.status(400).json({ error: 'Número é obrigatório' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO votos (number) VALUES ($1) RETURNING *',
            [number]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registrar voto' });
    }
});

app.get('/votos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM votos');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar votos' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
