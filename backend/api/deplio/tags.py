from enum import StrEnum


class Tags(StrEnum):
    CRON = "Cron"
    Q = "Q"
    VERSIONS = "Versions"


tags_metadata = [
    {
        "name": Tags.Q,
        "description": "**Deplio Q** is an asynchronous message queue for serverless applications. It allows you to send messages to be processed by your serverless functions.",
    },
    {
        "name": Tags.CRON,
        "description": "**Deplio Cron** allows you to schedule and execute workloads on a regular basis.",
    },
    {
        "name": Tags.VERSIONS,
        "description": "Operations related to **Deplio** API versions.",
    },
]
