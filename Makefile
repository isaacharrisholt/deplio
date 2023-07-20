.PHONY: reset

reset:
	pnpm supabase db reset

restart:
	pnpm supabase stop
	pnpm supabase start