import "dotenv/config"; // primeira linha: carrega o env antes de tudo
import bcrypt from "bcryptjs";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { exigirLogin, SEGREDO, usuarioDe } from "./autenticacao";
import { banco } from "./banco";
import { GENEROS, STATUS_LIVRO, type DadosLivro, type StatusLivro } from "./tipos";

const app = express();
app.use(express.json());

// Subconsulta com JOIN e GROUP_CONCAT trazendo os assuntos (relação N:N) em cada livro
const SELECT_LIVROS = `
  SELECT l.id,
         l.usuario_id,
         l.titulo,
         l.autor,
         l.genero,
         l.status,
         DATE_FORMAT(l.devolucao_prevista, '%Y-%m-%d') AS devolucao_prevista,
         (SELECT GROUP_CONCAT(a.nome ORDER BY a.nome SEPARATOR ',')
          FROM livro_assunto la
          JOIN assuntos a ON a.id = la.assunto_id
          WHERE la.livro_id = l.id) AS assuntos
  FROM livros l
`;

// Converte a string "programacao,boas-praticas" (ou null) em um array string[]
function paraLivro(linha: RowDataPacket): RowDataPacket {
  return {
    ...linha,
    assuntos: linha.assuntos ? String(linha.assuntos).split(",") : [],
  };
}

async function buscarUm(id: number, usuarioId: number): Promise<RowDataPacket | undefined> {
  const [linhas] = await banco.execute<RowDataPacket[]>(
    `${SELECT_LIVROS} WHERE l.id = ? AND l.usuario_id = ?`,
    [id, usuarioId]
  );
  return linhas.length > 0 ? paraLivro(linhas[0]) : undefined;
}

function validar(dados: DadosLivro): string | undefined {
  if (typeof dados.titulo !== "string" || dados.titulo.trim().length < 3) {
    return "O título precisa ter pelo menos 3 caracteres.";
  }
  if (!dados.genero || !GENEROS.includes(dados.genero)) {
    return "Selecione um gênero válido.";
  }
  return undefined;
}

// ==========================================
// ROTAS DE LIVROS E ESTATÍSTICAS (Aulas 4, 5 e 6)
// ==========================================

// PAINEL DE ESTATÍSTICAS: GROUP BY no banco
app.get("/api/estatisticas", exigirLogin, async (_req, res) => {
  const [linhas] = await banco.execute<RowDataPacket[]>(
    `SELECT status, COUNT(*) AS quantidade
     FROM livros
     WHERE usuario_id = ?
     GROUP BY status`,
    [usuarioDe(res)]
  );

  // Começa com zeros porque o GROUP BY não devolve linha para status sem livros
  const contagem: Record<StatusLivro, number> = {
    disponivel: 0,
    emprestado: 0,
    atrasado: 0,
  };

  for (const linha of linhas) {
    const status = linha.status as StatusLivro;
    if (status in contagem) {
      contagem[status] = Number(linha.quantidade);
    }
  }

  res.json(contagem);
});

// LER TODOS DO USUÁRIO LOGADO (com filtros opcionais na URL: ?status=...&busca=...)
app.get("/api/livros", exigirLogin, async (req, res) => {
  let sql = `${SELECT_LIVROS} WHERE l.usuario_id = ?`;
  const valores: (string | number)[] = [usuarioDe(res)];

  const { status, busca } = req.query;

  if (typeof status === "string" && STATUS_LIVRO.includes(status as StatusLivro)) {
    sql += " AND l.status = ?";
    valores.push(status);
  }

  if (typeof busca === "string" && busca.trim() !== "") {
    sql += " AND (l.titulo LIKE ? OR l.autor LIKE ?)";
    const termo = `%${busca.trim()}%`;
    valores.push(termo, termo);
  }

  sql += " ORDER BY FIELD(l.status, 'atrasado', 'emprestado', 'disponivel'), l.titulo ASC";

  const [linhas] = await banco.execute<RowDataPacket[]>(sql, valores);
  res.json(linhas.map(paraLivro));
});

