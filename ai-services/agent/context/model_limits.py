from __future__ import annotations

from ..contracts import ModelLimits

DEFAULT_THRESHOLD = 0.8

_MODEL_LIMITS: dict[str, ModelLimits] = {
    "gpt-5": ModelLimits(input_limit=272000, output_limit=128000, context_window=400000),
    "gpt-5-mini": ModelLimits(input_limit=272000, output_limit=128000, context_window=400000),
}

_DEFAULT_LIMITS = ModelLimits(input_limit=128000, output_limit=16000, context_window=128000)


def get_model_limits(model: str) -> ModelLimits:
    if model in _MODEL_LIMITS:
        return _MODEL_LIMITS[model]
    if model.startswith("gpt-5"):
        return _MODEL_LIMITS["gpt-5"]
    return _DEFAULT_LIMITS


def is_over_threshold(total_tokens: int, context_window: int, threshold: float = DEFAULT_THRESHOLD) -> bool:
    return total_tokens > context_window * threshold


def calculate_usage_percentage(total_tokens: int, context_window: int) -> float:
    if context_window <= 0:
        return 0.0
    return (total_tokens / context_window) * 100.0
