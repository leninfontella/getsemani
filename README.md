# Getsêmani Manifest

Crie um aplicativo mobile:

para um projeto chamado Getsêmani, onde o principal objetivo e Manifestar aquilo que deseja, como se já fosse seu!

O projeto deve ter o mesmo layout, cores, dashboard, fundo igual da imagem Getsêmani.jpg.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a0f8244f-b0b6-4688-8cc7-ca5deb7c5c3c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

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
