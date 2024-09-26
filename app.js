import express from "express";
import pool from "./dblogin.js";
import cors from "cors";

const app = express();
const porta = 3000;

app.use(cors());
app.use(express.json());

const validarCPF = (cpf) => {
  const regex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  return regex.test(cpf);
};

const removerPontuacaoCPF = (cpf) => {
  return cpf.replace(/[^\d]/g, "");
};

app.post("/administrador", async (req, res) => {
  const { nome, cpf, email } = req.body;

  // Validação simples
  if (!nome || !cpf || !email) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO administrador (nome, cpf, email) VALUES ($1, $2, $3)",
      [nome, cpf, email]
    );
    res.status(201).json({ mensagem: "Administrador cadastrado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao cadastrar administrador." });
  }
});

app.get("/administrador", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM administrador");
    res.status(200).json(resultado.rows);
  } catch (err) {
    console.error("Erro ao buscar administrador:", err);
    res.status(500).json({ error: "Erro ao buscar administrador" });
  }
});

app.get("/administrador/cpf/:cpf", async (req, res) => {
  const { cpf } = req.params;

  try {
    const resultado = await pool.query(
      "SELECT * FROM administrador WHERE cpf = $1",
      [cpf]
    );
    if (resultado.rows.length > 0) {
      res.status(200).json({ encontrado: true });
    } else {
      res.status(404).json({ encontrado: false });
    }
  } catch (err) {
    console.error("Erro ao verificar CPF do administrador:", err);
    res.status(500).json({ error: "Erro ao verificar CPF do administrador" });
  }
});

app.post("/eleicao", async (req, res) => {
  const { cargo, ano, nomecand1, nomecand2, numcand1, numcand2, numbranco } =
    req.body;

  try {
    const eleicaoExistente = await pool.query(
      "SELECT * FROM dados_eleicao WHERE ano = $1",
      [ano]
    );

    if (eleicaoExistente.rowCount > 0) {
      await pool.query(
        "UPDATE dados_eleicao SET cargo = $1, nomecand1 = $2, nomecand2 = $3, numcand1 = $4, numcand2 = $5, numbranco = $6 WHERE ano = $7",
        [cargo, nomecand1, nomecand2, numcand1, numcand2, numbranco, ano]
      );
      res.status(200).json({ message: "Eleição atualizada com sucesso!" });
    } else {
      const resultado = await pool.query(
        "INSERT INTO dados_eleicao (cargo, ano, nomecand1, nomecand2, numcand1, numcand2, numbranco) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [cargo, ano, nomecand1, nomecand2, numcand1, numcand2, numbranco]
      );
      res.status(201).json({
        message: "Eleição cadastrada com sucesso!",
        data: resultado.rows[0],
      });
    }
  } catch (error) {
    console.error("Erro ao cadastrar/atualizar eleição:", error);
    res.status(500).json({ error: "Erro ao cadastrar/atualizar eleição" });
  }
});

app.get("/eleicao", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM dados_eleicao");
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Nenhuma eleição encontrada" });
    }
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error("Erro ao buscar eleições:", error);
    res.status(500).json({ error: "Erro ao buscar eleições" });
  }
});

app.post("/votos", async (req, res) => {
  const { number, cpf } = req.body;

  if (number === undefined || cpf === undefined) {
    return res.status(400).json({ error: "Número e CPF são obrigatórios" });
  }

  if (!validarCPF(cpf)) {
    return res
      .status(400)
      .json({ error: "CPF inválido. Deve estar no formato xxx.xxx.xxx-xx." });
  }

  try {
    // Verificar se há uma eleição cadastrada
    const eleicaoExistente = await pool.query("SELECT * FROM dados_eleicao");
    if (eleicaoExistente.rowCount === 0) {
      return res.status(400).json({ error: "Nenhuma eleição cadastrada no momento." });
    }

    // Verificar se o eleitor já votou
    const votoExistente = await pool.query(
      "SELECT * FROM votos WHERE cpf = $1",
      [cpf]
    );
    if (votoExistente.rowCount > 0) {
      return res.status(400).json({ error: "Eleitor já votou." });
    }

    // Registrar o voto
    const resultado = await pool.query(
      "INSERT INTO votos (number, cpf) VALUES ($1, $2) RETURNING *",
      [number, cpf]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar voto" });
  }
});


app.get("/votos", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM votos");
    res.status(200).json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar votos" });
  }
});

app.get("/votos/count/:number", async (req, res) => {
  const { number } = req.params;
  try {
    const resultado = await pool.query(
      "SELECT COUNT(*) AS count FROM votos WHERE number = $1",
      [number]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error("Erro ao executar a consulta", err.stack);
    res.status(500).send("Erro ao executar a consulta");
  }
});

app.get("/votos/cpf/:cpf", async (req, res) => {
  const { cpf } = req.params;

  try {
    const resultado = await pool.query("SELECT * FROM votos WHERE cpf = $1", [
      cpf,
    ]);
    const votou = resultado.rowCount > 0;
    res.status(200).json({ votou });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao verificar voto." });
  }
});

app.post("/eleitores", async (req, res) => {
  const { nome, cpf, email } = req.body;

  if (!nome || !cpf) {
    return res
      .status(400)
      .json({ error: "Nome, CPF e Email são obrigatórios" });
  }

  if (!validarCPF(cpf)) {
    return res
      .status(400)
      .json({ error: "CPF inválido. Deve estar no formato xxx.xxx.xxx-xx." });
  }

  try {
    const CpfExistente = await pool.query(
      "SELECT * FROM eleitores WHERE cpf = $1",
      [cpf]
    );
    if (CpfExistente.rowCount > 0) {
      return res.status(400).json({ error: "CPF já cadastrado!" });
    }

    const resultado = await pool.query(
      "INSERT INTO eleitores (nome, cpf, email) VALUES ($1, $2, $3) RETURNING *",
      [nome, cpf, email]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error("Erro ao cadastrar eleitor:", err);
    res.status(500).json({ error: "Erro ao cadastrar eleitor" });
  }
});

app.get("/eleitores", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM eleitores");
    res.status(200).json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar eleitores" });
  }
});

app.get("/eleitores/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      "SELECT * FROM eleitores WHERE id = $1",
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Eleitor não encontrado" });
    }
    res.status(200).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar eleitor" });
  }
});

app.get("/eleitores/cpf/:cpf", async (req, res) => {
  const { cpf } = req.params;

  if (!validarCPF(cpf)) {
    return res
      .status(400)
      .json({ error: "CPF inválido. Deve estar no formato xxx.xxx.xxx-xx." });
  }

  try {
    const resultado = await pool.query(
      "SELECT * FROM eleitores WHERE cpf = $1",
      [cpf]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Eleitor não encontrado" });
    }
    res.status(200).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar eleitor" });
  }
});

app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
