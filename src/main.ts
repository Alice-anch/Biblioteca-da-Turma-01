import { campo, elemento, selecao } from "./dom";
import { buscarLivro, listarLivros } from "./api";
import type { Genero, Livro, StatusLivro } from "./tipos";
import { adicionarLivro } from "./servicos";

elemento("nome-do-sistema").textContent = "Biblioteca da Turma";
elemento("versao").textContent = "v0.3.0";
elemento("data-de-hoje").textContent = new Date().toLocaleDateString("pt-BR");

const corPorStatus: Record<StatusLivro, string> = {
  atrasado: "alta",     // vermelho
  emprestado: "media",  // laranja
  disponivel: "baixa",  // verde
};

// Começa vazia: quem preenche é a API
let lista: Livro[] = [];

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
  // map: substitui o transformar da Aula 2
  elemento("lista").replaceChildren(...lista.map(criarItem));

  // filter: substitui o laço for para contar os atrasados
  const atrasados = lista.filter((l) => l.status === "atrasado");

  elemento("total").textContent = String(lista.length);
  elemento("pendentes").textContent = String(atrasados.length);

  // find: substitui o while para achar o primeiro atrasado
  const primeiroAtrasado = lista.find((l) => l.status === "atrasado");

  if (primeiroAtrasado) {
    elemento("comece-por").textContent = `Atenção - Devolução atrasada: #${primeiroAtrasado.id} ${primeiroAtrasado.titulo}`;
    elemento("comece-por").hidden = false;
  } else {
    elemento("comece-por").hidden = true;
  }
}

// O cadastro ainda grava só na tela na Aula 3 (vai para o banco na Aula 4)
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

// Desafio Prata: busca um livro pelo id e mostra no console
async function mostrarLivro(id: number): Promise<void> {
  const procurado = await buscarLivro(id);
  if (procurado) {
    console.log(`Encontrado: ${procurado.titulo}`);
  } else {
    console.log("Livro não encontrado.");
  }
}

// Começo do programa: busca no banco, depois desenha
async function iniciar(): Promise<void> {
  try {
    lista = await listarLivros();
    desenhar();
  } catch (erro) {
    if (erro instanceof Error) {
      // Desafio Ouro: mostra na tela quando a API estiver fora do ar
      elemento("erro").textContent = erro.message;
    }
  }

  await mostrarLivro(3);
}

iniciar();