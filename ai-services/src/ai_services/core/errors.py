"""Core exceptions."""


class AIServiceError(Exception):
    """Base exception for AI services."""

    pass


class ConfigurationError(AIServiceError):
    """Configuration error."""

    pass


class ProviderError(AIServiceError):
    """Provider error."""

    pass


class ToolExecutionError(AIServiceError):
    """Tool execution error."""

    pass


class ContextError(AIServiceError):
    """Context management error."""

    pass


class ValidationError(AIServiceError):
    """Validation error."""

    pass
