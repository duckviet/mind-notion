from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any, Mapping

from openai import AsyncOpenAI

if __package__ in (None, ""):  # pragma: no cover
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

try:
    from .context import (
        DEFAULT_THRESHOLD,
        calculate_usage_percentage,
        compact_conversation,
        estimate_messages_tokens,
        get_model_limits,
        is_over_threshold,
    )
    from .execute_tool import execute_tool
    from .runtime_context import (
        reset_run_context,
        reset_tool_call_context,
        set_run_context,
        set_tool_call_context,
    )
    from .system import build_system_prompt, filter_compatible_messages
    from .tools import tools
    from .tools.types import ToolSpec
    from .contracts import AgentCallbacks, TokenUsageInfo
except ImportError:  # pragma: no cover
    from agent.context import (
        DEFAULT_THRESHOLD,
        calculate_usage_percentage,
        compact_conversation,
        estimate_messages_tokens,
        get_model_limits,
        is_over_threshold,
    )
    from agent.execute_tool import execute_tool
    from agent.runtime_context import (
        reset_run_context,
        reset_tool_call_context,
        set_run_context,
        set_tool_call_context,
    )
    from agent.system import build_system_prompt, filter_compatible_messages
    from agent.tools import tools
    from agent.tools.types import ToolSpec
    from agent.contracts import AgentCallbacks, TokenUsageInfo

logger = logging.getLogger(__name__)

MODEL_NAME = "gpt-5-mini"


def _to_provider_tool_name(internal_name: str) -> str:
    return internal_name.replace(".", "_")


def _build_tool_name_maps(
    tool_registry: Mapping[str, ToolSpec],
) -> tuple[dict[str, str], dict[str, str]]:
    internal_to_provider: dict[str, str] = {}
    provider_to_internal: dict[str, str] = {}

    for internal_name in tool_registry.keys():
        provider_name = _to_provider_tool_name(internal_name)
        internal_to_provider[internal_name] = provider_name
        provider_to_internal[provider_name] = internal_name

    return internal_to_provider, provider_to_internal


def _tool_definitions(
    tool_registry: Mapping[str, ToolSpec],
    internal_to_provider: Mapping[str, str],
) -> list[dict[str, Any]]:
    definitions: list[dict[str, Any]] = []
    for internal_name, tool in tool_registry.items():
        tool_def = tool.to_openai_tool()
        tool_def["function"]["name"] = internal_to_provider.get(
            internal_name, internal_name
        )
        definitions.append(tool_def)
    return definitions


def _supports_token_usage(callbacks: AgentCallbacks) -> bool:
    return hasattr(callbacks, "on_token_usage") and callable(
        getattr(callbacks, "on_token_usage")
    )


def _report_token_usage(
    callbacks: AgentCallbacks,
    messages: list[dict[str, Any]],
    context_window: int,
) -> None:
    if not _supports_token_usage(callbacks):
        return

    usage = estimate_messages_tokens(messages)
    logger.debug(
        "Token usage — input: %d, output: %d, total: %d / %d (%.1f%%)",
        usage.input,
        usage.output,
        usage.total,
        context_window,
        calculate_usage_percentage(usage.total, context_window),
    )
    callbacks.on_token_usage(
        TokenUsageInfo(
            input_tokens=usage.input,
            output_tokens=usage.output,
            total_tokens=usage.total,
            context_window=context_window,
            threshold=DEFAULT_THRESHOLD,
            percentage=calculate_usage_percentage(usage.total, context_window),
        )
    )


