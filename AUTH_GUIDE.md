# Guia de Autenticação e Autorização

Este documento descreve o sistema de autenticação e autorização implementado na Plataforma de Eventos.

## 📋 Visão Geral

O sistema implementa autenticação completa com gerenciamento de usuários e grupos, utilizando:
- **Express Session**: Gerenciamento de sessões com MongoDB
- **Bcrypt**: Hash seguro de senhas
- **Clean Architecture**: Separação de domínio, aplicação e infraestrutura

## 🔐 Recursos Implementados

### 1. Autenticação de Usuários
- **Login**: `/login` - Página de login com formulário
- **Registro**: Modal na página de login para criar nova conta
- **Logout**: Disponível em todas as páginas autenticadas
- **Sessões**: Sessões persistentes por 7 dias com MongoDB

### 2. Proteção de Rotas
- `/admin` - Requer autenticação
- `/users` - Requer autenticação (gerenciamento de usuários)
- `/groups` - Requer autenticação (gerenciamento de grupos)
- Todas as rotas `/api/users/*` e `/api/groups/*` requerem autenticação

### 3. Gerenciamento de Usuários
Localização: `/users`

**Funcionalidades:**
- Listar todos os usuários (com paginação)
- Editar usuários (username, email, senha, status)
- Desativar/Ativar contas de usuário
- Excluir usuários
- Visualizar grupos do usuário

### 4. Gerenciamento de Grupos
Localização: `/groups`

**Funcionalidades:**
- Criar novos grupos
- Listar todos os grupos (com paginação)
- Editar grupos (nome, descrição, permissões)
- Excluir grupos
- Definir permissões por grupo

## 🏗️ Arquitetura

### Camadas Implementadas

```
src/
├── domain/
│   ├── entities/
│   │   ├── User.js              # Entidade de usuário
│   │   └── Group.js             # Entidade de grupo
│   └── repositories/
│       ├── UserRepository.js    # Interface de repositório
│       └── GroupRepository.js   # Interface de repositório
│
├── application/
│   └── use-cases/
│       ├── LoginUseCase.js              # Login de usuário
│       ├── RegisterUserUseCase.js       # Registro de usuário
│       ├── ListUsersUseCase.js          # Listar usuários
│       ├── UpdateUserUseCase.js         # Atualizar usuário
│       ├── DeleteUserUseCase.js         # Deletar usuário
│       ├── CreateGroupUseCase.js        # Criar grupo
│       ├── ListGroupsUseCase.js         # Listar grupos
│       ├── UpdateGroupUseCase.js        # Atualizar grupo
│       └── DeleteGroupUseCase.js        # Deletar grupo
│
└── infrastructure/
    ├── database/
    │   ├── UserModel.js                 # Schema MongoDB
    │   ├── GroupModel.js                # Schema MongoDB
    │   ├── MongoUserRepository.js       # Implementação
    │   └── MongoGroupRepository.js      # Implementação
    │
    └── web/
        ├── controllers/
        │   ├── AuthController.js        # Login/Logout/Register
        │   ├── UserController.js        # CRUD de usuários
        │   └── GroupController.js       # CRUD de grupos
        │
        ├── middleware/
        │   └── authMiddleware.js        # Verificação de autenticação
        │
        └── routes/
            ├── authRoutes.js            # Rotas de autenticação
            ├── userRoutes.js            # Rotas de usuários
            └── groupRoutes.js           # Rotas de grupos
```

## 🚀 Uso

### Primeiro Acesso

1. **Execute o seed para criar o usuário admin:**
```bash
npm run seed
```

Credenciais padrão:
- **Username**: admin
- **Password**: admin123
- **Email**: admin@events.com

2. **Inicie a aplicação:**
```bash
npm start
```

3. **Acesse a página de login:**
```
http://localhost:3000/login
```

### Criar Novo Usuário

**Via Interface:**
1. Acesse `/login`
2. Clique em "Criar Conta"
3. Preencha: username, email, senha
4. Após criar, faça login

**Via API:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao",
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### Fazer Login

**Via Interface:**
1. Acesse `/login`
2. Digite username e senha
3. Clique em "Entrar"

**Via API:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' \
  -c cookies.txt
```

### Fazer Logout

**Via Interface:**
- Clique no botão "Sair" no menu de navegação

**Via API:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## 📚 API Endpoints

### Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/login` | Login de usuário | Não |
| POST | `/api/auth/register` | Criar conta | Não |
| POST | `/api/auth/logout` | Logout | Sim |
| GET | `/api/auth/me` | Dados do usuário atual | Sim |

### Usuários

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/users` | Listar usuários | Sim |
| PUT | `/api/users/:id` | Atualizar usuário | Sim |
| DELETE | `/api/users/:id` | Deletar usuário | Sim |

### Grupos

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/groups` | Listar grupos | Sim |
| POST | `/api/groups` | Criar grupo | Sim |
| PUT | `/api/groups/:id` | Atualizar grupo | Sim |
| DELETE | `/api/groups/:id` | Deletar grupo | Sim |

## 🔒 Segurança

### Implementações de Segurança

1. **Senhas Hasheadas**: Bcrypt com salt de 10 rounds
2. **Sessões Seguras**:
   - HttpOnly cookies (previne XSS)
   - SameSite: lax (previne CSRF)
   - Secure em produção (HTTPS only)
3. **Validação de Entrada**: 
   - Username mínimo 3 caracteres
   - Email válido
   - Senha mínimo 6 caracteres
4. **Proteção de Rotas**: Middleware verifica autenticação
5. **Rate Limiting**: 100 requisições por 15 minutos

