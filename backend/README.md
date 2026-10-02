# Backend Getsêmani

Backend Supabase com PostgreSQL, autenticação GoTrue e políticas de segurança por usuário.

## Estrutura

- `supabase/config.toml`: configuração para desenvolvimento local.
- `supabase/migrations/`: tabelas, gatilhos, índices e políticas RLS.
- `.env.example`: variáveis necessárias para conectar o aplicativo.

## Banco de dados

### `profiles`

Perfil criado automaticamente após o cadastro no Supabase Auth. Armazena nome, gênero e a URL da foto.

## Fotos de perfil no Google Cloud Storage

A Edge Function `avatar` recebe JPG, PNG ou WebP de até 5 MB, valida o usuário pelo JWT do
Supabase e envia o arquivo ao Cloud Storage. As credenciais Google ficam somente na função.

1. No Google Cloud, crie uma conta de serviço para o app e conceda a ela o papel
   **Storage Object Admin** apenas no bucket de fotos.
2. Crie e baixe uma chave JSON dessa conta. Use os campos `client_email` e `private_key` nos
   comandos abaixo. Nunca coloque esse JSON ou a chave privada no `.env` do frontend.
3. Para que o navegador exiba as fotos, conceda ao principal `allUsers` o papel
   **Storage Object Viewer** nesse bucket. Isso torna as fotos públicas para quem souber a URL.
   Se a prevenção de acesso público estiver ativa, desative-a somente para esse bucket.
4. Cadastre os segredos no projeto Supabase:

   ```bash
   supabase secrets set GCS_BUCKET_NAME="SEU_BUCKET"
   supabase secrets set GCS_CLIENT_EMAIL="EMAIL_DA_CONTA_DE_SERVICO"
   supabase secrets set GCS_PRIVATE_KEY="CHAVE_PRIVADA_DO_JSON"
   ```

5. Aplique a coluna `avatar_url` e publique a função:

   ```bash
   cd backend
   supabase db push
   supabase functions deploy avatar --no-verify-jwt
   ```

6. Confirme que a origem publicada está em `allowedOrigins` no arquivo
   `supabase/functions/avatar/index.ts`. Para testar localmente, copie `.env.example` para um
   arquivo local ignorado pelo Git e inicie as funções com `supabase functions serve --env-file`.

O objeto usa o caminho `avatars/{user-id}/profile`; trocar a foto sobrescreve o mesmo objeto e
um parâmetro de versão evita que o navegador continue mostrando a imagem antiga.

### `manifestations`

Armazena título, categoria, texto, data e proprietário da manifestação. As políticas RLS garantem que cada usuário visualize e altere somente os próprios registros.

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Instale a CLI: `npm install -g supabase`.
3. Entre na conta: `supabase login`.
4. Na pasta `backend`, vincule o projeto:

   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   ```

5. Aplique a migration:

   ```bash
   supabase db push
   ```

6. Copie `.env.example` para `.env` e informe a URL e as chaves do projeto.

## Cadastro e login

O Supabase Auth administra senhas, JWT e refresh tokens. No cadastro, envie nome e gênero como metadados:

```ts
await supabase.auth.signUp({
  email,
  password,
  options: { data: { name, gender } },
});
```

Para entrar:

```ts
await supabase.auth.signInWithPassword({ email, password });
```

Não crie uma tabela manual de sessões. O SDK atualiza os tokens automaticamente.

## Desenvolvimento local

Com Docker ativo:

```bash
cd backend
supabase start
supabase db reset
```

## Exclusão completa da conta

A função `delete-account` valida o JWT do usuário e exclui definitivamente o registro em
`auth.users`. As tabelas `profiles` e `manifestations` usam `ON DELETE CASCADE`, portanto os dados
relacionados também são removidos.

Publique a função no projeto remoto:

```bash
supabase functions deploy delete-account --no-verify-jwt
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são disponibilizadas
automaticamente pelo ambiente das Edge Functions. Nunca envie a service role para o frontend.

O Supabase Studio ficará disponível em `http://localhost:54323`.

> A chave `service_role` nunca deve ser enviada ao navegador nem adicionada ao Git.

## Rate limit

As Edge Functions usam `public.consume_edge_rate_limit`, executada exclusivamente pela
`service_role`, para aplicar limites atômicos por usuário autenticado:

- `avatar`: 10 operações a cada 10 minutos;
- `delete-account`: 5 tentativas por hora.

Ao exceder o limite, a função responde com HTTP `429` e o cabeçalho `Retry-After`. Se o contador
não estiver disponível, a operação privilegiada falha fechada com HTTP `503`. Aplique a migration
antes de publicar as funções:

```bash
cd backend
npx supabase db push
npx supabase functions deploy avatar
npx supabase functions deploy delete-account
```
