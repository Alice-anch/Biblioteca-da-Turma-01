import type { Contagem, Livro, StatusLivro } from "./tipos";

// filter: seleciona livros por status no navegador
export function filtrarPorStatus(lista: Livro[], status: StatusLivro): Livro[] {
  return lista.filter((livro) => livro.status === status);
}

// filter + includes: pesquisa sem diferenciar maiúsculas de minúsculas (título ou autor)
export function pesquisarLivros(lista: Livro[], termo: string): Livro[] {
  const procurado = termo.trim().toLowerCase();
  return lista.filter(
    (livro) =>
      livro.titulo.toLowerCase().includes(procurado) ||
      (livro.autor ?? "").toLowerCase().includes(procurado)
  );
}

// some: existe pelo menos um livro com devolução atrasada?
export function existeAtrasado(lista: Livro[]): boolean {
  return lista.some((livro) => livro.status === "atrasado");
}

// every: todos os livros estão disponíveis no acervo?
export function todosDisponiveis(lista: Livro[]): boolean {
  return lista.length > 0 && lista.every((livro) => livro.status === "disponivel");
}

// reduce: o painel calculado no navegador (Desafio Prata: útil quando a lista já está toda carregada)
export function contarPorStatus(lista: Livro[]): Contagem {
  return lista.reduce<Contagem>(
    (acumulador, livro) => {
      acumulador[livro.status]++;
      return acumulador;
    },
    { disponivel: 0, emprestado: 0, atrasado: 0 }
  );
}

// sort: ordena sem estragar o array original ([...lista]), colocando atrasados no topo
const pesoStatus: Record<StatusLivro, number> = {
  atrasado: 3,
  emprestado: 2,
  disponivel: 1,
};

export function ordenarPorUrgencia(lista: Livro[]): Livro[] {
  return [...lista].sort((a, b) => pesoStatus[b.status] - pesoStatus[a.status]);
}