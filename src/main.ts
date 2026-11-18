import { campo, elemento, selecao } from "./dom";
import {
  alterarStatus,
  cadastrarLivro,
  criarConta,
  encerrarSessao,
  entrar,
  guardarSessao,
  listarLivros,
  removerLivro,
  sessaoAtual,
} from "./api";
import type { Genero, Livro, StatusLivro } from "./tipos";

elemento("nome-do-sistema").textContent = "Biblioteca da Turma";
elemento("versao").textContent = "v0.5.0";
elemento("data-de-hoje").textContent = new Date().toLocaleDateString("pt-BR");

const corPorStatus: Record<StatusLivro, string> = {
  atrasado: "alta",     // vermelho
  emprestado: "media",  // laranja
  disponivel: "baixa",  // verde
};

let lista: Livro[] = [];

function mostrarErro(erro: unknown): void {
  elemento("erro").textContent =
    erro instanceof Error ? erro.message : "Erro inesperado.";
}

// Ajudante para criar botões de ação (Aula 4)
function botao(texto: string, extra: string, aoClicar: () => void): HTMLButtonElement {
  const elementoBotao = document.createElement("button");
  elementoBotao.type = "button";
  elementoBotao.className = `botao botao--pequeno ${extra}`;
  elementoBotao.textContent = texto;
  elementoBotao.addEventListener("click", aoClicar);
  return elementoBotao;
}

function criarItem(livro: Livro): HTMLLIElement {
  const item = document.createElement("li");
  const classeCor = corPorStatus[livro.status];
  item.className = `tarefa tarefa--${classeCor}`;

  const principal = document.createElement("div");

  const titulo = document.createElement("h3");
  titulo.className = "tarefa__titulo";
  titulo.textContent = `#${livro.id} ${livro.titulo} (${livro.genero})`;

  const meta = document.createElement("div");
  meta.className = "tarefa__meta";

  const etiqueta = document.createElement("span");
  etiqueta.className = `etiqueta etiqueta--${classeCor}`;
  etiqueta.textContent = livro.status;

  meta.append(etiqueta);
  principal.append(titulo, meta);

  // Botões de status e remoção (Aula 4)
  const acoes = document.createElement("div");
  acoes.className = "tarefa__acoes";

  if (livro.status === "disponivel") {
    acoes.append(
      botao("Emprestar", "", () => mudarStatus(livro.id, "emprestado")),
      botao("Marcar atraso", "", () => mudarStatus(livro.id, "atrasado"))
    );
  } else {
    acoes.append(
      botao("Devolver", "botao--sucesso", () => mudarStatus(livro.id, "disponivel"))
    );
  }

  acoes.append(botao("Remover", "botao--perigo", () => remover(livro.id)));

  item.append(principal, acoes);
  return item;
}

function desenhar(): void {
  elemento("lista").replaceChildren(...lista.map(criarItem));

  const atrasados = lista.filter((l) => l.status === "atrasado");
  elemento("total").textContent = String(lista.length);
  elemento("pendentes").textContent = String(atrasados.length);

  const primeiroAtrasado = lista.find((l) => l.status === "atrasado");

  if (primeiroAtrasado) {
    elemento("comece-por").textContent = `Atenção - Devolução atrasada: #${primeiroAtrasado.id} ${primeiroAtrasado.titulo}`;
    elemento("comece-por").hidden = false;
  } else {
    elemento("comece-por").hidden = true;
  }
}

// ==========================================
// AÇÕES DO CRUD NA TELA (Aula 4)
// ==========================================

async function mudarStatus(id: number, status: StatusLivro): Promise<void> {
  try {
    await alterarStatus(id, status);
    lista = lista.map((l) => (l.id === id ? { ...l, status } : l));
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function remover(id: number): Promise<void> {
  try {
    await removerLivro(id);
    lista = lista.filter((l) => l.id !== id);
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

elemento("formulario").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  elemento("erro").textContent = "";

  try {
    const nova = await cadastrarLivro({
      titulo: campo("titulo").value.trim(),
      genero: selecao("genero").value as Genero,
    });
    lista = [...lista, nova];
    campo("titulo").value = "";
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
});

// ==========================================
// TELA DE ENTRADA E SESSÃO (Aula 5)
// ==========================================

function mostrarErroEntrada(erro: unknown): void {
  const mensagem = erro instanceof Error ? erro.message : "Erro inesperado.";
  elemento("erro-entrada").textContent = mensagem;
}

function mostrarFormulario(criando: boolean): void {
  elemento("form-criar").hidden = !criando;
  elemento("form-entrar").hidden = criando;
  elemento("alternar-entrada").textContent = criando
    ? "Já tenho conta"
    : "Ainda não tenho conta";
  elemento("erro-entrada").textContent = "";
}

elemento("alternar-entrada").addEventListener("click", () => {
  mostrarFormulario(elemento("form-criar").hidden === true);
});

elemento("form-entrar").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  try {
    guardarSessao(
      await entrar(campo("entrar-email").value, campo("entrar-senha").value)
    );
    campo("entrar-senha").value = "";
    await iniciar();
  } catch (erro) {
    mostrarErroEntrada(erro);
  }
});

elemento("form-criar").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const email = campo("criar-email").value;
  const senha = campo("criar-senha").value;

  try {
    await criarConta(campo("criar-nome").value, email, senha);
    guardarSessao(await entrar(email, senha));
    (elemento("form-criar") as HTMLFormElement).reset();
    await iniciar();
  } catch (erro) {
    mostrarErroEntrada(erro);
  }
});

elemento("botao-sair").addEventListener("click", () => {
  encerrarSessao();
  lista = [];
  (elemento("form-entrar") as HTMLFormElement).reset();
  mostrarFormulario(false);
  iniciar();
});

// ==========================================
// INICIALIZAÇÃO DO SISTEMA
// ==========================================

async function iniciar(): Promise<void> {
  const sessao = sessaoAtual();

  elemento("tela-entrada").hidden = sessao !== undefined;
  elemento("tela-app").hidden = sessao === undefined;
  elemento("botao-sair").hidden = sessao === undefined;
  elemento("usuario-nome").textContent = sessao?.nome ?? "";

  if (!sessao) {
    return;
  }

  elemento("erro-entrada").textContent = "";

  try {
    lista = await listarLivros();
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

iniciar();