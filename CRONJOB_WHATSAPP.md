# Cron Job e Notificações WhatsApp

## Visão Geral

Este sistema implementa um cron job que executa a cada hora para enviar lembretes via WhatsApp aos participantes de eventos que ocorrerão na próxima hora.

## Funcionalidades

### 1. Cron Job com Agenda
- Executa automaticamente a cada hora
- Consulta eventos que ocorrerão na próxima hora
- Filtra apenas eventos ativos com participantes confirmados
- Utiliza MongoDB para armazenar o estado dos jobs

### 2. Integração WhatsApp
- Utiliza a **WhatsApp Business Cloud API** (API oficial do Facebook)
- Autenticação via **token de acesso** (Access Token)
- Formatação automática de números de telefone brasileiros
- Comunicação via HTTP REST API

### 3. Sistema de Notificações
- Mensagens personalizadas com informações do evento:
  - Título do evento
  - Descrição
  - Data e horário formatados
  - Local do evento
- Envio apenas para participantes com status "active"
- Delay entre mensagens para evitar rate limiting

## Configuração

### Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
ENABLE_WHATSAPP_NOTIFICATIONS=true
WHATSAPP_ACCESS_TOKEN=your-whatsapp-business-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
LOCALE=pt-BR
```

- `ENABLE_WHATSAPP_NOTIFICATIONS`: Define se as notificações WhatsApp estão habilitadas (padrão: `false`)
- `WHATSAPP_ACCESS_TOKEN`: Token de acesso da WhatsApp Business Cloud API
- `WHATSAPP_PHONE_NUMBER_ID`: ID do número de telefone do WhatsApp Business
- `LOCALE`: Define o formato de data/hora nas mensagens (padrão: `pt-BR`). Exemplos: `en-US`, `es-ES`, `fr-FR`

### Instalação

A dependência necessária já foi instalada:
- `agenda`: Gerenciamento de cron jobs

### Configuração da WhatsApp Business Cloud API

1. **Criar uma conta no Facebook for Developers**:
   - Acesse [developers.facebook.com](https://developers.facebook.com)
   - Crie um aplicativo de negócios

2. **Configurar o WhatsApp Business API**:
   - Adicione o produto "WhatsApp" ao seu aplicativo
   - Configure um número de telefone de teste ou conecte seu número de negócios

3. **Obter credenciais**:
   - **Access Token**: Encontre em "WhatsApp" > "Getting Started" ou "API Setup"
   - **Phone Number ID**: Também disponível na seção "API Setup"

4. **Configurar webhook (opcional)**:
   - Para receber respostas e status de entrega das mensagens

### Primeiro Uso

1. Configure as credenciais no arquivo `.env`:
```env
ENABLE_WHATSAPP_NOTIFICATIONS=true
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

2. Inicie o servidor: `npm start`

3. O sistema validará o token automaticamente na inicialização

4. O cron job começará a executar a cada hora automaticamente

## Arquitetura

### Use Case: GetUpcomingEventsUseCase
**Localização**: `src/application/use-cases/GetUpcomingEventsUseCase.js`

Responsável por:
- Buscar todos os eventos ativos
- Filtrar eventos que ocorrem nas próximas 60 minutos
- Retornar apenas participantes com status "active"

### Service: WhatsAppService
**Localização**: `src/infrastructure/services/WhatsAppService.js`

Responsabilidades:
- Integrar com WhatsApp Business Cloud API
- Autenticar via token de acesso
- Enviar mensagens formatadas via HTTP POST
- Validar token na inicialização
- Formatar números de telefone (adiciona +55 para números brasileiros)

### Service: CronJobService
**Localização**: `src/infrastructure/services/CronJobService.js`

Responsabilidades:
- Configurar e gerenciar jobs do Agenda
- Executar job "send-event-reminders" a cada hora
- Coordenar GetUpcomingEventsUseCase e WhatsAppService
- Tratamento de erros e logging

## Fluxo de Execução

