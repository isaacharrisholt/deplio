# Deplio

Deplio is a toolbox of simple utils for serverless applications developed with love
at [Pluto](https://stairpay.com). It's still being developed internally, and has
not yet been deployed to a production environment, so it's not publicly accessible.

However, we're planning on making Deplio open-source anyway, so we figured we'd start
now.

It will be available at [depl.io](https://depl.io) when it is.

Deplio is currently comprised three parts:

- Q: A HTTP message queue for serverless applications
- Jobs: One-off, scheduled jobs built on Q (API WIP)
- Cron: Regular, repeated jobs build on Q

## Running Deplio

### Requirements

Given that Deplio is primarily being used as an in-house tool, the current set up
is very much oriented towards what we use internally. However, most of this
should be usable locally, with the exception of [Doppler](https://doppler.com)
which is used for secrets management.

However, Doppler is free for small teams, and we welcome any contributions that
will reduce reliance on the tool for local development.

There are a few tools you'll need to install for running Deplio:

- Python 3.12 or higher with [Poetry](https://poetry.dev)
- Go 1.21 or higher
- Node.js 18 or higher
- pnpm
- Docker with Compose
- [LocalStack](https://localstack.cloud) and [tflocal](https://github.com/localstack/terraform-local)
- Terraform
- Make
- The Supabase CLI

### GitHub app

Since Deplio uses GitHub authentication, you'll need to create a GitHub app with
the following settings:

Homepage URL: `http://localhost:3000`
Callback URLs: `http://localhost:54321/auth/v1/callback`, `http://127.0.0.1:54321/auth/v1/callback`
Setup URL: `http://localhost:3000/dashboard/provider-callback/github`

Account permissions:
Email: Read-only

Make sure to save the client ID and client secret, and create a private key for
the next step.

### Environment

You'll need to create a .env file with a minimum of:

```env
DOPPLER_TOKEN=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_PRIVATE_KEY=
```

### Starting things

Install dependencies:

```bash
pnpm i
cd backend/api
poetry install
```

Start the local AWS infrastructure:

```bash
make start-aws
```

Start the local Redis instance and API gateway:

```bash
cd local_infra/redis
docker compose up -d
```

Start Supabase:

```bash
make restart
```

Start Deplio:

```bash
pnpm run dev
```

## Infrastructure

Deplio is mostly a wrapper around AWS SQS. The backend is a FastAPI monolith
using [Cadwyn](https://github.com/zmievsa/cadwyn) for API versioning. The frontend
is written in SvelteKit.

Authentication and Postgres are provided by [Supabase](https://supabase.com), and
we use Vercel KV for our cache. Deplio is designed to be deployed on [Fly.io](https://fly.io)
and [Vercel](https://vercel.com), but you could deploy it anywhere you can run Python
and Node.
