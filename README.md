# Getsêmani

Aplicação web de manifestação, reflexão e bem-estar. O Getsêmani reúne um painel pessoal para registrar objetivos, acompanhar manifestações, escrever um diário protegido e ouvir áudios de meditação em uma experiência responsiva e instalável como PWA.

## Funcionalidades

- Cadastro, confirmação de e-mail, login e gerenciamento de sessão com Supabase Auth.
- Catálogo de objetivos e criação de manifestações personalizadas.
- Registro e acompanhamento do histórico de cada manifestação.
- Diário por data, com personalização de papel, fonte e cor da escrita.
- Proteção opcional do diário por senha com criptografia no navegador.
- Player de meditação com sons ambientes e frequências.
- Central de notificações, lembretes e afirmações diárias.
- Perfil com alteração de nome e avatar.
- Exclusão completa da conta e dos dados relacionados.
- Interface responsiva, metadados sociais e manifesto PWA.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS 4, Radix UI e Lucide |
| Aplicação | TanStack Start, TanStack Router e TanStack Query |
| Build/SSR | Vite 8 e Nitro |
| Backend | Supabase Auth, PostgreSQL, PostgREST e Edge Functions |
| Arquivos | Google Cloud Storage para avatares |
| Validação e formulários | Zod, React Hook Form e Hookform Resolvers |
| Deploy | preset Cloudflare Modules no build; backend publicado no Supabase |

## Arquitetura

```text
.
├── src/
│   ├── assets/          # imagens e áudios da aplicação
│   ├── components/      # componentes de domínio e componentes de UI
│   ├── lib/             # autenticação, Supabase, diário e manifestações
│   ├── routes/          # rotas file-based do TanStack Router
│   ├── server.ts        # handler SSR e cabeçalhos de segurança
│   └── start.ts         # middlewares da aplicação
├── public/              # ícones, imagem social, robots e manifesto PWA
├── backend/
│   └── supabase/
│       ├── functions/   # avatar e exclusão de conta
│       └── migrations/  # schema, índices, constraints e políticas RLS
└── scripts/
    └── security-isolation.mjs
```

O navegador usa apenas a chave pública do Supabase. As políticas de Row Level Security (RLS) são a fronteira de autorização dos dados, enquanto operações privilegiadas ficam nas Edge Functions. O conteúdo protegido do diário é criptografado antes de sair do dispositivo.

## Pré-requisitos

