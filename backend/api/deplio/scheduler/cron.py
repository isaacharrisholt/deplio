from deplio.services.supabase import supabase_admin
from deplio.utils.async_utils import synchronise


@synchronise
async def run_scheduled_jobs():
    _ = await supabase_admin()
    print('Invoking cron jobs')
