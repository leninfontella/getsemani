# Backend Getsêmani

Backend Supabase com PostgreSQL, autenticação GoTrue e políticas de segurança por usuário.

## Estrutura

- `supabase/config.toml`: configuração para desenvolvimento local.
- `supabase/migrations/`: tabelas, gatilhos, índices e políticas RLS.
- `.env.example`: variáveis necessárias para conectar o aplicativo.

## Banco de dados

### `profiles`

Perfil criado automaticamente após o cadastro no Supabase Auth. Armazena nome e gênero.

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
