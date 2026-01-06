# Events Platform

Plataforma de gerenciamento de eventos desenvolvida com **Node.js**, **MongoDB** e **Clean Architecture**, seguindo princípios **SOLID** e **Clean Code**.

## 🚀 Funcionalidades

### 1. Autenticação e Autorização
- **Sistema de Login/Registro**: Autenticação JWT para usuários
- **Controle de Acesso**: Permissões granulares baseadas em roles (user/superuser)
- **Proteção de Eventos**: Usuários só podem editar/excluir seus próprios eventos
- **Gestão de Usuários**: CRUD completo restrito a superusers
- 📖 **[Documentação Completa de Autenticação](./AUTHENTICATION.md)**

### 2. Listagem de Eventos (Home Page)
- Visualização dos próximos eventos (apenas eventos futuros)
- Paginação com até 5 eventos por página
- Informações de data, horário e número de vagas
- Interface responsiva com Bootstrap 5
- **Acesso público** - todos os eventos de todos os usuários são exibidos

### 3. Detalhes do Evento
- Visualização completa dos detalhes do evento
- Formulário de inscrição integrado
- Indicação visual de vagas disponíveis

### 4. Sistema de Inscrições
- **Inscrição**: Formulário para cadastro em eventos
- **Validação**: Verificação de vagas disponíveis e inscrições duplicadas
- **Cancelamento**: Botão para desistir da inscrição
- **Persistência**: Dados salvos no MongoDB

### 5. Painel Administrativo (Admin Page)
- **Gerenciamento de Eventos**: CRUD completo de eventos (requer autenticação)
- **Listagem Paginada**: Visualização de todos os eventos (10 por página)
- **Edição de Eventos**: Modal para atualizar informações (apenas eventos próprios)
- **Exclusão de Eventos**: Remoção de eventos com confirmação (apenas eventos próprios)
- **Visualização de Participantes**: Lista paginada (10 por página) dos inscritos em cada evento

## 🏗️ Arquitetura

O projeto segue **Clean Architecture** com separação clara de responsabilidades:

```
src/
├── domain/
│   ├── entities/           # Entidades de domínio (Event, Registration, User)
│   └── repositories/       # Interfaces de repositório
├── application/
│   └── use-cases/          # Casos de uso (lógica de negócio)
├── infrastructure/
│   ├── database/           # Implementações MongoDB
│   └── web/
│       ├── controllers/    # Controladores HTTP
│       ├── middleware/     # Middleware de autenticação/autorização
│       └── routes/         # Definição de rotas
├── app.js                  # Configuração da aplicação
└── server.js               # Ponto de entrada
```

### Princípios SOLID Aplicados

- **S**ingle Responsibility: Cada classe tem uma única responsabilidade
- **O**pen/Closed: Extensível através de interfaces
- **L**iskov Substitution: Implementações podem substituir interfaces
- **I**nterface Segregation: Interfaces específicas por necessidade
- **D**ependency Inversion: Dependências invertidas via injeção

## 🛠️ Tecnologias

### Backend
- **Node.js**: Runtime JavaScript
- **Express**: Framework web
- **MongoDB**: Banco de dados NoSQL
- **Mongoose**: ODM para MongoDB
- **JWT**: Autenticação via JSON Web Tokens
- **bcryptjs**: Hashing de senhas
- **Passport**: Middleware de autenticação
- **dotenv**: Gerenciamento de variáveis de ambiente
- **CORS**: Controle de acesso

### Frontend
- **HTML5**: Estrutura
- **Bootstrap 5**: Framework CSS responsivo
- **JavaScript (Vanilla)**: Lógica do cliente
- **Bootstrap Icons**: Ícones

## 📦 Instalação

### Pré-requisitos
- Node.js 14+ instalado
- MongoDB instalado e rodando (ou MongoDB Atlas)

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/celfons/Events.git
cd Events
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/events
NODE_ENV=development
JWT_SECRET=your-strong-random-secret-key  # Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Crie o superusuário inicial**

Configure as credenciais do superusuário:
```bash
export SUPERUSER_USERNAME="admin"
export SUPERUSER_EMAIL="admin@example.com"
export SUPERUSER_PASSWORD="YourSecurePassword123!"
```

Execute o script:
```bash
npm run create-superuser
```

⚠️ **Importante**: Use uma senha forte e segura!

5. **Inicie o servidor**
```bash
npm start
```

6. **Acesse a aplicação**
- Página Principal: http://localhost:3000
- Painel Admin: http://localhost:3000/admin
- Health Check: http://localhost:3000/health
- **Documentação da API (Swagger)**: http://localhost:3000/api-docs

## 📚 Documentação da API

A documentação interativa da API está disponível através do Swagger UI. Acesse http://localhost:3000/api-docs para:

- Visualizar todos os endpoints disponíveis
- Entender os parâmetros de entrada e saída
- Testar as APIs diretamente pelo navegador
- Ver exemplos de requisições e respostas

### Tecnologias de Documentação
- **Swagger UI**: Interface interativa para documentação
- **OpenAPI 3.0**: Especificação padrão para APIs REST

## 🔌 API Endpoints

### Autenticação

#### Registrar novo usuário
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Para mais detalhes sobre autenticação, consulte [AUTHENTICATION.md](./AUTHENTICATION.md)

### Eventos

#### Listar todos os eventos (público)
```
GET /api/events
```

#### Obter detalhes de um evento
```
GET /api/events/:id
```

#### Criar novo evento (requer autenticação)
```
POST /api/events
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Workshop de Node.js",
  "description": "Aprenda Node.js do zero",
  "dateTime": "2024-12-31T14:00:00",
  "totalSlots": 50
}
```

