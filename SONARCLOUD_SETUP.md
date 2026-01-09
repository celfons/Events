# Configuração do SonarCloud

Este documento explica como configurar o SonarCloud para o projeto Events.

## Pré-requisitos

1. Conta no [SonarCloud](https://sonarcloud.io/)
2. Acesso de administrador ao repositório GitHub

## Passos para Configuração

### 1. Criar Conta no SonarCloud

1. Acesse https://sonarcloud.io/
2. Clique em "Log in" e autentique com sua conta GitHub
3. Autorize o SonarCloud a acessar sua organização GitHub

### 2. Importar o Projeto

1. No dashboard do SonarCloud, clique em "+" no canto superior direito
2. Selecione "Analyze new project"
3. Escolha o repositório `celfons/Events`
4. Clique em "Set Up"

### 3. Configurar a Organização

1. Se ainda não existir, crie uma organização chamada `celfons`
2. Configure a organização como pública ou privada conforme necessário
3. Anote a **Organization Key**: `celfons`
4. O **Project Key** será: `celfons_Events`

### 4. Gerar Token de Acesso

1. No SonarCloud, vá em "My Account" → "Security"
2. Na seção "Generate Tokens", crie um novo token:
   - **Name**: `GitHub Actions - Events`
   - **Type**: `Project Analysis Token`
   - Selecione o projeto `celfons_Events`
   - Clique em "Generate"
3. **Importante**: Copie o token gerado (você não poderá vê-lo novamente)

### 5. Adicionar o Token ao GitHub

1. Vá para o repositório no GitHub: https://github.com/celfons/Events
2. Acesse **Settings** → **Secrets and variables** → **Actions**
3. Clique em "New repository secret"
4. Adicione o secret:
   - **Name**: `SONAR_TOKEN`
   - **Value**: Cole o token copiado do SonarCloud
5. Clique em "Add secret"

### 6. Verificar a Configuração

O arquivo `sonar-project.properties` já está configurado com:

```properties
sonar.projectKey=celfons_Events
sonar.organization=celfons
```

Se necessário, atualize estes valores para corresponder à sua configuração.

### 7. Executar a Primeira Análise

Existem duas formas de executar a primeira análise:

#### Opção 1: Via Push (Automático)
1. Faça push das mudanças para a branch `main` ou `dev`
2. O GitHub Actions executará automaticamente o workflow
3. A análise do SonarCloud será executada como parte do build

#### Opção 2: Via Pull Request (Automático)
1. Crie um Pull Request para a branch `main`
2. O workflow de PR Check executará automaticamente
3. Os resultados aparecerão como comentário no PR

### 8. Visualizar os Resultados

1. Acesse o [dashboard do projeto](https://sonarcloud.io/summary/new_code?id=celfons_Events)
2. Você verá:
   - **Quality Gate**: Status geral do projeto
   - **Coverage**: Cobertura de testes
   - **Security**: Vulnerabilidades de segurança
   - **Maintainability**: Manutenibilidade do código
   - **Reliability**: Confiabilidade (bugs)

### 9. Configurar Quality Gate (Opcional)

1. No SonarCloud, acesse o projeto
2. Vá em "Administration" → "Quality Gate"
3. Configure os critérios mínimos:
   - Coverage mínima: 80%
   - Duplicação máxima: 3%
   - Security Rating: A
   - Maintainability Rating: A

## Badges no README

Os badges já foram adicionados ao README.md:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=celfons_Events&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=celfons_Events)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=celfons_Events&metric=coverage)](https://sonarcloud.io/summary/new_code?id=celfons_Events)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=celfons_Events&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=celfons_Events)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=celfons_Events&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=celfons_Events)
```

## Integração com CI/CD

A integração já está configurada nos seguintes workflows:

- **main_celfons.yml**: Executa análise em push para `main`
- **dev_celfons(events-dev).yml**: Executa análise em push para `dev`
- **pr-check.yml**: Executa análise em Pull Requests para `main`

Cada workflow:
1. Instala as dependências
2. Executa os testes com cobertura (`npm run test:coverage`)
3. Envia os resultados para o SonarCloud

## Solução de Problemas

### Token Inválido
- Verifique se o `SONAR_TOKEN` foi adicionado corretamente aos secrets do GitHub
- Gere um novo token se necessário

### Projeto Não Encontrado
- Confirme que `sonar.projectKey` e `sonar.organization` estão corretos
- Verifique se o projeto foi importado no SonarCloud

### Análise Falhou
- Verifique os logs do GitHub Actions
- Certifique-se de que os testes estão passando
- Confirme que o arquivo `coverage/lcov.info` está sendo gerado

## Recursos Adicionais

- [Documentação do SonarCloud](https://docs.sonarcloud.io/)
- [Integração com GitHub Actions](https://docs.sonarcloud.io/advanced-setup/ci-based-analysis/github-actions/)
- [Métricas e Qualidade](https://docs.sonarcloud.io/digging-deeper/metric-definitions/)
