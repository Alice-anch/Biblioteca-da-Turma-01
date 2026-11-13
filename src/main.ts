import { campo, elemento, selecao } from "./dom";
import { livros } from "./dados";
import type { Genero, Livro, StatusLivro } from "./tipos";
import { adicionarLivro, transformar } from "./servicos";

elemento("nome-do-sistema").textContent = "Biblioteca da Turma";
elemento("versao").textContent = "v0.2.0";
elemento("data-de-hoje").textContent = new Date().toLocaleDateString("pt-BR");

const corPorStatus: Record<StatusLivro, string> = {
  atrasado: "alta",     // vermelho
  emprestado: "media",  // laranja
  disponivel: "baixa",  // verde
};

const lista: Livro[] = [...livros];

function criarItem(livro: Livro): HTMLLIElement {
  const item = document.createElement("li");
  const classeCor = corPorStatus[livro.status];
  item.className = `tarefa tarefa--${classeCor}`;

  const titulo = document.createElement("h3");
  titulo.className = "tarefa__titulo";
  titulo.textContent = `#${livro.id} ${livro.titulo} (${livro.genero})`;

  const etiqueta = document.createElement("span");
  etiqueta.className = `etiqueta etiqueta--${classeCor}`;
  etiqueta.textContent = livro.status;

  item.append(titulo, etiqueta);
  return item;
}

function desenhar(): void {
  const itens = transformar(lista, criarItem);
  elemento("lista").replaceChildren(...itens);

  let atrasados = 0;
  for (const livro of lista) {
    if (livro.status === "atrasado") {
      atrasados++;
    }
  }

  elemento("total").textContent = String(lista.length);
  elemento("pendentes").textContent = String(atrasados);

  let posicao = 0;
  while (posicao < lista.length && lista[posicao].status !== "atrasado") {
    posicao++;
  }

  if (posicao < lista.length) {
    const atrasado = lista[posicao];
    elemento("comece-por").textContent = `Atenção - Devolução atrasada: #${atrasado.id} ${atrasado.titulo}`;
    elemento("comece-por").hidden = false;
  } else {
    elemento("comece-por").hidden = true;
  }
}

elemento("formulario").addEventListener("submit", (evento) => {
  evento.preventDefault();
  elemento("erro").textContent = "";

  try {
    adicionarLivro(lista, {
      titulo: campo("titulo").value.trim(),
      genero: selecao("genero").value as Genero,
      assuntos: [],
    });
    campo("titulo").value = "";
    desenhar();
  } catch (erro) {
    if (erro instanceof Error) {
      elemento("erro").textContent = erro.message;
    }
  }
});

desenhar();