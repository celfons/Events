# Configuração do PR Check como Requisito Obrigatório

Este documento explica como configurar o workflow `PR Build and Test Check` como um requisito obrigatório antes de fazer merge para a branch `main`.

## O que foi implementado

Foi criado um novo GitHub Actions workflow (`.github/workflows/pr-check.yml`) que:

1. É acionado automaticamente quando um Pull Request é criado ou atualizado apontando para a branch `main`
2. Executa os seguintes passos:
   - Checkout do código
   - Configuração do Node.js 22.x
   - Instalação de dependências (`npm install`)
   - Execução do build (se existir)
   - Execução de todos os testes unitários (79 testes)

## Como configurar como requisito obrigatório no GitHub

Para que o PR só possa ser mergeado após o workflow passar com sucesso, siga estes passos:

### Passo 1: Acessar as configurações do repositório

1. Vá até o repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Branches**

### Passo 2: Adicionar regra de proteção para a branch main

1. Na seção "Branch protection rules", clique em **Add rule** (ou edite a regra existente para `main`)
2. Em "Branch name pattern", digite: `main`

### Passo 3: Configurar as proteções necessárias

Marque as seguintes opções:

- ✅ **Require a pull request before merging**
  - Isso garante que mudanças só podem ser feitas via PR

- ✅ **Require status checks to pass before merging**
  - Isso é o mais importante para nosso objetivo
  - Marque também: **Require branches to be up to date before merging**
  
- ✅ **Require conversation resolution before merging** (opcional, mas recomendado)
  - Garante que todos os comentários de revisão sejam resolvidos

### Passo 4: Selecionar o status check específico

1. Na seção "Status checks that are required", procure por: **build-and-test**
   - Este é o nome do job definido no workflow `pr-check.yml`
   
2. Se o status check não aparecer imediatamente:
   - Você precisa criar um PR primeiro para que o workflow execute
   - Depois que o workflow executar pela primeira vez, o status check aparecerá na lista
   - Volte às configurações e selecione o check

### Passo 5: Salvar as configurações

1. Role até o final da página
2. Clique em **Create** (ou **Save changes** se estiver editando)

## Testando a configuração

Para testar se está funcionando:

1. Crie um novo branch
2. Faça uma alteração no código
3. Abra um Pull Request para `main`
4. Observe que o workflow `PR Build and Test Check` será executado automaticamente
5. Só será possível fazer merge quando todos os checks estiverem verdes (✅)

## Exemplo de proteção

Depois de configurado, ao tentar fazer merge de um PR:

- ❌ Se os testes falharem → merge bloqueado
- ❌ Se o build falhar → merge bloqueado
- ✅ Se tudo passar → merge permitido

## Benefícios

Esta configuração garante:

- ✅ Qualidade do código mantida
- ✅ Nenhum código quebrado chega na branch `main`
- ✅ Todos os 79 testes unitários passam antes do merge
- ✅ Build sempre funcional na branch principal
- ✅ CI/CD confiável

## Notas Importantes

1. **Administradores**: Por padrão, administradores podem fazer bypass das regras. Para aplicar a todos (incluindo admins), marque "Do not allow bypassing the above settings"

2. **Status check name**: O nome do check é `build-and-test`, que corresponde ao nome do job no workflow

3. **First-time setup**: Você precisa que o workflow execute pelo menos uma vez antes que o status check apareça nas configurações

4. **Permissions**: O workflow usa `permissions: contents: read` para seguir o princípio de privilégio mínimo
