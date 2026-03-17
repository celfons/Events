#!/usr/bin/env node
/**
 * xano-export.js
 *
 * Gera um arquivo de workspace Xano a partir dos dados atuais da plataforma Events.
 *
 * Uso:
 *   node xano-export.js [--output <caminho>]
 *
 * O arquivo gerado pode ser importado diretamente no Xano pelo menu:
 *   Workspace Settings → Import → selecionar o arquivo JSON gerado.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Parse CLI arguments
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
const outputPath =
  outputIndex !== -1 && args[outputIndex + 1]
    ? args[outputIndex + 1]
    : path.join(__dirname, 'xano', `workspace-export-${Date.now()}.json`);

// Load workspace schema template
const schemaTemplatePath = path.join(__dirname, 'xano', 'workspace.json');
if (!fs.existsSync(schemaTemplatePath)) {
  console.error(`Arquivo de schema não encontrado: ${schemaTemplatePath}`);
  process.exit(1);
}

const workspaceTemplate = JSON.parse(fs.readFileSync(schemaTemplatePath, 'utf8'));

// Helper: convert MongoDB document to a Xano-compatible plain object
function toXanoRecord(doc, tableFields) {
  const record = {};
  for (const field of tableFields) {
    const mongoKey = toMongoKey(field.name);
    const value = doc[mongoKey] !== undefined ? doc[mongoKey] : doc[field.name];
    if (value !== undefined && value !== null) {
      record[field.name] = formatValue(value, field.type);
    }
  }
  return record;
}

// Convert snake_case field name to camelCase (MongoDB convention)
function toMongoKey(fieldName) {
  return fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Format value according to Xano field type
function formatValue(value, type) {
  switch (type) {
    case 'timestamp':
      return value instanceof Date ? value.toISOString() : value;
    case 'id':
    case 'table_reference':
      return value ? value.toString() : null;
    case 'bool':
      return Boolean(value);
    case 'int':
      return Number(value);
    default:
      return value;
  }
}

async function exportWorkspace() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/events';

  console.log(`Conectando ao MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('Conectado ao MongoDB com sucesso.');

  // Load models
  require('./src/infrastructure/database/UserModel');
  require('./src/infrastructure/database/EventModel');

  const UserModel = mongoose.model('User');
  const EventModel = mongoose.model('Event');

  // Find table field definitions from the template
  const tableMap = {};
  for (const table of workspaceTemplate.content.database_tables) {
    tableMap[table.name] = table.schema;
  }

  console.log('Exportando dados das tabelas...');

  // Export users
  const users = await UserModel.find({}).lean();
  const exportedUsers = users.map(doc => toXanoRecord(doc, tableMap['user']));
  console.log(`  → ${exportedUsers.length} usuário(s) exportado(s)`);

  // Export events and participants
  const events = await EventModel.find({}).lean();
  const exportedEvents = [];
  const exportedParticipants = [];

  for (const event of events) {
    exportedEvents.push(toXanoRecord(event, tableMap['event']));

    for (const participant of event.participants || []) {
      const participantRecord = toXanoRecord({ ...participant, eventId: event._id }, tableMap['participant']);
      exportedParticipants.push(participantRecord);
    }
  }

  console.log(`  → ${exportedEvents.length} evento(s) exportado(s)`);
  console.log(`  → ${exportedParticipants.length} inscrição(ões) exportada(s)`);

  // Build the final export object
  const exportData = {
    ...workspaceTemplate,
    content: {
      ...workspaceTemplate.content,
      data: {
        user: exportedUsers,
        event: exportedEvents,
        participant: exportedParticipants
      }
    }
  };

  // Write output file
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
  console.log('\nArquivo de workspace Xano gerado com sucesso:');
  console.log(`  ${outputPath}`);
  console.log('\nPróximos passos para importar no Xano:');
  console.log('  1. Acesse sua conta em https://www.xano.com');
  console.log('  2. Abra ou crie um workspace');
  console.log('  3. Vá em "Settings" (ícone de engrenagem) → "Import"');
  console.log(`  4. Selecione o arquivo: ${path.basename(outputPath)}`);
  console.log('  5. Clique em "Import" e aguarde a conclusão');

  await mongoose.disconnect();
}

exportWorkspace().catch(err => {
  console.error('Erro ao exportar workspace:', err.message);
  process.exit(1);
});
