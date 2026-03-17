# Events Platform 

Uma plataforma simples e prática para gerenciar eventos e inscrições, desenvolvida com Node.js e MongoDB.

## O que é?

Esta é uma aplicação web completa que permite criar, gerenciar e visualizar eventos, além de permitir que pessoas se inscrevam neles. É perfeita para organizar workshops, meetups, palestras ou qualquer tipo de evento que precise de controle de vagas.

## Principais Recursos

**Para todos:**
- 📅 Ver a lista de próximos eventos
- 📝 Se inscrever em eventos com vagas disponíveis
- ❌ Cancelar inscrições quando necessário

**Para usuários autenticados:**
- ➕ Criar seus próprios eventos
- ✏️ Editar eventos que você criou
- 🗑️ Excluir eventos que você criou
- 👥 Ver quem se inscreveu nos seus eventos

**Para superusuários:**
- 👤 Gerenciar todos os usuários da plataforma

## Tecnologias Utilizadas

- **Node.js** e **Express** - Backend
- **MongoDB** - Banco de dados
- **React 18** - Interface de usuário moderna
- **Bootstrap 5** - Interface responsiva
- **JWT** - Autenticação segura

## Como começar?

### Você vai precisar de:
- Node.js 14 ou superior
- MongoDB (local ou MongoDB Atlas)

### Passo a passo:

1. **Clone o repositório**
```bash
git clone https://github.com/celfons/Events.git
cd Events
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/events
NODE_ENV=development
JWT_SECRET=sua-chave-secreta-aqui

# WhatsApp Business API (opcional)
WHATSAPP_ENABLED=false
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
```

💡 **Dica**: Gere uma chave JWT segura com:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Crie o primeiro usuário administrador**

Configure as credenciais:
```bash
export SUPERUSER_USERNAME="admin"
export SUPERUSER_EMAIL="admin@example.com"
export SUPERUSER_PASSWORD="SuaSenhaForte123!"
```

Crie o superusuário:
```bash
npm run create-superuser
```

5. **Compile a interface React** (primeira vez e após mudanças no código)
```bash
npm run build:react
```

6. **Inicie a aplicação**
```bash
npm start
```

7. **Acesse no navegador**
- Página inicial: http://localhost:3000
- Painel admin: http://localhost:3000/admin
- Documentação da API: http://localhost:3000/api-docs

## Como usar?

### Para visitantes:
1. Acesse a página inicial para ver os próximos eventos
2. Clique em um evento para ver os detalhes
3. Preencha o formulário para se inscrever

### Para criar eventos:
1. Faça login no painel administrativo
2. Clique em "Novo Evento"
3. Preencha as informações (título, descrição, data, vagas)
4. Pronto! Seu evento está no ar

### Para gerenciar eventos:
1. No painel admin, você verá todos os seus eventos
2. Clique em "Editar" para alterar informações
3. Clique em "Participantes" para ver quem se inscreveu
4. Use "Excluir" para remover eventos se necessário

## API REST

A aplicação possui uma API completa documentada com Swagger. Acesse `/api-docs` para ver todos os endpoints disponíveis e testá-los interativamente.

💡 **Importante**: Endpoints que criam, editam ou excluem eventos requerem autenticação JWT. Faça login primeiro para obter o token.

### Principais endpoints:

**Autenticação:**
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Fazer login

**Eventos:**
- `GET /api/events` - Listar eventos (público)
- `POST /api/events` - Criar evento (autenticado)
- `PUT /api/events/:id` - Atualizar evento (autenticado)
- `DELETE /api/events/:id` - Excluir evento (autenticado)

**Inscrições:**
- `POST /api/registrations` - Inscrever-se em evento
- `POST /api/registrations/:id/cancel` - Cancelar inscrição

## Testes

Execute os testes para garantir que tudo está funcionando:

```bash
# Rodar todos os testes
npm test

# Rodar apenas testes de UI (frontend)
npm test -- public/js/__tests__

# Rodar testes excluindo testes de integração
npm test -- --testPathIgnorePatterns="integration"

# Ver cobertura de código
npm run test:coverage
```

O projeto possui uma suite completa de testes automatizados cobrindo todas as funcionalidades principais:

- **Testes de Backend**: Use cases, entidades, validações, middleware
- **Testes de UI (Frontend)**: Interface do usuário, contratos de API, manipulação DOM
  - `auth-utils.js` - Gerenciamento de autenticação
  - `index.js` - Página de listagem de eventos
  - `event-details.js` - Página de detalhes e inscrição
  - `admin.js` - Painel administrativo

Para mais detalhes sobre os testes de UI, veja [public/js/__tests__/README.md](public/js/__tests__/README.md).

