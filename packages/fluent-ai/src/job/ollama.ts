import type {
  ChatJob,
  ModelsJob,
  EmbeddingJob,
  Message,
  ChatTool,
} from "~/src/job/schema";
import { createHTTPJob } from "~/src/job/http";
import { createStreamingGenerator } from "~/src/job/utils";

const DEFAULT_BASE_URL = "http://localhost:11434";

function getBaseUrl(options?: ChatJob["options"]): string {
  return options?.baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL;
}

function convertMessages(messages: Message[]) {
  let result = [];

  for (const message of messages) {
    if (message.role === "tool") {
      result.push({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: message.content.callId,
            type: "function",
            function: {
              name: message.content.name,
              arguments: message.content.args,
            },
          },
        ],
      });

      if (message.content.result) {
        result.push({
          role: "tool",
          tool_call_id: message.content.callId,
          content: JSON.stringify(message.content.result),
        });
      } else if (message.content.error) {
        result.push({
          role: "tool",
          tool_call_id: message.content.callId,
          content: JSON.stringify(message.content.error),
        });
      }
    } else {
      result.push({ role: message.role, content: message.text });
    }
  }

  return result;
}

function convertTools(tools?: ChatTool[]) {
  return tools?.map((tool: ChatTool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input,
    },
  }));
}

interface OllamaChunk {
  model: string;
  createdAt: string;
  message: {
    role: string;
    content: string;
    thinking: string;
    tool_calls?: {
      id: string;
      function: {
        index: number;
        name: string;
        arguments: any;
      };
    }[];
  };
  done: boolean;
  done_reason?: "stop";
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

function convertChunk(chunk: OllamaChunk) {
  return {
    text: chunk.message.content,
    reasoning: chunk.message.thinking,
    toolCalls: chunk.message.tool_calls,
  };
}

export const runner = {
  chat: async (input: ChatJob["input"], options?: ChatJob["options"]) => {
    const baseUrl = getBaseUrl(options);
    const tools = convertTools(input.tools);
    const messages = convertMessages(input.messages);

    const request = new Request(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        messages: messages,
        tools: tools,
        temperature: input.temperature,
        stream: input.stream ?? false,
      }),
    });

    return createHTTPJob(request, async (response: Response) => {
      if (input.stream) {
        return createStreamingGenerator(response, convertChunk);
      }

      const data = await response.json();

      return {
        messages: [
          {
            role: data.message.role,
            content: data.message.content,
            tool_calls: data.message.tool_calls,
          },
        ],
        usage: data.prompt_eval_count
          ? {
              promptTokens: data.prompt_eval_count || 0,
              completionTokens: data.eval_count || 0,
              totalTokens:
                (data.prompt_eval_count || 0) + (data.eval_count || 0),
            }
          : undefined,
      };
    });
  },

  models: async (
    input?: ModelsJob["input"],
    options?: ModelsJob["options"],
  ) => {
    const baseUrl = getBaseUrl(options);

    const request = new Request(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return createHTTPJob(request, async (response: Response) => {
      const data = await response.json();

      return data.models.map((model: any) => ({
        id: model.name,
        name: model.name,
      }));
    });
  },

  embedding: async (
    input: EmbeddingJob["input"],
    options?: EmbeddingJob["options"],
  ) => {
    const baseUrl = getBaseUrl(options);

    const request = new Request(`${baseUrl}/api/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        input: input.input,
      }),
    });

    return createHTTPJob(request, async (response: Response) => {
      const data = await response.json();

      return {
        embeddings: data.embeddings,
      };
    });
  },
};
