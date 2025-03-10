# Sistema de Dívidas - Backend

Este repositório contém o backend do **Sistema de Dívidas**, uma aplicação que permite o gerenciamento de dívidas associadas a clientes, com funcionalidades para cadastro, agendamento de pagamentos e visualização de status.

## Objetivo

O backend tem como objetivo fornecer uma API para o gerenciamento de clientes, dívidas e autenticação. Ele permite:

- Cadastro de clientes e dívidas.
- Vinculação de dívidas aos clientes.
- Agendamento de pagamentos.
- Visualização de dívidas e seus status.

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução para JavaScript no backend.
- **Express.js**: Framework para construção da API.
- **Passport.js**: Autenticação de usuários (clientes e administradores).
- **bcryptjs**: Criptografia de senhas.
- **Sequelize**: ORM para gerenciamento de banco de dados SQL.
- **jsonwebtoken (JWT)**: Implementação de tokens de autenticação.
- **MongoDB**: Banco de dados relacional para armazenamento de dados.

## Funcionalidades Principais

1. **Autenticação e Autorização**:
   - Login de administradores e clientes.
   - Criptografia de senhas com bcryptjs.
   - Uso de JWT para autenticação segura.

2. **Cadastro de Dívidas e Clientes**:
   - Administradores podem cadastrar novos clientes e dívidas.
   - Vinculação de dívidas a clientes específicos.

3. **Agendamento de Pagamentos**:
   - Clientes podem agendar o pagamento de dívidas.
   - Alteração do status da dívida para "agendado".

4. **Visualização de Dívidas**:
   - Administradores podem visualizar todas as dívidas.
   - Clientes podem visualizar apenas suas próprias dívidas.

## Como Executar o Projeto

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/sistema-de-dividas-backend.git
   cd sistema-de-dividas-backend

2. **Instale as dependências**:
   ```bash
   npm install

3. **Configure o banco de dados**:
  Crie um banco de dados no MariaDB ou PostgreSQL.
  Configure as variáveis de ambiente no arquivo .env (veja .env.example).

4. **Inicie o servidor**:
   ```bash
   npm run start
