import type { ChatJob } from "~/src/job/schema";
import { createHTTPJob } from "~/src/job/http";
import {
  getApiKey,
  transformToolsToFunctions,
  transformUsageData,
  createStreamingGenerator,
} from "~/src/job/utils";

const BASE_URL = "https://openrouter.ai/api/v1";

export const runner = {
  chat: async (input: ChatJob["input"], options?: ChatJob["options"]) => {
    const apiKey = getApiKey(options, "OPENROUTER_API_KEY");

    const tools = transformToolsToFunctions(input.tools);

    const request = new Request(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        tools: tools,
        stream: input.stream,
      }),
    });

    return createHTTPJob(request, async (response: Response) => {
      if (input.stream) {
        return createStreamingGenerator(response, (chunk: any) => {
          const choice = chunk.choices[0];
          const delta = choice.delta;
          return {
            text: delta.content,
            toolCalls: delta.tool_calls,
            usage: transformUsageData(chunk.usage),
          };
        });
      }

      const data = await response.json();

      return {
        messages: [
          {
            role: data.choices[0].message.role,
            content: data.choices[0].message.content,
            tool_calls: data.choices[0].message.tool_calls,
          },
        ],
        usage: transformUsageData(data.usage),
      };
    });
  },
};
