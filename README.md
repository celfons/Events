# Events Platform 🎉

> Organize eventos e gerencie inscrições de forma simples e prática

Uma plataforma web completa para criar e gerenciar eventos, com controle de vagas e sistema de inscrições. Perfeita para workshops, meetups, palestras e qualquer evento que precise de organização.

## ✨ O que você pode fazer

- 📅 **Criar e gerenciar eventos** - Configure título, descrição, data e limite de vagas
- 👥 **Controlar inscrições** - Acompanhe quem se inscreveu e gerencie participantes
- 🔒 **Sistema de autenticação** - Login seguro para organizadores
- 📱 **Interface responsiva** - Funciona perfeitamente em qualquer dispositivo
- 🔔 **Notificações WhatsApp** *(opcional)* - Envie confirmações automáticas

## 🚀 Começando em 5 minutos

### Requisitos
- Node.js 14 ou superior
- MongoDB (local ou Atlas)

### Instalação

```bash
# 1. Clone o projeto
git clone https://github.com/celfons/Events.git
cd Events

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env
```

### Configuração

Edite o arquivo `.env` e ajuste as variáveis:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/events
JWT_SECRET=CHANGE_THIS_SECRET
```

> 💡 **Dica:** Gere uma chave JWT segura com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Criar o primeiro administrador

```bash
export SUPERUSER_USERNAME="admin"
export SUPERUSER_EMAIL="admin@example.com"
export SUPERUSER_PASSWORD="YOUR_SECURE_PASSWORD"
npm run create-superuser
```

### Iniciar a aplicação

```bash
npm start
```

Pronto! Acesse:
- **Página inicial:** http://localhost:3000
- **Painel admin:** http://localhost:3000/admin
- **API Docs:** http://localhost:3000/api-docs

## 📖 Como usar

### Para visitantes
1. Acesse a página inicial e veja os próximos eventos
2. Clique em um evento para ver detalhes
3. Preencha o formulário de inscrição

### Para organizadores
1. Faça login no painel admin
2. Crie um novo evento com título, descrição, data e vagas
3. Acompanhe as inscrições e gerencie participantes
4. Edite ou exclua seus eventos quando necessário

## 🔌 API REST

A plataforma oferece uma API completa documentada com Swagger em `/api-docs`.

**Principais endpoints:**

```
POST   /api/auth/register       # Criar conta
POST   /api/auth/login          # Fazer login

GET    /api/events              # Listar eventos (público)
POST   /api/events              # Criar evento (requer autenticação)
PUT    /api/events/:id          # Atualizar evento (requer autenticação)
DELETE /api/events/:id          # Excluir evento (requer autenticação)

POST   /api/registrations       # Inscrever-se em evento
POST   /api/registrations/:id/cancel  # Cancelar inscrição
```

> 📝 **Nota:** Endpoints que modificam eventos exigem token JWT. Use `/api-docs` para testar interativamente.

## 🧪 Testes

```bash
npm test                    # Rodar todos os testes
npm run test:coverage       # Ver cobertura de código
npm test -- public/js/__tests__  # Apenas testes de UI
```

O projeto possui testes automatizados para backend (use cases, entidades, validações) e frontend (interface, contratos de API, DOM). Veja detalhes em [public/js/__tests__/README.md](public/js/__tests__/README.md).

## 🚢 Deploy

O projeto está configurado com GitHub Actions para deploy automático no Azure Web App. Cada push na branch `main` executa testes, build e deploy automaticamente.

Para deploy manual, utilize o Azure CLI ou o portal Azure seguindo a [documentação oficial](https://learn.microsoft.com/azure/app-service/quickstart-nodejs).

## 📱 WhatsApp Business *(Opcional)*

Envie notificações automáticas via WhatsApp para confirmações e lembretes.

### Configuração

1. Crie uma conta no [Meta Business Manager](https://business.facebook.com)
2. Configure o WhatsApp Business API e obtenha:
   - Phone Number ID
   - Access Token
3. Adicione ao arquivo `.env`:

```env
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
WHATSAPP_ACCESS_TOKEN=seu-access-token
```

4. Teste com: `node whatsapp-example.js`

**Mensagens enviadas:**
- ✅ Confirmação de inscrição
- ❌ Confirmação de cancelamento
- 🔔 Lembretes de evento

> 📚 [Documentação WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)

## 🛡️ Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT
- Proteção contra injeção de código
- Rate limiting
- Headers de segurança HTTP

## 🛠️ Tecnologias

**Backend:** Node.js, Express, MongoDB, JWT  
**Frontend:** Bootstrap 5, JavaScript vanilla  
**Arquitetura:** Clean Architecture  
**Testes:** Jest, Supertest

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas mudanças: `git commit -m 'Adiciona nova feature'`
4. Push para a branch: `git push origin minha-feature`
5. Abra um Pull Request

## 📄 Licença

ISC License

---

Feito com ❤️ para facilitar a organização de eventos
