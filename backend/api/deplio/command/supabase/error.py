class SupabaseError(Exception):
    def __init__(self, message: str, *args) -> None:
        super().__init__(message, *args)
