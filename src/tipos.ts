export type StatusLivro = "disponivel" | "emprestado" | "atrasado";
export type Genero = "ficcao" | "tecnico" | "fantasia" | "biografia";

export interface Livro {
  readonly id: number;
  titulo: string;
  autor?: string | null;
  genero: Genero;
  status: StatusLivro;
  assuntos: string[];
  devolucaoPrevista?: string | null;
  cadastradoEm: Date;
}

export type NovoLivro = Omit<Livro, "id" | "status" | "cadastradoEm">;