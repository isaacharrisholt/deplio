from enum import StrEnum


class TeamType(StrEnum):
    PERSONAL = 'personal'
    ORGANIZATION = 'organization'


class UserRole(StrEnum):
    ADMIN = 'admin'
    MEMBER = 'member'
