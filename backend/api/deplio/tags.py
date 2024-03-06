from enum import StrEnum


class Tags(StrEnum):
    Q = 'Q'
    VERSIONS = 'Versions'


tags_metadata = [
    {
        'name': Tags.Q,
        'description': '**Deplio Q** is an asynchronous message queue for serverless applications. It allows you to send messages to be processed by your serverless functions.',
    },
    {
        'name': Tags.VERSIONS,
        'description': 'Operations related to **Deplio** API versions.',
    },
]
