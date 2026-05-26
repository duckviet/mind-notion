"""Skill registry for auto-discovery."""

from __future__ import annotations

from typing import Any

from .base import Skill, ToolSpec


class SkillRegistry:
    """Registry for skills and tools."""

    def __init__(self) -> None:
        self._skills: dict[str, Skill] = {}
        self._tools: dict[str, ToolSpec] = {}

    def register(self, skill: Skill) -> None:
        """Register a skill."""
        self._skills[skill.name] = skill
        for tool in skill.tools:
            self._tools[tool.name] = tool

    def get_skill(self, name: str) -> Skill | None:
        """Get a skill by name."""
        return self._skills.get(name)

    def get_tool(self, name: str) -> ToolSpec | None:
        """Get a tool by name."""
        return self._tools.get(name)

    def list_skills(self) -> list[Skill]:
        """List all skills."""
        return list(self._skills.values())

    def list_tools(self) -> list[ToolSpec]:
        """List all tools."""
        return list(self._tools.values())

    def resolve_tools(self, user_message: str) -> list[ToolSpec]:
        """Resolve tools based on user message triggers."""
        message_lower = user_message.lower()
        resolved: list[ToolSpec] = []

        for skill in self._skills.values():
            for trigger in skill.triggers:
                if trigger.lower() in message_lower:
                    resolved.extend(skill.tools)
                    break

        if not resolved:
            resolved = list(self._tools.values())

        return resolved


_global_registry: SkillRegistry | None = None


def get_skill_registry() -> SkillRegistry:
    """Get global skill registry."""
    global _global_registry
    if _global_registry is None:
        _global_registry = SkillRegistry()
    return _global_registry


def register_skill(skill: Skill) -> None:
    """Register a skill in global registry."""
    get_skill_registry().register(skill)
