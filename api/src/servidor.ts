import "dotenv/config";
import express from "express";
import type { RowDataPacket } from "mysql2";
import { banco } from "./banco";

const app = express();
app.use(express.json());

const SELECT_LIVROS = `
  SELECT id, usuario_id, titulo, autor, genero, status
  FROM livros
`;

// Todos os livros
app.get("/api/livros", async (_req, res) => {
  const [linhas] = await banco.execute<RowDataPacket[]>(
    `${SELECT_LIVROS} ORDER BY id`,
    []
  );
  res.json(linhas);
});

// Um livro pelo ID (devolve 404 quando não existir)
app.get("/api/livros/:id", async (req, res) => {
  const [linhas] = await banco.execute<RowDataPacket[]>(
    `${SELECT_LIVROS} WHERE id = ?`,
    [Number(req.params.id)]
  );

  if (linhas.length === 0) {
    res.status(404).json({ erro: `Livro #${req.params.id} não encontrado.` });
    return;
  }

  res.json(linhas[0]);
});

app.listen(3000, () =>
  console.log("API da Biblioteca da Turma em http://localhost:3000")
);