import { z } from "zod";
import {
  agentToolSchema,
  type AgentToolBuilder,
  type AgentTool,
} from "~/src/agent/tool";
import type {
  Message,
  ToolMessage,
  MessageChunk,
  AssistantMessage,
} from "~/src/job/schema";
import type { ChatBuilder } from "~/src/builder/chat";

export const agentSchema = z.object({
  name: z.string(),
  instructions: z.union([z.string(), z.function({ output: z.string() })]),
  tools: z.array(agentToolSchema),
});

interface ChunkEvent {
  type: "chunk";
  chunk: {
    text?: string;
    reasoning?: string;
  };
}

interface ToolEvent {
  type: "tool";
  tool: {
    name: string;
    args: any;
    result?: any;
    error?: any;
  };
}

interface MessageEvent {
  type: "message";
  message: Message;
}

export interface AgentGenerateOptions {
  maxSteps: number;
}

export class Agent<TContext = any> {
  private body: Omit<z.infer<typeof agentSchema>, "tools"> & {
    tools: AgentTool<TContext>[];
  };
  private builder?: ChatBuilder;

  constructor(name: string) {
    this.body = { name, tools: [], instructions: "" };
  }

  model(builder: ChatBuilder) {
    this.builder = builder;
    return this;
  }

  instructions(createAgentInstructions: () => string) {
    this.body.instructions = createAgentInstructions;
    return this;
  }

  tool(tool: AgentToolBuilder<any, any, TContext>) {
    this.body.tools.push(tool.build());
    return this;
  }

  generate = async function* (
    this: Agent<TContext>,
    initialMessages: Message[],
    options: AgentGenerateOptions,
    context?: TContext,
  ) {
    const body = agentSchema.parse(this.body);

    let shouldFinish = false;
    let newMessages: Message[] = [];
    for (let iteration = 0; iteration < options.maxSteps; iteration++) {
      if (shouldFinish) {
        break;
      }

      const instructions =
        typeof body.instructions === "function"
          ? body.instructions() // TODO: more context
          : body.instructions;
      const systemMessage = { role: "system", text: instructions };
      const messages = ([systemMessage] as Message[]).concat(
        initialMessages,
        newMessages,
      );
      const tools = body.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input: z.toJSONSchema(tool.input),
      }));
      const result = await this.builder!.messages(messages)
        .tools(tools)
        .stream()
        .run();

      let newAssistantMessage: AssistantMessage = {
        role: "assistant",
        text: "",
        reasoning: "",
      };

      for await (const chunk of result as AsyncIterable<MessageChunk>) {
        if (chunk.toolCalls) {
          // existing assistant message chunked out before tool call
          if (newAssistantMessage.text || newAssistantMessage.reasoning) {
            yield {
              type: "message",
              message: newAssistantMessage,
            } as MessageEvent;
            newMessages.push(newAssistantMessage);
            newAssistantMessage = {
              role: "assistant",
              text: "",
              reasoning: "",
            };
          }

          const toolCall = chunk.toolCalls[0];
          const { name, arguments: args } = toolCall.function;
          const agentTool = body.tools.find((t) => t.name === name);
          if (!agentTool) {
            throw new Error(`Unknown tool: ${name}`);
          }

          yield { type: "tool", tool: { name, args } };

          let result = null;
          let error = null;
          try {
            result = await agentTool.execute(args, context!);
          } catch (err) {
            error = (err as Error).message;
          }

          yield {
            type: "tool",
            tool: { name, args, result, error },
          } as ToolEvent;

          const newMessage: ToolMessage = {
            role: "tool",
            text: "",
            content: {
              callId: toolCall.id,
              name: name,
              args: args,
              result: result,
              error: error,
            },
          };

          yield { type: "message", message: newMessage } as MessageEvent;
          newMessages.push(newMessage);
          shouldFinish = false;
        } else if (chunk.text || chunk.reasoning) {
          yield {
            type: "chunk",
            chunk: {
              text: chunk.text,
              reasoning: chunk.reasoning,
            },
          } as ChunkEvent;

          if (chunk.text) {
            newAssistantMessage.text += chunk.text;
          }
          if (chunk.reasoning) {
            newAssistantMessage.reasoning += chunk.reasoning;
          }
          shouldFinish = true;
        }
      }

      if (newAssistantMessage.text || newAssistantMessage.reasoning) {
        yield { type: "message", message: newAssistantMessage } as MessageEvent;
        newMessages.push(newAssistantMessage);
      }
    }
  };
}

export function agent<TContext = any>(name: string) {
  return new Agent<TContext>(name);
}
