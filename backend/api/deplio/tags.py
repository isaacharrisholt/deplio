from enum import StrEnum


class Tags(StrEnum):
    MISC = 'Misc'
    Q = 'Q'


tags_metadata = [
    {
        'name': Tags.Q,
        'description': '**Deplio Q** is an asynchronous message queue for serverless applications. It allows you to send messages to be processed by your serverless functions.',
    },
    {
        'name': Tags.MISC,
        'description': 'Miscellaneous endpoints that do not fit into any other category.',
    },
]
