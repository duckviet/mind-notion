from ai_services.agent.api_contracts import (
    EditProposal,
    InlineAssistResult,
    RAGAnswer,
)
from ai_services.agent.run_inline_edit import _build_inline_result


def test_improve_returns_edit_proposal() -> None:
    result = _build_inline_result(
        action="improve",
        command="/improve",
        mode="inline_transform",
        selected_text="toi can viet tot hon",
        raw_text="Tôi cần viết tốt hơn.",
        resource_context={"note_id": "note-1", "note_version": 12},
    )

    assert isinstance(result, EditProposal)
    assert result.original == "toi can viet tot hon"
    assert result.proposed == "Tôi cần viết tốt hơn."
    assert result.target.note_id == "note-1"
    assert result.target.expected_version == 12


def test_shorten_does_not_return_longer_text() -> None:
    original = "Ngày 25/06, doanh thu đạt 120 triệu."
    result = _build_inline_result(
        action="shorter",
        command="/shorten",
        mode="inline_transform",
        selected_text=original,
        raw_text="Ngày 25/06, doanh thu đạt 120 triệu và cần được ghi nhận trong báo cáo.",
        resource_context={},
    )

    assert isinstance(result, EditProposal)
    assert len(result.proposed) <= len(original)


def test_explain_returns_assist_result() -> None:
    result = _build_inline_result(
        action="explain",
        command="/explain",
        mode="inline_assist",
        selected_text="EBITDA",
        raw_text="EBITDA là lợi nhuận trước lãi vay, thuế và khấu hao.",
        resource_context={},
    )

    assert isinstance(result, InlineAssistResult)
    assert "EBITDA" in result.explanation


def test_find_without_sources_marks_missing_context() -> None:
    result = _build_inline_result(
        action="find",
        command="/find",
        mode="personal_knowledge_search",
        selected_text="Khách hàng ACME nói gì?",
        raw_text="",
        resource_context={},
    )

    assert isinstance(result, RAGAnswer)
    assert result.missing_context is True
    assert result.sources == []


def test_system_prompt_injects_formatting_policy() -> None:
    from ai_services.agent.system import build_system_prompt

    # Test inline_transform policy injection
    prompt_transform = build_system_prompt(mode="inline_transform")
    assert "Formatting for this operation (INLINE TRANSFORM)" in prompt_transform

    # Test chat policy injection
    prompt_chat = build_system_prompt(mode="chat")
    assert "Formatting for this operation (CHAT / Q&A)" in prompt_chat

    # Test fallback to chat for invalid mode
    prompt_invalid = build_system_prompt(mode="nonexistent_mode")
    assert "Formatting for this operation (CHAT / Q&A)" in prompt_invalid