#### Atualizar evento (requer autenticação, apenas o dono)
```
PUT /api/events/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Workshop de Node.js Avançado",
  "description": "Aprenda Node.js do básico ao avançado",
  "dateTime": "2024-12-31T14:00:00",
  "totalSlots": 100
}
```

#### Excluir evento (requer autenticação, apenas o dono)
```
DELETE /api/events/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Obter participantes de um evento
```
GET /api/events/:id/participants
```

### Gestão de Usuários (apenas superusuário)

#### Listar todos os usuários
```
GET /api/users
Authorization: Bearer SUPERUSER_JWT_TOKEN
```

#### Atualizar usuário
```
PUT /api/users/:id
Authorization: Bearer SUPERUSER_JWT_TOKEN
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com",
  "role": "superuser"
}
```

#### Excluir usuário
```
DELETE /api/users/:id
Authorization: Bearer SUPERUSER_JWT_TOKEN
```

### Inscrições

#### Criar inscrição
```
POST /api/registrations
Content-Type: application/json

{
  "eventId": "event_id_here",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321"
}
```

#### Cancelar inscrição
```
POST /api/registrations/:id/cancel
```

## 🎨 Interface do Usuário

### Página Principal (/)
- Lista de eventos futuros em cards responsivos
- Paginação com até 5 eventos por página
- Link para painel administrativo
- Navegação intuitiva

### Painel Administrativo (/admin)
- Tabela paginada com todos os eventos
- **Requer autenticação**: Login necessário para gerenciar eventos
- Botão para criar novos eventos (vinculados ao usuário logado)
- Modal para visualizar e editar detalhes de eventos (apenas eventos próprios)
- Modal para visualizar participantes inscritos
- Funcionalidade de exclusão de eventos (apenas eventos próprios)

### Página de Detalhes (/event/:id)
- Informações completas do evento
- Formulário de inscrição lateral
- Feedback visual de status

### Design Responsivo
- Mobile-first approach
- Breakpoints para tablet e desktop
- Componentes Bootstrap otimizados

## 🧪 Testes

Este projeto possui cobertura completa de testes unitários para validar as regras de negócio.

### Executar Testes
```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

### Cobertura de Testes
- **Entidades de Domínio**: 100% de cobertura (Event, Registration, User)
- **Casos de Uso**: 100% de cobertura (incluindo autenticação)
- **Total de Testes**: 113+ testes passando
- **Autenticação**: Login, registro, validações completas

Para mais detalhes sobre os testes, consulte [UNIT_TESTS.md](./UNIT_TESTS.md).

## 🚢 Deploy no Azure

Consulte o arquivo [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções detalhadas de deploy no Azure Web App.

### Resumo Rápido
```bash
# Login no Azure
az login

# Criar recursos
az group create --name events-rg --location brazilsouth
az appservice plan create --name events-plan --resource-group events-rg --sku B1 --is-linux
az webapp create --resource-group events-rg --plan events-plan --name events-platform --runtime "NODE|18-lts"

# Configurar variáveis
az webapp config appsettings set --resource-group events-rg --name events-platform --settings MONGODB_URI="<your-connection-string>"

# Deploy
git push azure main
```

## 🔄 CI/CD

### GitHub Actions

O projeto utiliza GitHub Actions para automação de build, testes e deploy:

#### Pull Request Checks
- **Workflow**: `.github/workflows/pr-check.yml`
- **Trigger**: Pull requests para a branch `main`
- **Validações**:
  - Instalação de dependências
  - Execução de build (se disponível)
  - Execução de todos os testes unitários (113+ testes)
- **Requisito**: Todos os checks devem passar antes do merge para `main`

#### Deploy Automático
- **Workflow**: `.github/workflows/main_celfons.yml`
- **Trigger**: Push para a branch `main`
- **Etapas**:
  - Build da aplicação
  - Execução de testes
  - Deploy automático no Azure Web App

## 📝 Estrutura de Dados

### Event Schema
```javascript
{
  title: String,
  description: String,
  dateTime: Date,
  totalSlots: Number,
  availableSlots: Number,
  userId: ObjectId,  // Referência ao usuário criador
  createdAt: Date
}
```

### User Schema
```javascript
{
  username: String,
  email: String,
  password: String,  // Hashed com bcrypt
  role: String,      // 'user' ou 'superuser'
  createdAt: Date
}
```

### Registration Schema
```javascript
{
  eventId: ObjectId,
  name: String,
  email: String,
  phone: String,
  registeredAt: Date,
  status: String // 'active' | 'cancelled'
}
```

## 🔒 Segurança

- **Autenticação JWT**: Tokens seguros para autenticação stateless
- **Hashing de Senhas**: bcrypt com salt para armazenamento seguro
- **Autorização Granular**: Controle de acesso baseado em roles e ownership
- **Validação de entrada de dados**: Validação em todas as camadas
- **Sanitização de HTML**: Prevenção de XSS
- **CORS configurado**: Controle de origens permitidas
- **Variáveis de ambiente**: Secrets armazenados com segurança
- **Mongoose**: Prevenção de NoSQL injection
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Helmet**: Headers de segurança HTTP

Para mais detalhes sobre segurança de autenticação, consulte [AUTHENTICATION.md](./AUTHENTICATION.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

ISC License

## 👤 Autor

Desenvolvido seguindo as melhores práticas de desenvolvimento fullstack JavaScript.

## 🙏 Agradecimentos

- Bootstrap pela biblioteca CSS
- MongoDB pela documentação
- Comunidade Node.js
