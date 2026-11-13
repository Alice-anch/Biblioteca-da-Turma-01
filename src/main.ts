import { elemento } from "./dom";
import { livros } from "./dados";
import type { StatusLivro } from "./tipos";

// 1. Cabeçalho
const nomeDoSistema: string = "Biblioteca da Turma";
const versao: string = "0.1.0";
const hoje: string = new Date().toLocaleDateString("pt-BR");

elemento("nome-do-sistema").textContent = nomeDoSistema;
elemento("versao").textContent = `v${versao}`;
elemento("data-de-hoje").textContent = hoje;

// Mapeia o status do livro para as classes de cor do CSS
const corPorStatus: Record<StatusLivro, string> = {
  atrasado: "alta",     // vermelho
  emprestado: "media",  // laranja
  disponivel: "baixa",  // verde
};

// 2. LAÇO 1 (for...of): Desenhar a lista de livros
const lista = elemento("lista");

for (const livro of livros) {
  const item = document.createElement("li");
  const classeCor = corPorStatus[livro.status];
  item.className = `tarefa tarefa--${classeCor}`;

  const titulo = document.createElement("h3");
  titulo.className = "tarefa_titulo";
  titulo.textContent = `#${livro.id} ${livro.titulo} (${livro.genero})`;

  const etiqueta = document.createElement("span");
  etiqueta.className = `etiqueta etiqueta--${classeCor}`;
  etiqueta.textContent = livro.status;

  item.append(titulo, etiqueta);
  lista.append(item);
}

// 3. LAÇO 2 (for com índice): Contar os livros disponíveis
let disponiveis = 0;
for (let i = 0; i < livros.length; i++) {
  if (livros[i].status === "disponivel") {
    disponiveis++;
  }
}

elemento("total").textContent = String(livros.length);
elemento("pendentes").textContent = String(disponiveis);

// 4. LAÇO 3 (while): Encontrar o primeiro livro atrasado para exibir o aviso
let posicao = 0;
while (posicao < livros.length && livros[posicao].status !== "atrasado") {
  posicao++;
}

if (posicao < livros.length) {
  const atrasado = livros[posicao];
  elemento("comece-por").textContent = `Atenção - Devolução atrasada: #${atrasado.id} ${atrasado.titulo}`;
  elemento("comece-por").hidden = false;
}