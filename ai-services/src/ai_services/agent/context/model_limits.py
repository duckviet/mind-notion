"""Model context limits."""

from ai_services.core.types import ModelLimits

MODEL_LIMITS = {
    "gpt-4o": ModelLimits(input_limit=128_000, output_limit=16_384, context_window=128_000),
    "gpt-4o-mini": ModelLimits(input_limit=128_000, output_limit=16_384, context_window=128_000),
    "gpt-5-mini": ModelLimits(input_limit=200_000, output_limit=32_768, context_window=200_000),
    "claude-3-5-sonnet": ModelLimits(
        input_limit=200_000, output_limit=32_768, context_window=200_000
    ),
}

DEFAULT_MODEL = "gpt-5-mini"
DEFAULT_THRESHOLD = 0.85


def get_model_limits(model: str = DEFAULT_MODEL) -> ModelLimits:
    return MODEL_LIMITS.get(
        model, ModelLimits(input_limit=128_000, output_limit=4096, context_window=128_000)
    )
