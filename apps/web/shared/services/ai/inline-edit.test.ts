import { afterEach, describe, expect, it, vi } from "vitest";

import { requestInlineEdit } from "./inline-edit";
import type { InlineTransformResult } from "./inline-edit";

const encoder = new TextEncoder();

function sseStream(payloads: readonly string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const payload of payloads) {
        controller.enqueue(encoder.encode(payload));
      }
      controller.close();
    },
  });
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("requestInlineEdit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the edit proposal from a completed streaming AI-agent run", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        sseStream([
          'event: assistant.delta\ndata: {"content":"draft"}\n\n',
          'event: run.completed\ndata: {"response":{"type":"edit_proposal","original":"hello","proposed":"hello world","summary":"expanded greeting","confidence":0.91},"usage":{"input_tokens":10,"output_tokens":12,"cost_usd":0.01}}\n\n',
        ]),
        {
          headers: { "content-type": "text/event-stream" },
          status: 200,
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = (await requestInlineEdit({
      action: "longer",
      context: "Greeting note",
      selectedText: "hello",
      workspaceId: "workspace-1",
      noteId: "note-1",
      expectedVersion: 7,
    })) as InlineTransformResult;

    expect(result.replacement).toBe("hello world");
    expect(result.confidence).toBe(0.91);
    expect(result.metadata?.summary).toBe("expanded greeting");
    expect(result.metadata?.original).toBe("hello");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the non-streaming AI-agent endpoint when streaming fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 502,
          statusText: "Bad Gateway",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          replacement: "short text",
          confidence: 0.82,
          usage: { input_tokens: 8, output_tokens: 4, cost_usd: 0.003 },
          metadata: { provider: "test-provider", model: "test-model" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = (await requestInlineEdit({
      action: "shorter",
      context: "Long note",
      selectedText: "a very long paragraph",
      workspaceId: "workspace-1",
    })) as InlineTransformResult;

    expect(result.replacement).toBe("short text");
    expect(result.confidence).toBe(0.82);
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls[0]).toContain("/api/v1/ai/inline-edit/runs");
    expect(urls[1]).toContain("/api/v1/ai/inline-edit");
    expect(
      JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body)),
    ).toMatchObject({
      command: "/shorten",
      mode: "inline_transform",
      selected_text: "a very long paragraph",
    });
  });

  it("routes slash-command aliases into the AI-agent payload contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        sseStream([
          'event: run.completed\ndata: {"response":{"type":"edit_proposal","original":"Long sentence","proposed":"Short sentence","summary":"shortened","confidence":0.88}}\n\n',
        ]),
        {
          headers: { "content-type": "text/event-stream" },
          status: 200,
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestInlineEdit({
      action: "shorter",
      context: "Editor context",
      selectedText: "Long sentence",
      workspaceId: "workspace-1",
      noteId: "note-1",
      expectedVersion: 2,
    });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String((init as RequestInit).body));

    expect(body.action).toBe("shorter");
    expect(body.command).toBe("/shorten");
    expect(body.mode).toBe("inline_transform");
    expect(body.selected_text).toBe("Long sentence");
    expect(body.context_blocks).toEqual([{ type: "editor_context", content: "Editor context" }]);
    expect(body.resource_context).toEqual({
      workspace_id: "workspace-1",
      note_id: "note-1",
      expected_version: 2,
    });
  });
});
