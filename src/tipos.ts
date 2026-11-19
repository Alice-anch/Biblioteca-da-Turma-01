export type Genero = "ficcao" | "tecnico" | "fantasia" | "biografia";

export type StatusLivro = "disponivel" | "emprestado" | "atrasado";

export interface Livro {
  id: number;
  usuario_id?: number;
  titulo: string;
  autor?: string;
  genero: Genero;
  status: StatusLivro;
  devolucao_prevista?: string | null;
  assuntos: string[];
}

export interface NovoLivro {
  titulo: string;
  autor?: string;
  genero: Genero;
}

// NOVO (Aula 5): quem está logado
export interface Sessao {
  token: string;
  nome: string;
}

// NOVO (Aula 6): os números do painel. Record garante que as três chaves existam.
export type Contagem = Record<StatusLivro, number>;