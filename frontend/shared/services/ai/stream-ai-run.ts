import type { ReqCreateAIRun } from "@/shared/services/generated/api";
import {
  streamInstance,
  type StreamEvent,
} from "@/shared/services/axios/custom-instance";

export type AiRunStreamEvent = StreamEvent;

type StreamAiRunOptions = {
  signal?: AbortSignal;
  onEvent?: (event: AiRunStreamEvent) => void | Promise<void>;
};

export async function streamAiRun(
  body: ReqCreateAIRun,
  options?: StreamAiRunOptions,
): Promise<void> {
  let eventCount = 0;

  await streamInstance({
    url: "/ai/runs",
    method: "POST",
    data: body,
    signal: options?.signal,
    onEvent: async (event) => {
      eventCount += 1;
      if (options?.onEvent) {
        await options.onEvent(event);
      }
    },
  });

  if (eventCount === 0) {
    throw new Error("No SSE events received from AI run");
  }
}
