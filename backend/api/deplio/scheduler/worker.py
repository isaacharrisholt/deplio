from deplio.scheduler.cron import run_scheduled_jobs
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import time


if __name__ == '__main__':
    scheduler = BackgroundScheduler()
    tr = CronTrigger(second='*')

    scheduler.add_job(run_scheduled_jobs, trigger=tr)
    scheduler.start()

    # Allow scheduler to run indefinitely
    while True:
        time.sleep(1)
