"""Tests for agent context."""

from __future__ import annotations

import pytest

from ai_services.agent.context.model_limits import get_model_limits, DEFAULT_THRESHOLD
from ai_services.agent.context.token_estimator import (
    estimate_messages_tokens,
    calculate_usage_percentage,
)


def test_get_model_limits():
    limits = get_model_limits("gpt-5-mini")
    assert limits.context_window == 200_000
    assert limits.input_limit == 200_000


def test_estimate_messages_tokens():
    messages = [
        {"role": "system", "content": "You are helpful."},
        {"role": "user", "content": "Hello"},
    ]
    tokens = estimate_messages_tokens(messages)
    assert tokens.input > 0


def test_calculate_usage_percentage():
    pct = calculate_usage_percentage(100_000, 200_000)
    assert pct == 0.5
