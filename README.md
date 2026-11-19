# Biblioteca da Turma

Sistema web full-stack para cadastro, controle de empréstimos e consulta do acervo de livros da turma, com autenticação por usuário, categorização por assuntos e persistência em MySQL.

Projeto da disciplina — Grupo Anchieta, 2026.

## Como rodar o projeto

1. **Banco de dados:** Execute o script `banco/script.sql` no MySQL Workbench (ou cliente MySQL conectado ao servidor) para criar as tabelas e popular os dados iniciais.
2. **Configuração da API:** Na pasta `api/`, copie `.env.exemplo` para `.env` e preencha os dados de conexão (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `JWT_SEGREDO`).
3. **Subir o Back-end:** No terminal, entre na pasta `api/` e execute:
   ```bash
   npm install
   npm run dev