import type { Livro } from "./tipos";

// Todos os livros que estão no banco
export async function listarLivros(): Promise<Livro[]> {
  const resposta = await fetch("/api/livros");
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar os livros. A API está rodando?");
  }
  return (await resposta.json()) as Livro[];
}

// Um livro: devolve undefined se ele não existir (mesmo padrão do find)
export async function buscarLivro(id: number): Promise<Livro | undefined> {
  const resposta = await fetch(`/api/livros/${id}`);
  if (resposta.status === 404) {
    return undefined;
  }
  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} ao buscar o livro #${id}.`);
  }
  return (await resposta.json()) as Livro;
}