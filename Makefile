reset:
	pnpm supabase db reset

restart:
	pnpm supabase stop
	docker volume ls -q | grep deplio | xargs -L1 docker volume rm || true
	pnpm supabase start -x realtime

types:
	pnpm supabase gen types typescript --local > frontend/src/lib/types/database.ts 

start-aws:
	pnpm dotenv -- python3 scripts/start_local_env.py
