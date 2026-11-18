import type { Livro, NovoLivro, Sessao, StatusLivro } from "./tipos";

const CHAVE_SESSAO = "biblioteca:sessao";

// ==========================================
// SESSÃO NO NAVEGADOR (Aula 5)
// ==========================================

export function sessaoAtual(): Sessao | undefined {
  const texto = localStorage.getItem(CHAVE_SESSAO);
  return texto ? (JSON.parse(texto) as Sessao) : undefined;
}

export function guardarSessao(sessao: Sessao): void {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function encerrarSessao(): void {
  localStorage.removeItem(CHAVE_SESSAO);
}

// ==========================================
// AJUDANTE DE REQUISIÇÕES COM TOKEN (Aulas 4 e 5)
// ==========================================

async function enviar(metodo: string, url: string, corpo?: unknown): Promise<Response> {
  const sessao = sessaoAtual();

  const resposta = await fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(sessao ? { Authorization: `Bearer ${sessao.token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  // Crachá vencido ou inválido: volta para a tela de entrada
  if (resposta.status === 401 && sessao) {
    encerrarSessao();
    location.reload();
  }

  if (!resposta.ok) {
    const dados = (await resposta.json().catch(() => ({}))) as { erro?: string };
    const semApi = resposta.status === 502 || resposta.status === 504;
    throw new Error(
      dados.erro ??
        (semApi
          ? "A API não respondeu. Rode npm run dev na pasta api."
          : `Erro ${resposta.status}`)
    );
  }

  return resposta;
}

// ==========================================
// CRUD DE LIVROS (Aula 4)
// ==========================================

export async function listarLivros(): Promise<Livro[]> {
  const resposta = await enviar("GET", "/api/livros");
  return (await resposta.json()) as Livro[];
}

export async function cadastrarLivro(dados: NovoLivro): Promise<Livro> {
  const resposta = await enviar("POST", "/api/livros", dados);
  return (await resposta.json()) as Livro;
}

export async function alterarStatus(id: number, status: StatusLivro): Promise<void> {
  await enviar("PATCH", `/api/livros/${id}/status`, { status });
}

export async function removerLivro(id: number): Promise<void> {
  await enviar("DELETE", `/api/livros/${id}`);
}

// ==========================================
// USUÁRIOS E LOGIN (Aula 5)
// ==========================================

export async function entrar(email: string, senha: string): Promise<Sessao> {
  const resposta = await enviar("POST", "/api/login", { email, senha });
  return (await resposta.json()) as Sessao;
}

export async function criarConta(nome: string, email: string, senha: string): Promise<void> {
  await enviar("POST", "/api/usuarios", { nome, email, senha });
}