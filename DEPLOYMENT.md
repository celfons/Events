# Azure Web App Deployment

Este projeto está configurado para deploy no Azure Web App.

## Pré-requisitos

- Conta Azure ativa
- Azure CLI instalada
- MongoDB Atlas ou Azure Cosmos DB configurado

## Passos para Deploy

### 1. Criar o Web App no Azure

```bash
# Login no Azure
az login

# Criar um grupo de recursos
az group create --name events-rg --location brazilsouth

# Criar um App Service Plan
az appservice plan create --name events-plan --resource-group events-rg --sku B1 --is-linux

# Criar o Web App
az webapp create --resource-group events-rg --plan events-plan --name events-platform --runtime "NODE|18-lts"
```

### 2. Configurar MongoDB

Você pode usar MongoDB Atlas (recomendado) ou Azure Cosmos DB:

#### Opção A: MongoDB Atlas
1. Crie uma conta em https://www.mongodb.com/cloud/atlas
2. Crie um cluster gratuito
3. Obtenha a connection string
4. Configure o IP de acesso (0.0.0.0/0 para acesso de qualquer lugar)

#### Opção B: Azure Cosmos DB
```bash
# Criar Cosmos DB com API MongoDB
az cosmosdb create --name events-db --resource-group events-rg --kind MongoDB
```

### 3. Configurar Variáveis de Ambiente

```bash
# Definir a connection string do MongoDB
az webapp config appsettings set --resource-group events-rg --name events-platform --settings MONGODB_URI="sua-connection-string"

# Definir NODE_ENV
az webapp config appsettings set --resource-group events-rg --name events-platform --settings NODE_ENV="production"

# Porta (Azure configura automaticamente, mas pode especificar)
az webapp config appsettings set --resource-group events-rg --name events-platform --settings PORT="8080"
```

### 4. Deploy via Git

```bash
# Obter credenciais de deploy
az webapp deployment user set --user-name <username> --password <password>

# Obter a URL do Git
az webapp deployment source config-local-git --name events-platform --resource-group events-rg

# Adicionar remote
git remote add azure <deployment-git-url>

# Deploy
git push azure main
```

### 5. Deploy via GitHub Actions (Recomendado)

O arquivo `.github/workflows/azure-deploy.yml` já está configurado. 

1. No Azure Portal, vá até o Web App
2. Em "Deployment Center", selecione GitHub
3. Autorize e selecione o repositório
4. O Azure criará automaticamente um workflow de deploy

### 6. Verificar Deploy

```bash
# Ver logs
az webapp log tail --name events-platform --resource-group events-rg

# Abrir no navegador
az webapp browse --name events-platform --resource-group events-rg
```

## Configurações Importantes

### Startup Command
O Azure deve usar: `node src/server.js`

Para configurar:
```bash
az webapp config set --resource-group events-rg --name events-platform --startup-file "node src/server.js"
```

### Escala Automática
```bash
# Configurar escala automática (opcional)
az monitor autoscale create --resource-group events-rg --resource events-platform --resource-type Microsoft.Web/serverfarms --name autoscale --min-count 1 --max-count 3 --count 1
```

## Monitoramento

### Application Insights
```bash
# Habilitar Application Insights
az monitor app-insights component create --app events-insights --location brazilsouth --resource-group events-rg

# Conectar ao Web App
az webapp config appsettings set --resource-group events-rg --name events-platform --settings APPINSIGHTS_INSTRUMENTATIONKEY="<instrumentation-key>"
```

### Logs
```bash
# Habilitar logs
az webapp log config --name events-platform --resource-group events-rg --application-logging true --level information
```

## Troubleshooting

### Verificar Status
```bash
az webapp show --name events-platform --resource-group events-rg --query state
```

### Restart
```bash
az webapp restart --name events-platform --resource-group events-rg
```

### SSH no Container
```bash
az webapp ssh --name events-platform --resource-group events-rg
```

## URLs

- **Aplicação**: https://events-platform.azurewebsites.net
- **Health Check**: https://events-platform.azurewebsites.net/health
- **API**: https://events-platform.azurewebsites.net/api

## Custos Estimados

- **App Service Plan B1**: ~$13/mês
- **MongoDB Atlas (Free Tier)**: Grátis
- **Bandwidth**: Depende do uso

## Segurança

1. Configure CORS apropriadamente em produção
2. Use HTTPS (habilitado por padrão no Azure)
3. Configure IP restrictions se necessário
4. Rotacione credenciais regularmente
5. Use Azure Key Vault para secrets (recomendado para produção)
