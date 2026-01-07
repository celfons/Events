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
- Utiliza a biblioteca `@whiskeysockets/baileys` para comunicação com WhatsApp Business
- Conexão persistente com autenticação via QR Code
- Formatação automática de números de telefone brasileiros
- Sistema de reconexão automática em caso de desconexão

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
LOCALE=pt-BR
```

- `ENABLE_WHATSAPP_NOTIFICATIONS`: Define se as notificações WhatsApp estão habilitadas (padrão: `false`)
- `LOCALE`: Define o formato de data/hora nas mensagens (padrão: `pt-BR`). Exemplos: `en-US`, `es-ES`, `fr-FR`

### Instalação

As dependências necessárias já foram instaladas:
- `agenda`: Gerenciamento de cron jobs
- `@whiskeysockets/baileys`: Cliente WhatsApp
- `qrcode-terminal`: Exibição do QR Code no terminal

### Primeiro Uso

1. Configure `ENABLE_WHATSAPP_NOTIFICATIONS=true` no arquivo `.env`
2. Inicie o servidor: `npm start`
3. Escaneie o QR Code exibido no terminal com seu WhatsApp Business
4. A conexão será mantida automaticamente para futuras execuções

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
- Gerenciar conexão com WhatsApp
- Autenticar via QR Code (primeira vez)
- Enviar mensagens formatadas
- Reconectar automaticamente em caso de falha
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

- Arquivos de autenticação WhatsApp são ignorados pelo Git (`.whatsapp-auth/`)
- Notificações podem ser desabilitadas via variável de ambiente
- Validação rigorosa de números de telefone (10-11 dígitos + código do país)
- Reconexão com exponential backoff (máximo 5 tentativas)
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

### QR Code não aparece
- Verifique se `ENABLE_WHATSAPP_NOTIFICATIONS=true` está definido
- Certifique-se de que o servidor está rodando
- Verifique os logs no console

### Mensagens não são enviadas
- Verifique se o WhatsApp está conectado (procure por "✅ WhatsApp connected successfully" nos logs)
- Confirme que os números de telefone estão no formato correto
- Verifique se há eventos ocorrendo na próxima hora

### Erro de conexão
- O serviço tentará reconectar automaticamente
- Se persistir, delete a pasta `.whatsapp-auth` e reconecte

## Monitoramento

O sistema gera logs detalhados:
- `⏰ Running event reminders job...` - Job iniciado
- `📅 Found X event(s) in the next hour` - Eventos encontrados
- `📤 Sending reminders for event: ...` - Iniciando envio
- `✅ Message sent to ...` - Mensagem enviada com sucesso
- `❌ Error sending message to ...` - Erro no envio

## Próximos Passos

Possíveis melhorias futuras:
1. Configurar intervalo do cron job via variável de ambiente
2. Adicionar templates de mensagem customizáveis
3. Implementar retry logic para mensagens falhadas
4. Adicionar dashboard de monitoramento
5. Suporte para múltiplos canais de notificação (SMS, Email)
