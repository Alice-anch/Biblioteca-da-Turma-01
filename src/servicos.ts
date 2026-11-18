import type { Livro, NovoLivro } from "./tipos";

function gerarId(lista: Livro[]): number {
  let maior = 0;
  for (const livro of lista) {
    if (livro.id > maior) {
      maior = livro.id;
    }
  }
  return maior + 1;
}

export function adicionarLivro(lista: Livro[], dados: NovoLivro): Livro {
  if (dados.titulo.trim().length < 3) {
    throw new Error("O título precisa ter pelo menos 3 caracteres.");
  }

  const livro: Livro = {
    ...dados,
    id: gerarId(lista),
    status: "disponivel",
    cadastradoEm: new Date(),
  };

  lista.push(livro);
  return livro;
}

export function transformar<T, R>(lista: T[], regra: (item: T) => R): R[] {
  const resultado: R[] = [];
  for (const item of lista) {
    resultado.push(regra(item));
  }
  return resultado;
}