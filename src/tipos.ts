export type Genero = "ficcao" | "tecnico" | "fantasia" | "biografia";

export type StatusLivro = "disponivel" | "emprestado" | "atrasado";

export interface Livro {
  id: number;
  usuario_id?: number;
  titulo: string;
  autor?: string;
  genero: Genero;
  status: StatusLivro;
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