## Deploy

A aplicação está configurada para deploy automático no Azure Web App. Sempre que você fizer push para a branch `main`, o GitHub Actions vai:

1. Rodar todos os testes
2. Fazer o build da aplicação
3. Fazer deploy automático no Azure

Para fazer deploy manual, você pode usar o Azure CLI ou o portal do Azure seguindo a documentação oficial do Azure Web App para Node.js.

## Segurança

A aplicação implementa várias medidas de segurança:
- Senhas criptografadas com bcrypt
- Autenticação JWT
- Proteção contra injeção de código
- Sanitização de dados
- Rate limiting para prevenir ataques
- Headers de segurança HTTP

## Integração com WhatsApp Business

A aplicação possui integração nativa com a API do WhatsApp Business da Meta para enviar notificações automáticas aos participantes.

### Como configurar

1. **Crie uma conta no Meta Business Manager**
   - Acesse: https://business.facebook.com
   - Crie ou selecione sua empresa

2. **Configure o WhatsApp Business API**
   - No Meta Business Manager, acesse "WhatsApp Manager"
   - Siga o processo de configuração para obter:
     - Phone Number ID (ID do número de telefone)
     - Access Token (Token de acesso)

3. **Configure as variáveis de ambiente**

Edite seu arquivo `.env`:
```env
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
WHATSAPP_ACCESS_TOKEN=seu-access-token
```

4. **Reinicie a aplicação**

### Funcionalidades

Quando ativado, o sistema envia automaticamente:
- ✅ **Confirmação de inscrição**: Enviada quando alguém se inscreve em um evento
- ❌ **Confirmação de cancelamento**: Enviada quando alguém cancela a inscrição
- 🔔 **Lembretes de evento**: Método disponível para enviar lembretes (pode ser integrado com agendadores)

### Características técnicas

- **Clean Architecture**: Interface `MessagingService` no domínio, implementação `WhatsAppService` na infraestrutura
- **Graceful degradation**: Se desabilitado ou com credenciais inválidas, a aplicação continua funcionando normalmente
- **Async/Non-blocking**: Envio de mensagens não bloqueia o fluxo principal de registro
- **Logging estruturado**: Todas as tentativas de envio são registradas
- **Formatação automática**: Números de telefone são formatados automaticamente para o padrão E.164
- **Mensagens em português**: Templates otimizados para o público brasileiro

### Testando a integração

Após configurar as credenciais, você pode testar a integração usando o script de exemplo:

```bash
node whatsapp-example.js
```

Este script demonstra como enviar os três tipos de mensagens disponíveis.

### Documentação oficial

Para mais informações sobre a API do WhatsApp Business:
- [Documentação Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Guia de início rápido](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)

## Importar no Xano

Você pode exportar o schema e os dados desta plataforma para um **workspace do Xano** (plataforma no-code de backend).

### Como exportar e importar

1. **Gere o arquivo de exportação** (apenas schema):
   ```bash
   cp xano/workspace.json xano/workspace-export.json
   ```

   Ou inclua os dados do banco de dados:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/events node xano-export.js
   ```

2. **Importe no Xano**:
   - Acesse [https://app.xano.com](https://app.xano.com)
   - Vá em **Settings → Import → Import Workspace**
   - Selecione o arquivo JSON gerado
   - Clique em **Import**

O workspace criado incluirá todas as tabelas (`user`, `event`, `participant`) e os grupos de API (Auth, Events, Registrations, Users) prontos para uso.

Para instruções detalhadas, consulte [xano/README.md](xano/README.md).

## Quer contribuir?

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b minha-feature`)
3. Faça commit das suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin minha-feature`)
5. Abra um Pull Request

## Refatoração React

A interface do usuário foi refatorada de JavaScript vanilla para React, mantendo toda a funcionalidade existente e os contratos de API. 

### Características da refatoração:
- ✅ **Componentes React** modernos e reutilizáveis
- ✅ **Custom Hooks** para lógica compartilhada (useAuth, useToast)
- ✅ **Testes** com Jest e React Testing Library
- ✅ **Webpack + Babel** para transpilação e bundling
- ✅ **Mesmo comportamento** - nenhuma mudança na funcionalidade

### Arquivos importantes:
- `src-react/` - Código-fonte React
- `src-react/README.md` - Documentação detalhada da refatoração
- `webpack.config.js` - Configuração do build
- `.babelrc` - Configuração do Babel

Para mais detalhes sobre a refatoração React, consulte [src-react/README.md](src-react/README.md).

## Licença

ISC License

---

Feito com ❤️ para facilitar a organização de eventos