async def run_agent(
    user_message: str,
    conversation_history: list[dict[str, Any]],
    callbacks: AgentCallbacks,
    client: AsyncOpenAI,
    model_name: str = MODEL_NAME,
    run_id: str | None = None,
    actor: dict[str, str] | None = None,
    resource_context: dict[str, Any] | None = None,
    tool_registry: Mapping[str, ToolSpec] | None = None,
) -> list[dict[str, Any]]:
    logger.info(
        "Agent run started — run_id=%s, model=%s, history_len=%d",
        run_id,
        model_name,
        len(conversation_history),
    )

    model_limits = get_model_limits(model_name)
    active_tools = tool_registry or tools
    internal_to_provider, provider_to_internal = _build_tool_name_maps(active_tools)
    actor_context = actor or {}
    resource_context_data = resource_context or {}
    system_prompt = build_system_prompt(resource_context_data)

    run_token = None
    actor_token = None
    resource_token = None
    if run_id is not None:
        run_token, actor_token, resource_token = set_run_context(
            run_id, actor_context, resource_context_data
        )

    working_history = filter_compatible_messages(conversation_history)
    precheck_tokens = estimate_messages_tokens(
        [
            {"role": "system", "content": system_prompt},
            *working_history,
            {"role": "user", "content": user_message},
        ]
    )

    if is_over_threshold(precheck_tokens.total, model_limits.context_window):
        logger.warning(
            "Context over threshold (%d / %d tokens), compacting conversation…",
            precheck_tokens.total,
            model_limits.context_window,
        )
        working_history = await compact_conversation(working_history, client, model_name)

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
        *working_history,
        {"role": "user", "content": user_message},
    ]

    full_response = ""
    _report_token_usage(callbacks, messages, model_limits.context_window)

    try:
        iteration = 0
        while True:
            iteration += 1
            logger.debug("LLM call #%d — messages in context: %d", iteration, len(messages))

            stream = await client.chat.completions.create(
                model=model_name,
                messages=messages,
                tools=_tool_definitions(active_tools, internal_to_provider),
                tool_choice="auto",
                stream=True,
            )

            current_text = ""
            tool_calls_by_index: dict[int, dict[str, Any]] = {}

            async for chunk in stream:
                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta
                if delta is None:
                    continue

                if delta.content:
                    callbacks.on_token(delta.content)
                    current_text += delta.content
                    full_response += delta.content

                if not delta.tool_calls:
                    continue

                for tc_delta in delta.tool_calls:
                    index = tc_delta.index if tc_delta.index is not None else 0
                    if index not in tool_calls_by_index:
                        tool_calls_by_index[index] = {
                            "id": tc_delta.id or "",
                            "type": "function",
                            "function": {
                                "name": tc_delta.function.name if tc_delta.function else "",
                                "arguments": "",
                            },
                        }
                    else:
                        if tc_delta.id:
                            tool_calls_by_index[index]["id"] = tc_delta.id
                        if tc_delta.function and tc_delta.function.name:
                            tool_calls_by_index[index]["function"]["name"] += tc_delta.function.name

                    if tc_delta.function and tc_delta.function.arguments:
                        tool_calls_by_index[index]["function"]["arguments"] += tc_delta.function.arguments

            tool_calls_list = [
                tool_calls_by_index[idx] for idx in sorted(tool_calls_by_index.keys())
            ]

            for idx, tool_call in enumerate(tool_calls_list):
                if not tool_call["id"]:
                    tool_call["id"] = f"tool_call_{iteration}_{idx}"

            assistant_message: dict[str, Any] = {
                "role": "assistant",
                "content": current_text,
            }
            if tool_calls_list:
                assistant_message["tool_calls"] = tool_calls_list

            messages.append(assistant_message)
            _report_token_usage(callbacks, messages, model_limits.context_window)

            if not tool_calls_list:
                logger.debug("No tool calls returned — ending agent loop")
                break

            logger.info(
                "Tool calls requested (%d): %s",
                len(tool_calls_list),
                [tc["function"]["name"] for tc in tool_calls_list],
            )

            rejected = False
            for tc in tool_calls_list:
                provider_tool_name = tc["function"]["name"]
                tool_name = provider_to_internal.get(provider_tool_name, provider_tool_name)
                raw_args = tc["function"]["arguments"] or "{}"
                try:
                    parsed_args = json.loads(raw_args)
                    if not isinstance(parsed_args, dict):
                        parsed_args = {}
                except json.JSONDecodeError:
                    parsed_args = {}

                callback_args = dict(parsed_args)
                callback_args["_tool_call_id"] = tc["id"]

                logger.info(
                    "Tool call start — tool=%s, call_id=%s, args=%s",
                    tool_name,
                    tc["id"],
                    parsed_args,
                )
                callbacks.on_tool_call_start(tool_name, callback_args)

                logger.debug(
                    "Awaiting approval — tool=%s, call_id=%s", tool_name, tc["id"]
                )
                approved = await callbacks.on_tool_approval(tool_name, callback_args)
                if not approved:
                    logger.warning(
                        "Tool call rejected by user — tool=%s, call_id=%s",
                        tool_name,
                        tc["id"],
                    )
                    rejected = True
                    break

                logger.debug(
                    "Tool call approved — tool=%s, call_id=%s", tool_name, tc["id"]
                )
                tool_call_token = set_tool_call_context(tc["id"])
                try:
                    result = await execute_tool(
                        tool_name, parsed_args, tool_registry=active_tools
                    )
                finally:
                    reset_tool_call_context(tool_call_token)

                logger.info(
                    "Tool call end — tool=%s, call_id=%s, result_len=%d",
                    tool_name,
                    tc["id"],
                    len(result) if isinstance(result, str) else -1,
                )
                callbacks.on_tool_call_end(tool_name, result)

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": result,
                    }
                )
                _report_token_usage(callbacks, messages, model_limits.context_window)

            if rejected:
                break

        logger.info(
            "Agent run complete — run_id=%s, iterations=%d, response_len=%d",
            run_id,
            iteration,
            len(full_response),
        )
        callbacks.on_complete(full_response)
        return messages
    finally:
        if run_token is not None and actor_token is not None and resource_token is not None:
            reset_run_context(run_token, actor_token, resource_token)