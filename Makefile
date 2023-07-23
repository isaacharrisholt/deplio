.PHONY: reset

reset:
	pnpm supabase db reset

restart:
	pnpm supabase stop
	docker volume ls -q | grep deplio | xargs -L1 docker volume rm || true
	pnpm supabase start