### Variáveis de Ambiente

Adicione ao arquivo `.env`:
```env
SESSION_SECRET=your-super-secret-key-change-this-in-production
MONGODB_URI=mongodb://localhost:27017/events
NODE_ENV=production  # Em produção
```

⚠️ **IMPORTANTE**: Altere `SESSION_SECRET` em produção para uma string aleatória forte!

### Considerações de Segurança em Produção

#### CSRF Protection
O sistema usa `SameSite: lax` nos cookies de sessão, que oferece proteção básica contra CSRF. Para aplicações críticas, considere:
- Implementar CSRF tokens manualmente
- Usar bibliotecas modernas como `csrf-csrf` ou `double-csrf`
- Configurar `SameSite: strict` se compatível com sua aplicação

**Nota**: A biblioteca `csurf` está depreciada. Para produção, recomenda-se implementar proteção CSRF adicional usando outras bibliotecas ou padrões como double-submit cookie.

## 🧪 Testes

Os testes existentes continuam funcionando:
```bash
npm test
```

Resultado: **96 testes passando** ✅

## 📖 Exemplos de Uso

### Criar Grupo Admin
```javascript
// POST /api/groups
{
  "name": "Administradores",
  "description": "Grupo com acesso total",
  "permissions": [
    "events:create",
    "events:update", 
    "events:delete",
    "users:manage",
    "groups:manage"
  ]
}
```

### Atualizar Usuário
```javascript
// PUT /api/users/:id
{
  "username": "joao_silva",
  "email": "joao@example.com",
  "groups": ["Administradores"],
  "isActive": true
}
```

### Adicionar Permissões a Grupo
```javascript
// PUT /api/groups/:id
{
  "permissions": [
    "events:create",
    "events:read"
  ]
}
```

## 🔄 Fluxo de Autenticação e Autorização

### Autenticação
1. Usuário acessa `/admin`
2. Middleware verifica se há sessão ativa
3. Se não autenticado: redireciona para `/login`
4. Usuário faz login
5. Sistema verifica credenciais
6. Cria sessão no MongoDB
7. Retorna cookie de sessão
8. Usuário pode acessar páginas autenticadas

### Autorização (Permissões Granulares)
1. Usuário acessa endpoint protegido (ex: `/api/users`)
2. Middleware `isAuthenticated` verifica autenticação
3. Middleware `hasPermission` verifica permissão específica
4. Sistema busca usuário com grupos do banco de dados
5. Verifica se algum grupo do usuário tem a permissão requerida
6. Se não tem: retorna 403 com erro detalhado
7. Se tem: permite acesso ao endpoint

## 🔐 Sistema de Permissões Granulares

### Permissões Disponíveis

**Usuários:**
- `users:read` - Visualizar lista de usuários
- `users:update` - Atualizar usuários
- `users:delete` - Excluir usuários

**Grupos:**
- `groups:read` - Visualizar lista de grupos
- `groups:create` - Criar novos grupos
- `groups:update` - Atualizar grupos
- `groups:delete` - Excluir grupos

**Eventos:**
- `events:create` - Criar eventos
- `events:read` - Visualizar eventos
- `events:update` - Atualizar eventos
- `events:delete` - Excluir eventos

### Grupos Padrão

**Super Administradores:**
```json
{
  "name": "Super Administradores",
  "permissions": [
    "users:read", "users:update", "users:delete",
    "groups:read", "groups:create", "groups:update", "groups:delete",
    "events:create", "events:read", "events:update", "events:delete"
  ]
}
```

**Administradores:**
```json
{
  "name": "Administradores",
  "permissions": [
    "events:create", "events:read", "events:update", "events:delete"
  ]
}
```

### Usuários de Teste

**Super Admin (acesso total):**
- Username: `admin`
- Password: `admin123`
- Grupo: Super Administradores
- Pode gerenciar usuários, grupos e eventos

**Usuário Regular (apenas eventos):**
- Username: `user`
- Password: `user123`
- Grupo: Administradores
- Pode apenas gerenciar eventos

### Exemplo de Erro de Permissão

Quando usuário tenta acessar endpoint sem permissão:
```json
{
  "error": "Permission denied",
  "required": "users:update",
  "message": "You do not have the 'users:update' permission"
}
```

## 🎯 Próximos Passos

Melhorias futuras possíveis:
- [x] ~~Sistema de permissões granulares~~ ✅ **Implementado**
- [ ] Proteção CSRF com tokens (csrf-csrf ou double-submit cookie)
- [ ] Autenticação de dois fatores (2FA)
- [ ] OAuth2 / Social Login
- [ ] Auditoria de ações dos usuários
- [ ] Recuperação de senha por email
- [ ] Política de expiração de senha
- [ ] Histórico de login
- [ ] Cache de permissões para melhor performance

## 📝 Notas

- Todos os endpoints de API retornam JSON
- Sessões expiram após 7 dias de inatividade
- Senhas nunca são retornadas em respostas da API
- Grupos podem ter múltiplas permissões
- Usuários podem pertencer a múltiplos grupos
- Permissões são verificadas em cada requisição
- Sistema busca grupos do usuário para validar permissões

## ⚠️ Limitações Atuais

### CSRF Protection
A aplicação usa `SameSite: lax` em cookies, que oferece proteção básica contra CSRF para navegadores modernos. No entanto, não há tokens CSRF implementados.

**Recomendação para Produção:**
- Implementar CSRF tokens usando bibliotecas modernas como `csrf-csrf`
- Ou configurar `SameSite: strict` se apropriado para seu caso de uso
- Validar origem das requisições em endpoints críticos
