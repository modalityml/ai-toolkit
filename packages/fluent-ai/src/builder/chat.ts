import { z } from "zod";
import { type ChatJob, type ChatTool, type Message } from "~/src/job/schema";

export class ChatBuilder<TProvider extends string = string> {
  private provider: TProvider;
  private options: any;
  private runner: any;
  private input: ChatJob["input"] = { model: "", messages: [] };

  constructor(provider: TProvider, options: any, runner: any, model: string) {
    this.provider = provider;
    this.options = options;
    this.runner = runner;
    this.input.model = model;
  }

  messages(messages: Message[]) {
    this.input.messages = messages;
    return this;
  }

  tool(tool: ChatTool) {
    if (!this.input.tools) {
      this.input.tools = [];
    }
    this.input.tools.push(tool);
    return this;
  }

  tools(tools: ChatTool[]) {
    if (!this.input.tools) {
      this.input.tools = [];
    }
    this.input.tools = this.input.tools.concat(tools);
    return this;
  }

  stream() {
    this.input.stream = true;
    return this;
  }

  build() {
    return {
      type: "chat" as const,
      provider: this.provider,
      options: this.options,
      input: this.input,
    };
  }

  run() {
    const job = this.build();
    return this.runner.chat(job.input, job.options);
  }
}

class ChatToolBuilder {
  private body: Partial<ChatTool> = {};

  constructor(name: string) {
    this.body.name = name;
  }

  description(desc: string): this {
    this.body.description = desc;
    return this;
  }

  input(schema: z.ZodObject<any>): ChatTool {
    this.body.input = z.toJSONSchema(schema);
    return this.body as ChatTool;
  }
}

export function tool(name: string) {
  return new ChatToolBuilder(name);
}
