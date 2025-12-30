import type { ChatTool, MessageChunk } from "~/src/job/schema";

export function getApiKey(
  options: { apiKey?: string } | undefined,
  envVarName: string,
): string | undefined {
  return options?.apiKey || process.env[envVarName];
}

export function transformToolsToFunctions(tools?: ChatTool[]) {
  return tools?.map((tool: ChatTool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input,
    },
  }));
}

export function transformUsageData(usage?: any) {
  return usage
    ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      }
    : undefined;
}

export async function* createStreamingGenerator(
  response: Response,
  convertChunk: (chunk: any) => MessageChunk,
) {
  const decoder = new TextDecoder("utf-8");
  const reader = response.body!.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const decoded = decoder.decode(value, { stream: true });
    const lines = decoded.split("\n");
    for (const line of lines) {
      if (line.startsWith(":")) {
        continue;
      }

      let chunk = line.trim();
      if (chunk.startsWith("data: ")) {
        chunk = chunk.replace("data: ", "").trim();
      }

      if (chunk === "[DONE]") {
        return;
      }

      if (chunk) {
        const parsed = JSON.parse(chunk); // let parse error throw
        yield convertChunk(parsed);
      }
    }
  }
}
