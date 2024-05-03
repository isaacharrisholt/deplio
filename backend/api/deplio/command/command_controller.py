from dataclasses import dataclass
from typing import Any
import inspect

from deplio.command.command import Command


@dataclass
class CommandController:
    undo_stack: list[Command] = []
    redo_stack: list[Command] = []

    @staticmethod
    async def handle_awaitable(maybe_coroutine: Any) -> Any:
        if inspect.isawaitable(maybe_coroutine):
            return await maybe_coroutine
        else:
            return maybe_coroutine

    async def execute(self, command: Command) -> Any:
        result = command.execute()
        self.redo_stack.clear()
        self.undo_stack.append(command)
        return await self.handle_awaitable(result)

    async def undo(self) -> Any:
        if not self.undo_stack:
            return
        command = self.undo_stack.pop()
        result = command.undo()
        self.redo_stack.append(command)
        return await self.handle_awaitable(result)

    async def undo_all(self) -> list[Any]:
        return [await self.undo() for _ in range(len(self.undo_stack))]

    async def redo(self) -> Any:
        if not self.redo_stack:
            return
        command = self.redo_stack.pop()
        result = command.redo()
        self.undo_stack.append(command)
        return await self.handle_awaitable(result)

    async def redo_all(self) -> list[Any]:
        return [await self.redo() for _ in range(len(self.redo_stack))]
