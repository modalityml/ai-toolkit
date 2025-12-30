import * as readline from "node:readline/promises";
import type { Agent } from "~/src/agent/agent";
import type { Message, UserMessage } from "~/src/job/schema";

function newId() {
  return String(Math.floor(Math.random() * 1_000_000_000));
}

export async function agentReplInput(): Promise<UserMessage> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const input = await rl.question("\nYou: ");
  rl.close();

  return { id: newId(), role: "user", text: input };
}

export async function inspectAgentStream(stream: AsyncIterable<any>) {
  const newMessages = [];
  for await (const event of stream) {
    if (event.type === "chunk") {
      if (event.chunk.reasoning) {
        process.stdout.write("\x1b[90m");
        process.stdout.write(event.chunk.reasoning);
      } else if (event.chunk.text) {
        process.stdout.write("\x1b[0m");
        process.stdout.write(event.chunk.text);
      }
    } else if (event.type === "tool") {
      process.stdout.write("\x1b[0m");
      if (event.tool.result) {
        console.log(
          `tool ${event.tool.name} with result: ${JSON.stringify(event.tool.result)}`,
        );
      } else {
        console.log(
          `tool ${event.tool.name} with arguments: ${JSON.stringify(event.tool.args)}`,
        );
      }
    } else if (event.type === "message") {
      newMessages.push(event.message);
    }
  }
  return newMessages;
}

export async function agentRepl(agent: Agent) {
  let allMessages: Message[] = [];
  while (true) {
    const userMessage = await agentReplInput();
    allMessages = allMessages.concat([userMessage]);
    const stream = agent.generate(allMessages, { maxSteps: 8 });

    const newMessages = await inspectAgentStream(stream);
    allMessages = allMessages.concat(newMessages);
    console.log();
  }
}
