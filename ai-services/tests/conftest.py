"""Pytest fixtures."""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def mock_llm_client():
    """Mock LLM client."""
    client = MagicMock()
    client.chat.completions.create = AsyncMock()
    return client


@pytest.fixture
def mock_backend_client():
    """Mock backend client."""
    client = MagicMock()
    client.get_note = AsyncMock(return_value=None)
    client.search_notes = AsyncMock(return_value=[])
    return client
