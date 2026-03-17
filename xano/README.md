# Importar a Events Platform no Xano

Este guia explica como exportar os dados e o schema da plataforma Events e importá-los em um **workspace do Xano**.

---

## O que é o Xano?

[Xano](https://www.xano.com) é uma plataforma no-code de backend que permite criar APIs, bancos de dados e lógica de negócio sem escrever código de servidor. Ao importar o workspace desta plataforma, você obtém automaticamente:

- As **tabelas** do banco de dados (`user`, `event`, `participant`)  
- Os **endpoints de API** mapeados para os grupos Auth, Events, Registrations e Users

---

## Arquivos deste diretório

| Arquivo | Descrição |
|---|---|
| `workspace.json` | Schema completo do workspace (tabelas + endpoints) sem dados |

---

## Passo a passo: exportar e importar

### 1. Pré-requisitos

- Node.js 14 ou superior instalado
- MongoDB com os dados da plataforma Events em execução
- Conta ativa no [Xano](https://www.xano.com)

---

### 2. Gerar o arquivo de exportação

Execute o script de exportação a partir da raiz do repositório:

```bash
# Apenas o schema (sem dados do banco)
cp xano/workspace.json xano/workspace-export.json

# Com dados do banco de dados (requer MongoDB em execução)
MONGODB_URI=mongodb://localhost:27017/events node xano-export.js
```

O arquivo gerado ficará salvo em `xano/workspace-export-<timestamp>.json`.

Você também pode definir um caminho de saída customizado:

```bash
MONGODB_URI=mongodb://localhost:27017/events node xano-export.js --output ./meu-workspace.json
```

---

### 3. Importar no Xano

1. Acesse [https://app.xano.com](https://app.xano.com) e faça login
2. Na tela de **Workspaces**, clique em **"+ New Workspace"** ou abra um workspace existente
3. Dentro do workspace, clique no ícone de **engrenagem (⚙)** no canto superior direito → **"Settings"**
4. Na aba **"Import"**, clique em **"Import Workspace"**
5. Selecione o arquivo JSON gerado (`workspace.json` ou o arquivo com timestamp)
6. Clique em **"Import"** e aguarde a conclusão

> **Dica:** Para importar apenas o schema (sem dados), use o arquivo `xano/workspace.json` diretamente.

---

### 4. Estrutura do workspace importado

Após a importação, o Xano criará automaticamente:

#### Tabelas

| Tabela | Descrição | Campos principais |
|---|---|---|
| `user` | Usuários da plataforma | `username`, `email`, `password`, `role`, `is_active` |
| `event` | Eventos criados | `title`, `description`, `date_time`, `total_slots`, `available_slots`, `event_code`, `user_id` |
| `participant` | Inscrições em eventos | `event_id`, `name`, `email`, `phone`, `status`, `verification_code` |

#### Grupos de API

| Grupo | Endpoints |
|---|---|
| **Auth** | `POST /auth/login` |
| **Events** | `GET /events`, `GET /events/{id}`, `GET /events/{id}/participants`, `GET /events/my-events`, `POST /events`, `PUT /events/{id}`, `DELETE /events/{id}`, `POST /events/{id}/send-reminder` |
| **Registrations** | `POST /registrations`, `POST /registrations/{id}/cancel`, `POST /registrations/{id}/confirm` |
| **Users** | `GET /users`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}` |

---

### 5. Configurar autenticação JWT no Xano

Após importar, configure o **Auth Settings** do Xano para replicar o comportamento JWT da aplicação original:

1. No workspace, vá em **"Settings" → "Auth"**
2. Selecione **"JWT"** como tipo de autenticação
3. Defina a tabela de usuários como **`user`**
4. Confirme que o campo de senha usa **bcrypt** (o Xano suporta nativamente)

---

## Mapeamento de campos (MongoDB → Xano)

| Campo MongoDB | Campo Xano | Tipo |
|---|---|---|
| `_id` | `id` | `id` |
| `createdAt` | `created_at` | `timestamp` |
| `dateTime` | `date_time` | `timestamp` |
| `totalSlots` | `total_slots` | `int` |
| `availableSlots` | `available_slots` | `int` |
| `isActive` | `is_active` | `bool` |
| `eventCode` | `event_code` | `text` |
| `userId` | `user_id` | `table_reference` |
| `eventId` | `event_id` | `table_reference` |
| `registeredAt` | `registered_at` | `timestamp` |
| `verificationCode` | `verification_code` | `text` |
| `verificationCodeExpiresAt` | `verification_code_expires_at` | `timestamp` |
| `confirmedAt` | `confirmed_at` | `timestamp` |