- Node.js 22 ou versão LTS compatível.
- npm (o repositório também contém configuração e lockfile do Bun).
- Uma conta e um projeto no [Supabase](https://supabase.com/).
- Supabase CLI e Docker, caso queira executar o backend localmente.
- Um bucket no Google Cloud Storage, caso queira habilitar avatares.

## Começando

1. Clone o repositório e instale as dependências:

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd getsemani
   npm install
   ```

2. Crie `.env.local` na raiz:

   ```env
   VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
   ```

3. Vincule e prepare o projeto Supabase:

   ```bash
   cd backend
   supabase login
   supabase link --project-ref SEU_PROJECT_REF
   supabase db push
   cd ..
   ```

4. Inicie a aplicação:

   ```bash
   npm run dev
   ```

Por padrão, o Vite fica disponível em `http://localhost:8080`.

> A aplicação precisa das migrations aplicadas para que cadastro, perfil, manifestações e diário funcionem corretamente.

## Backend local

Com o Docker em execução:

```bash
cd backend
supabase start
supabase db reset
```

O comando `supabase start` informa as URLs e chaves locais. Use a API URL e a chave publicável/anon geradas no `.env.local` da raiz. O Supabase Studio fica disponível em `http://localhost:54323`.

Para encerrar os serviços locais:

```bash
supabase stop
```

## Avatares no Google Cloud Storage

A função `avatar` aceita JPG, PNG ou WebP de até 5 MB. Para habilitá-la:

1. Crie um bucket dedicado no Google Cloud Storage.
2. Crie uma conta de serviço com acesso restrito ao bucket.
3. Configure os segredos diretamente no Supabase:

   ```bash
   supabase secrets set GCS_BUCKET_NAME="SEU_BUCKET"
   supabase secrets set GCS_CLIENT_EMAIL="EMAIL_DA_CONTA_DE_SERVICO"
   supabase secrets set GCS_PRIVATE_KEY="CHAVE_PRIVADA_DO_JSON"
   ```

4. Adicione o domínio da aplicação à lista `allowedOrigins` das duas Edge Functions.
5. Publique as funções:

   ```bash
   cd backend
   supabase functions deploy avatar
   supabase functions deploy delete-account
   ```

Se os objetos do bucket forem públicos, qualquer pessoa que possua a URL poderá visualizar a imagem. Avalie essa escolha de privacidade antes de habilitar acesso público.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | inicia o servidor de desenvolvimento na porta 8080 |
| `npm run build` | gera o build de produção |
| `npm run preview` | executa uma prévia local do build |
| `npm run lint` | verifica o código com ESLint |
| `npm run format` | formata o projeto com Prettier |
| `npm run test:security` | testa isolamento entre duas contas no Supabase |

Antes de abrir uma alteração, execute:

```bash
npm run lint
npm run build
```

## Teste de isolamento de dados

O teste de segurança cria um registro temporário com a conta A e confirma que a conta B não consegue ler, alterar ou excluir esse registro. Ele também verifica tokens inválidos e troca de sessão.

Use duas contas exclusivas de teste e defina as variáveis somente no terminal ou em um arquivo local ignorado pelo Git:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
SECURITY_TEST_USER_A_EMAIL=usuario-a@example.com
SECURITY_TEST_USER_A_PASSWORD=senha-de-teste-a
SECURITY_TEST_USER_B_EMAIL=usuario-b@example.com
SECURITY_TEST_USER_B_PASSWORD=senha-de-teste-b
```

Depois execute:

```bash
npm run test:security
```

Sem todas as variáveis, o script é ignorado de forma segura.

## Segurança

O projeto adota defesa em profundidade:

- RLS habilitado e forçado em `profiles`, `manifestations` e `diaries`.
- Políticas por `auth.uid()` limitam leitura e escrita ao proprietário.
- O papel anônimo não recebe acesso direto às tabelas pessoais.
- Autenticação e renovação de JWT são administradas pelo Supabase Auth.
- Edge Functions validam origem, método e usuário autenticado antes de operações privilegiadas.
- A `service_role` existe somente no ambiente da função de exclusão de conta.
- Diários protegidos usam AES-GCM de 256 bits; a chave deriva da senha com PBKDF2-SHA-256 e 210 mil iterações.
- Salt e IV aleatórios são gerados para cada gravação protegida; a senha não é enviada nem armazenada.
- Respostas SSR incluem CSP, HSTS em HTTPS, proteção contra framing, `nosniff`, política de referência e restrições de permissões.
- Server Functions usam middleware CSRF.
- Sessões e caches locais são apagados no logout, na exclusão da conta e na troca de usuário.
- Constraints no banco limitam formatos e tamanho de payloads.

### Regras para segredos

- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, a chave privada do Google ou senhas em variáveis com prefixo `VITE_`.
- Variáveis `VITE_*` fazem parte do bundle do navegador e devem conter somente valores públicos.
- Não versione `.env`, `.env.local`, `.dev.vars`, credenciais JSON ou logs.
- Use contas de serviço com privilégio mínimo e rotacione imediatamente qualquer chave exposta.
- Revise `allowedOrigins` antes de cada deploy e mantenha somente os domínios necessários.

## Build e deploy

Gere e valide o artefato de produção com:

```bash
npm run build
npm run preview
```

O build está configurado com o preset `cloudflare-module`. Na plataforma escolhida, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e faça um novo deploy sempre que essas variáveis mudarem. Aplique também todas as migrations e publique as Edge Functions no mesmo projeto Supabase usado pelo frontend.

Em produção, confirme:

- HTTPS ativo;
- URL pública cadastrada nos redirects do Supabase Auth;
- domínio cadastrado em `allowedOrigins` nas Edge Functions;
- RLS e migrations aplicadas;
- segredos configurados apenas no backend;
- fluxo de cadastro, login, logout, exclusão e isolamento entre contas testado.

## Observações sobre o diário protegido

A criptografia acontece no cliente e a senha não pode ser recuperada pelo servidor. Se o usuário esquecer a senha, o conteúdo protegido não poderá ser descriptografado. Entradas sem proteção continuam sujeitas ao isolamento por RLS, mas são armazenadas sem criptografia de conteúdo no banco.

## Licença

Este repositório ainda não declara uma licença. Até que um arquivo `LICENSE` seja adicionado, o uso, a cópia e a redistribuição não são automaticamente autorizados.
