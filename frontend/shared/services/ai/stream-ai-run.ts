import Cookies from "js-cookie";
import type { ReqCreateAIRun } from "@/shared/services/generated/api";

export type AiRunStreamEvent = {
  event: string;
  payload: unknown;
};

type StreamAiRunOptions = {
  signal?: AbortSignal;
  onEvent?: (event: AiRunStreamEvent) => void | Promise<void>;
};

function parseEventBlock(block: string): AiRunStreamEvent | null {
  const lines = block.split("\n").map((line) => line.trimEnd());
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  const rawData = dataLines.join("\n");
  try {
    return { event: eventName, payload: JSON.parse(rawData) };
  } catch {
    return { event: eventName, payload: rawData };
  }
}

export async function streamAiRun(
  body: ReqCreateAIRun,
  options?: StreamAiRunOptions,
): Promise<void> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"
  ).replace(/\/$/, "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };

  const accessToken = Cookies.get("access_token");
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${baseUrl}/ai/runs`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Request failed with status ${response.status}`,
    );
  }

  if (!response.body) {
    throw new Error("Stream response body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventCount = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    for (const chunk of chunks) {
      const parsed = parseEventBlock(chunk);
      if (!parsed) {
        continue;
      }

      eventCount += 1;

      if (options?.onEvent) {
        await options.onEvent(parsed);
      }
    }
  }

  if (buffer.trim().length > 0) {
    const parsed = parseEventBlock(buffer);
    if (parsed) {
      eventCount += 1;
      if (options?.onEvent) {
        await options.onEvent(parsed);
      }
    }
  }

  if (eventCount === 0) {
    throw new Error("No SSE events received from AI run");
  }
}