// LER UM POR ID
app.get("/api/livros/:id", exigirLogin, async (req, res) => {
  const livro = await buscarUm(Number(req.params.id), usuarioDe(res));
  if (!livro) {
    res.status(404).json({ erro: `Livro #${req.params.id} não encontrado.` });
    return;
  }
  res.json(livro);
});

// CRIAR NOVO LIVRO
app.post("/api/livros", exigirLogin, async (req, res) => {
  const dados = req.body as DadosLivro;
  const problema = validar(dados);

  if (problema) {
    res.status(400).json({ erro: problema });
    return;
  }

  const usuarioId = usuarioDe(res);
  const [resultado] = await banco.execute<ResultSetHeader>(
    `INSERT INTO livros (usuario_id, titulo, autor, genero, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      usuarioId,
      String(dados.titulo).trim(),
      dados.autor?.trim() || "Autor não informado",
      String(dados.genero),
      String(dados.status ?? "disponivel"),
    ]
  );

  res.status(201).json(await buscarUm(resultado.insertId, usuarioId));
});

// ATUALIZAR STATUS (disponivel / emprestado / atrasado)
app.patch("/api/livros/:id/status", exigirLogin, async (req, res) => {
  const { status } = req.body as { status?: StatusLivro };

  if (!status || !STATUS_LIVRO.includes(status)) {
    res.status(400).json({ erro: "Status inválido." });
    return;
  }

  const [resultado] = await banco.execute<ResultSetHeader>(
    "UPDATE livros SET status = ? WHERE id = ? AND usuario_id = ?",
    [status, Number(req.params.id), usuarioDe(res)]
  );

  if (resultado.affectedRows === 0) {
    res.status(404).json({ erro: `Livro #${req.params.id} não encontrado.` });
    return;
  }

  res.status(204).end();
});

// REMOVER LIVRO
app.delete("/api/livros/:id", exigirLogin, async (req, res) => {
  const [resultado] = await banco.execute<ResultSetHeader>(
    "DELETE FROM livros WHERE id = ? AND usuario_id = ?",
    [Number(req.params.id), usuarioDe(res)]
  );

  if (resultado.affectedRows === 0) {
    res.status(404).json({ erro: `Livro #${req.params.id} não encontrado.` });
    return;
  }

  res.status(204).end();
});

// ==========================================
// ROTAS DE USUÁRIOS E LOGIN (Aula 5)
// ==========================================

app.post("/api/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body as {
    nome?: string;
    email?: string;
    senha?: string;
  };

  if (!nome?.trim() || !email?.includes("@") || !senha || senha.length < 6) {
    res.status(400).json({
      erro: "Preencha nome, e-mail válido e senha de 6 caracteres ou mais.",
    });
    return;
  }

  const hash = await bcrypt.hash(senha, 10);

  try {
    const [resultado] = await banco.execute<ResultSetHeader>(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
      [nome.trim(), email.trim().toLowerCase(), hash]
    );
    res.status(201).json({ id: resultado.insertId });
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
      res.status(409).json({ erro: "Este e-mail já está cadastrado." });
      return;
    }
    throw erro;
  }
});

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body as { email?: string; senha?: string };

  const [linhas] = await banco.execute<RowDataPacket[]>(
    "SELECT id, nome, senha_hash FROM usuarios WHERE email = ?",
    [email?.trim().toLowerCase() ?? ""]
  );

  const usuario = linhas[0];

  if (!usuario || !senha || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    res.status(401).json({ erro: "E-mail ou senha inválidos." });
    return;
  }

  const token = jwt.sign({ id: usuario.id }, SEGREDO, { expiresIn: "8h" });
  res.json({ token, nome: usuario.nome });
});

// TRATADOR DE ERROS NÃO PREVISTOS (sempre por último)
app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ erro: "Algo deu errado no servidor. Tente de novo." });
});

app.listen(3000, () =>
  console.log("API da Biblioteca da Turma em http://localhost:3000")
);