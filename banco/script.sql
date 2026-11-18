SET NAMES utf8mb4;

-- Se estiver usando um editor SQL online (como OneCompiler ou DB Fiddle),
-- mantenha as 3 linhas abaixo comentadas com "--".
-- No MySQL Workbench local, pode remover o "--" delas:
-- DROP DATABASE IF EXISTS biblioteca_turma;
-- CREATE DATABASE biblioteca_turma CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- USE biblioteca_turma;

CREATE TABLE usuarios (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  senha_hash CHAR(60)     NOT NULL,
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_email UNIQUE (email)
);

CREATE TABLE livros (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id         INT UNSIGNED NOT NULL,
  titulo             VARCHAR(120) NOT NULL,
  autor              VARCHAR(100) NULL,
  genero             ENUM('ficcao', 'tecnico', 'fantasia', 'biografia') NOT NULL DEFAULT 'tecnico',
  status             ENUM('disponivel', 'emprestado', 'atrasado') NOT NULL DEFAULT 'disponivel',
  devolucao_prevista DATE         NULL,
  cadastrado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_livros PRIMARY KEY (id),
  CONSTRAINT fk_livros_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT ck_livros_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) >= 3)
);

CREATE TABLE assuntos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  nome       VARCHAR(40)  NOT NULL,
  CONSTRAINT pk_assuntos PRIMARY KEY (id),
  CONSTRAINT uq_assuntos_usuario_nome UNIQUE (usuario_id, nome),
  CONSTRAINT fk_assuntos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
);

CREATE TABLE livro_assunto (
  livro_id   INT UNSIGNED NOT NULL,
  assunto_id INT UNSIGNED NOT NULL,
  CONSTRAINT pk_livro_assunto PRIMARY KEY (livro_id, assunto_id),
  CONSTRAINT fk_livro_assunto_livro FOREIGN KEY (livro_id)
    REFERENCES livros (id) ON DELETE CASCADE,
  CONSTRAINT fk_livro_assunto_assunto FOREIGN KEY (assunto_id)
    REFERENCES assuntos (id) ON DELETE CASCADE
);

-- ============================================================================
-- DESAFIO OURO: Tabela comentarios (1 livro tem N comentários)
-- ============================================================================
CREATE TABLE comentarios (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  livro_id   INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  texto      TEXT         NOT NULL,
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_comentarios PRIMARY KEY (id),
  CONSTRAINT fk_comentarios_livro FOREIGN KEY (livro_id)
    REFERENCES livros (id) ON DELETE CASCADE,
  CONSTRAINT fk_comentarios_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT ck_comentarios_texto CHECK (CHAR_LENGTH(TRIM(texto)) >= 1)
);

-- ============================================================================
-- INSERTS INICIAIS (BRONZE)
-- ============================================================================
INSERT INTO usuarios (nome, email, senha_hash) VALUES
  ('Ana', 'ana@escola.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Bruno', 'bruno@escola.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 6 livros iniciais (4 atrasado, 1 emprestado, 1 disponivel)
INSERT INTO livros (usuario_id, titulo, autor, genero, status, devolucao_prevista) VALUES
  (1, 'Código Limpo', 'Robert C. Martin', 'tecnico', 'atrasado', '2026-10-15'),
  (1, 'O Hobbit', 'J.R.R. Tolkien', 'fantasia', 'disponivel', NULL),
  (1, '1984', 'George Orwell', 'ficcao', 'emprestado', '2026-11-05'),
  (1, 'Entendendo Algoritmos', 'Aditya Bhargava', 'tecnico', 'atrasado', '2026-10-18'),
  (1, 'Steve Jobs', 'Walter Isaacson', 'biografia', 'atrasado', '2026-10-20'),
  (1, 'Duna', 'Frank Herbert', 'ficcao', 'atrasado', '2026-10-22');

INSERT INTO assuntos (usuario_id, nome) VALUES
  (1, 'programacao'),
  (1, 'boas-praticas'),
  (1, 'aventura'),
  (1, 'classico'),
  (1, 'distopia'),
  (1, 'logica');

INSERT INTO livro_assunto (livro_id, assunto_id) VALUES
  (1, 1),
  (1, 2),
  (2, 3),
  (2, 4),
  (3, 5),
  (4, 6);

-- ============================================================================
-- DESAFIO PRATA: 2 livros novos para a Ana + assunto ligado em livro_assunto
-- ============================================================================
-- Novos livros receberão os ids 7 e 8
INSERT INTO livros (usuario_id, titulo, autor, genero, status, devolucao_prevista) VALUES
  (1, 'Arquitetura Limpa', 'Robert C. Martin', 'tecnico', 'disponivel', NULL),
  (1, 'O Senhor dos Anéis', 'J.R.R. Tolkien', 'fantasia', 'emprestado', '2026-11-25');

-- Liga o livro 7 ('Arquitetura Limpa') ao assunto 1 ('programacao')
-- Liga o livro 8 ('O Senhor dos Anéis') ao assunto 3 ('aventura')
INSERT INTO livro_assunto (livro_id, assunto_id) VALUES
  (7, 1),
  (8, 3);

-- Exemplo de comentário para testar a tabela do Desafio Ouro
INSERT INTO comentarios (livro_id, usuario_id, texto) VALUES
  (1, 2, 'Excelente leitura para quem está começando na área de desenvolvimento!');

-- ============================================================================
-- CONSULTAS DE CONFERÊNCIA
-- ============================================================================
SELECT * FROM livros;

SELECT l.titulo, a.nome AS assunto
FROM livros l
JOIN livro_assunto la ON l.id = la.livro_id
JOIN assuntos a ON a.id = la.assunto_id
WHERE l.id IN (7, 8);