export type Genero = "ficcao" | "tecnico" | "fantasia" | "biografia";

export type StatusLivro = "disponivel" | "emprestado" | "atrasado";

export const GENEROS: Genero[] = [
  "ficcao",
  "tecnico",
  "fantasia",
  "biografia",
];

export const STATUS_LIVRO: StatusLivro[] = [
  "disponivel",
  "emprestado",
  "atrasado",
];

export interface DadosLivro {
  titulo?: string;
  autor?: string;
  genero?: Genero;
  status?: StatusLivro;
}