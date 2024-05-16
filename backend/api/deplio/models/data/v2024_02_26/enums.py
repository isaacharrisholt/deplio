# THIS FILE WAS AUTO-GENERATED BY CADWYN. DO NOT EVER TRY TO EDIT IT BY HAND

from enum import StrEnum


class TeamType(StrEnum):
    PERSONAL = 'personal'
    ORGANIZATION = 'organization'


class UserRole(StrEnum):
    ADMIN = 'admin'
    MEMBER = 'member'


class HTTPMethod(StrEnum):
    GET = 'GET'
    POST = 'POST'
    PUT = 'PUT'
    DELETE = 'DELETE'
    PATCH = 'PATCH'


class CronJobStatus(StrEnum):
    ACTIVE = 'active'
    INACTIVE = 'inactive'


class ScheduledJobStatus(StrEnum):
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'