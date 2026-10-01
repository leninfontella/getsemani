# Getsêmani Manifest

Crie um aplicativo mobile:

para um projeto chamado Getsêmani, onde o principal objetivo e Manifestar aquilo que deseja, como se já fosse seu!

O projeto deve ter o mesmo layout, cores, dashboard, fundo igual da imagem Getsêmani.jpg.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

# Getsêmani

## Conexão com o Supabase

O frontend usa diretamente a API segura do Supabase com Row Level Security. Crie um arquivo
`.env.local` para desenvolvimento ou cadastre as mesmas variáveis na Vercel:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend nem use o prefixo `VITE_` nessa chave.
Depois de alterar variáveis na Vercel, é necessário criar um novo deployment.

O banco e as políticas de segurança estão em
`backend/supabase/migrations/202609290001_initial_schema.sql`. Aplique a migration antes de usar
cadastro, login e manifestações.