```
┌─────────────────────────────────────────────┐
│  Cron Job (Executa a cada hora)            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  GetUpcomingEventsUseCase                   │
│  - Busca eventos nas próximas 60 minutos   │
│  - Filtra eventos ativos                    │
│  - Retorna participantes ativos             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Para cada evento encontrado                │
│  ┌─────────────────────────────────────┐   │
│  │ Formata mensagem com detalhes       │   │
│  └─────────────────────────────────────┘   │
│                 │                            │
│                 ▼                            │
│  ┌─────────────────────────────────────┐   │
│  │ Para cada participante ativo        │   │
│  │ - Formata número de telefone        │   │
│  │ - Envia mensagem via WhatsApp       │   │
│  │ - Delay de 1 segundo entre envios   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Exemplo de Mensagem

```
🎉 *Lembrete de Evento*

📌 *Workshop de Node.js*
📝 Aprenda a criar APIs RESTful com Node.js e MongoDB
📅 Data: 07/01/2026
⏰ Horário: 14:30
📍 Local: Auditório Principal

Te esperamos lá! 😊
```

## Segurança

- Token de acesso é armazenado de forma segura em variável de ambiente
- Notificações podem ser desabilitadas via variável de ambiente
- Validação rigorosa de números de telefone (10-11 dígitos + código do país)
- Comunicação HTTPS com a API oficial do WhatsApp
- Tratamento de erros para evitar crash do servidor
- Logs detalhados para auditoria

## Testes

Os testes para o `GetUpcomingEventsUseCase` estão em:
`src/application/use-cases/__tests__/GetUpcomingEventsUseCase.test.js`

Execute com:
```bash
npm test GetUpcomingEventsUseCase.test.js
```

## Desabilitando Notificações

Para desabilitar as notificações WhatsApp (útil em desenvolvimento):

```env
ENABLE_WHATSAPP_NOTIFICATIONS=false
```

O cron job continuará executando, mas as mensagens não serão enviadas.

## Troubleshooting

### Token inválido
- Verifique se o `WHATSAPP_ACCESS_TOKEN` está correto
- Certifique-se de que o token não expirou
- Gere um novo token no Facebook for Developers se necessário

### Mensagens não são enviadas
- Verifique se o token está válido (procure por "✅ WhatsApp Business API token validated successfully" nos logs)
- Confirme que o `WHATSAPP_PHONE_NUMBER_ID` está correto
- Verifique se os números de telefone estão no formato correto
- Confirme que há eventos ocorrendo na próxima hora

### Erro de validação do número
- Certifique-se de que o número tem 10-11 dígitos (formato brasileiro)
- O sistema adiciona automaticamente o código do país (+55) se não estiver presente

### Limites de API
- A WhatsApp Business API tem limites de taxa
- O sistema aguarda 1 segundo entre cada envio para respeitar os limites
- Consulte a documentação oficial para detalhes sobre limites

## Monitoramento

O sistema gera logs detalhados:
- `⏰ Running event reminders job...` - Job iniciado
- `📅 Found X event(s) in the next hour` - Eventos encontrados
- `📤 Sending reminders for event: ...` - Iniciando envio
- `✅ Message sent to ... (ID: ...)` - Mensagem enviada com sucesso (com ID de rastreamento)
- `❌ Error sending message to ...` - Erro no envio

## Recursos Adicionais

### Documentação Oficial
- [WhatsApp Business Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Guia de Início Rápido](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Referência da API de Mensagens](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)

### Limites e Quotas
- Consulte a [documentação de limites](https://developers.facebook.com/docs/whatsapp/messaging-limits) para informações sobre limites de taxa e quotas de mensagens

## Próximos Passos

Possíveis melhorias futuras:
1. Configurar intervalo do cron job via variável de ambiente
2. Adicionar templates de mensagem customizáveis (templates aprovados pelo WhatsApp)
3. Implementar retry logic para mensagens falhadas
4. Adicionar webhook para receber status de entrega
5. Suporte para mensagens com mídia (imagens, documentos)
6. Adicionar dashboard de monitoramento
7. Suporte para múltiplos canais de notificação (SMS, Email)
