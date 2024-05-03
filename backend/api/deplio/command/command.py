from typing import Any, Protocol


class SyncCommand(Protocol):
    def execute(self) -> Any:
        ...

    def undo(self) -> Any:
        ...

    def redo(self) -> Any:
        ...


class AsyncCommand(Protocol):
    async def execute(self) -> Any:
        ...

    async def undo(self) -> Any:
        ...

    async def redo(self) -> Any:
        ...


Command = SyncCommand | AsyncCommand
