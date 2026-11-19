import {
  alterarStatus,
  buscarEstatisticas,
  cadastrarLivro,
  criarConta,
  encerrarSessao,
  entrar,
  guardarSessao,
  listarLivros,
  removerLivro,
  sessaoAtual,
} from "./api";
import { campo, elemento, selecao } from "./dom";
import {
  contarPorStatus,
  existeAtrasado,
  filtrarPorStatus,
  ordenarPorUrgencia,
  pesquisarLivros,
  todosDisponiveis,
} from "./servicos";
import type { Genero, Livro, StatusLivro } from "./tipos";

elemento("nome-do-sistema").textContent = "Biblioteca da Turma";
elemento("versao").textContent = "v0.6.0";
elemento("data-de-hoje").textContent = new Date().toLocaleDateString("pt-BR");

const corPorStatus: Record<StatusLivro, string> = {
  atrasado: "alta",     // vermelho
  emprestado: "media",  // laranja
  disponivel: "baixa",  // verde
};

let lista: Livro[] = [];
let statusSelecionado: StatusLivro | "todos" = "todos";
let termoDeBusca = "";

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
  const infoAutor = livro.autor && livro.autor !== "Autor não informado" ? ` — ${livro.autor}` : "";
  titulo.textContent = `#${livro.id} ${livro.titulo}${infoAutor}`;

  const meta = document.createElement("div");
  meta.className = "tarefa__meta";

  const etiquetaStatus = document.createElement("span");
  etiquetaStatus.className = `etiqueta etiqueta--${classeCor}`;
  etiquetaStatus.textContent = livro.status;

  const etiquetaGenero = document.createElement("span");
  etiquetaGenero.className = "tarefa__prazo";
  etiquetaGenero.textContent = `Gênero: ${livro.genero}`;

  // Assuntos vindos da relação N:N via GROUP_CONCAT (Aula 6)
  const tagsAssuntos = (livro.assuntos ?? []).map((assunto) => {
    const elementoTag = document.createElement("span");
    elementoTag.className = "tag";
    elementoTag.textContent = assunto;
    return elementoTag;
  });

  meta.append(etiquetaStatus, etiquetaGenero, ...tagsAssuntos);
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

// Quais livros mostrar: filtrar, pesquisar e ordenar sem alterar `lista`
function livrosVisiveis(): Livro[] {
  let resultado = lista;

  if (statusSelecionado !== "todos") {
    resultado = filtrarPorStatus(resultado, statusSelecionado);
  }

  if (termoDeBusca.trim() !== "") {
    resultado = pesquisarLivros(resultado, termoDeBusca);
  }

  return ordenarPorUrgencia(resultado);
}

// Atualiza o painel usando o GROUP BY do banco (melhor quando há paginação ou muitos dados)
// Alternativa local no navegador (melhor quando todos os dados já estão carregados): contarPorStatus(lista)
async function atualizarPainel(): Promise<void> {
  const contagem = await buscarEstatisticas();
  const total = contagem.disponivel + contagem.emprestado + contagem.atrasado;

  elemento("total").textContent = String(total);
  elemento("disponiveis").textContent = String(contagem.disponivel);
  elemento("emprestados").textContent = String(contagem.emprestado);
  elemento("atrasados").textContent = String(contagem.atrasado);
}

function desenhar(): void {
  const visiveis = livrosVisiveis();

  elemento("lista").replaceChildren(...visiveis.map(criarItem));
  elemento("vazio").hidden = visiveis.length > 0;

  // some: exibe aviso amarelo se existir pelo menos um livro atrasado
  elemento("aviso-urgente").classList.toggle(
    "aviso--oculto",
    !existeAtrasado(lista)
  );

  // every: verifica se todos os livros estão disponíveis
  if (todosDisponiveis(lista)) {
    console.log("Todos os livros estão disponíveis no acervo!");
  }

  // Mantém a referência da contagem local para demonstração
  void contarPorStatus(lista);

  atualizarPainel().catch(mostrarErro);
}

// ==========================================
// FILTROS E BUSCA NA TELA (Aula 6)
// ==========================================

elemento("filtros-status").addEventListener("click", (evento) => {
  const alvo = evento.target;
  if (!(alvo instanceof HTMLButtonElement)) return;

  const escolhido = alvo.dataset.status;
  if (!escolhido) return;

  statusSelecionado = escolhido as StatusLivro | "todos";

  for (const b of elemento("filtros-status").querySelectorAll("button")) {
    b.classList.toggle("filtro--ativo", b === alvo);
  }

  desenhar();
});

campo("busca").addEventListener("input", () => {
  termoDeBusca = campo("busca").value;
  desenhar();
});

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
    const novo = await cadastrarLivro({
      titulo: campo("titulo").value.trim(),
      autor: campo("autor").value.trim() || undefined,
      genero: selecao("genero").value as Genero,
    });
    lista = [...lista, novo];
    campo("titulo").value = "";
    campo("autor").value = "";
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
  statusSelecionado = "todos";
  termoDeBusca = "";
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