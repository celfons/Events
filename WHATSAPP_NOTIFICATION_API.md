# WhatsApp Event Notification API

## Visão Geral

Esta API permite enviar lembretes automáticos via WhatsApp para os participantes de eventos que estão prestes a começar. A implementação segue a Clean Architecture existente no projeto e utiliza a API do Twilio para integração com WhatsApp.

## Arquitetura

A feature foi implementada seguindo os princípios SOLID e Clean Architecture:

### Camadas

1. **Domain Layer**
   - `WhatsAppService.js`: Interface abstrata para serviços de mensagens
   - `EventRepository.findUpcomingEvents()`: Novo método para buscar eventos futuros

2. **Application Layer**
   - `SendEventRemindersUseCase.js`: Lógica de negócio para envio de lembretes

3. **Infrastructure Layer**
   - `TwilioWhatsAppService.js`: Implementação concreta usando Twilio
   - `NotificationController.js`: Controlador HTTP para a API
   - `notificationRoutes.js`: Definição de rotas

## Endpoint

### Enviar Lembretes de Eventos

Envia mensagens de lembrete via WhatsApp para todos os participantes de eventos que estão prestes a começar.

**URL:** `POST /api/notifications/send-event-reminders`

**Query Parameters:**
- `hoursAhead` (opcional): Número de horas à frente para buscar eventos. Padrão: 24 horas.

**Exemplo de Requisição:**

```bash
# Buscar eventos nas próximas 24 horas (padrão)
curl -X POST http://localhost:3000/api/notifications/send-event-reminders

# Buscar eventos nas próximas 2 horas
curl -X POST "http://localhost:3000/api/notifications/send-event-reminders?hoursAhead=2"

# Buscar eventos nas próximas 48 horas
curl -X POST "http://localhost:3000/api/notifications/send-event-reminders?hoursAhead=48"
```

**Resposta de Sucesso (200 OK):**

```json
{
  "success": true,
  "message": "Reminders sent for 2 event(s)",
  "data": {
    "eventsProcessed": 2,
    "messagesSent": 15,
    "messagesFailed": 0,
    "details": [
      {
        "eventId": "60d5ec49f1a2c8b1f8c4e1a1",
        "eventTitle": "Workshop de Node.js",
        "participantsCount": 10,
        "messagesSent": 10,
        "messagesFailed": 0
      },
      {
        "eventId": "60d5ec49f1a2c8b1f8c4e1a2",
        "eventTitle": "Palestra sobre Clean Architecture",
        "participantsCount": 5,
        "messagesSent": 5,
        "messagesFailed": 0
      }
    ]
  }
}
```

**Resposta quando não há eventos (200 OK):**

```json
{
  "success": true,
  "message": "No upcoming events found",
  "data": {
    "eventsProcessed": 0,
    "messagesSent": 0,
    "messagesFailed": 0
  }
}
```

**Resposta de Erro (400 Bad Request):**

```json
{
  "error": "Database error"
}
```

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```env
# Twilio WhatsApp Configuration (opcional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Modo Mock (Desenvolvimento)

Se as credenciais do Twilio não forem fornecidas, o sistema opera em modo mock, registrando as mensagens no console ao invés de enviá-las:

```
[WhatsApp Mock] Would send to: +5511987654321 Message: Olá João! 👋...
```

Isso permite testar a funcionalidade sem configurar o Twilio.

### Configuração do Twilio

1. Crie uma conta no [Twilio](https://www.twilio.com/)
2. Configure o WhatsApp Business API
3. Obtenha suas credenciais:
   - Account SID
   - Auth Token
   - WhatsApp Number (formato: +14155238886)
4. Configure as variáveis de ambiente

## Formato da Mensagem

As mensagens enviadas seguem o seguinte formato:

```
Olá [Nome do Participante]! 👋

Lembrete: O evento "[Título do Evento]" está chegando!

📅 Data: 31/12/2024
⏰ Horário: 14:30

Nos vemos lá! 🎉
```

## Lógica de Busca de Eventos

O sistema busca eventos em uma janela de tempo específica:

- **Início da janela**: `now + hoursAhead` horas
- **Fim da janela**: `início da janela + 1 hora`

Por exemplo, com `hoursAhead=24`:
- Se agora são 10:00 do dia 1/01
- Busca eventos entre 10:00 do dia 2/01 e 11:00 do dia 2/01

Isso permite enviar lembretes de forma programada, por exemplo:
- `hoursAhead=24`: Lembrete 24h antes
- `hoursAhead=2`: Lembrete 2h antes
- `hoursAhead=1`: Lembrete 1h antes

## Agendamento (Recomendado)

Para envio automático de lembretes, configure um cron job ou use um serviço de agendamento:

### Exemplo com cron (Linux/Mac):

```bash
# Enviar lembretes 24h antes, todos os dias às 9:00
0 9 * * * curl -X POST http://localhost:3000/api/notifications/send-event-reminders?hoursAhead=24

# Enviar lembretes 2h antes, a cada 2 horas
0 */2 * * * curl -X POST http://localhost:3000/api/notifications/send-event-reminders?hoursAhead=2
```

### Exemplo com Azure Logic Apps ou AWS Lambda:

Configure um trigger de timer que chama o endpoint periodicamente.

## Testes

A funcionalidade inclui 8 testes unitários cobrindo:

- Envio de lembretes para múltiplos participantes
- Eventos sem participantes
- Múltiplos eventos
- Tratamento de falhas
- Validação de parâmetros
- Formato de mensagens

Execute os testes:

```bash
npm test
```

## Dependências Adicionadas

- `twilio`: ^5.3.5 - SDK oficial do Twilio para Node.js

## Casos de Uso

1. **Lembretes Automáticos**: Configure cron jobs para enviar lembretes em diferentes intervalos (24h, 2h, 1h antes)

2. **Confirmação Manual**: Use o endpoint manualmente antes de eventos importantes

3. **Integração com outros sistemas**: Chame o endpoint de outros serviços ou workflows

## Considerações de Segurança

- As credenciais do Twilio devem ser mantidas em variáveis de ambiente
- O endpoint não requer autenticação (considere adicionar autenticação em produção)
- Rate limiting já está configurado no Express (100 requisições por 15 minutos)

## Limitações e Melhorias Futuras

1. **Autenticação**: Adicionar autenticação API key ou JWT
2. **Templates personalizados**: Permitir customização de mensagens
3. **Logs de envio**: Persistir histórico de mensagens enviadas
4. **Retry logic**: Implementar tentativas automáticas em caso de falha
5. **Multi-idioma**: Suporte a mensagens em diferentes idiomas
6. **Agendamento integrado**: Sistema interno de agendamento sem dependência de cron

## Troubleshooting

### Mensagens não estão sendo enviadas

1. Verifique se as credenciais do Twilio estão corretas
2. Confirme que o número WhatsApp está configurado corretamente
3. Verifique os logs do servidor para erros
4. Teste com o modo mock primeiro

### Eventos não estão sendo encontrados

1. Verifique se há eventos no banco de dados
2. Confirme que os eventos têm `dateTime` no período esperado
3. Ajuste o parâmetro `hoursAhead`

### Erro de conexão com MongoDB

1. Verifique se o MongoDB está rodando
2. Confirme a string de conexão em `MONGODB_URI`
