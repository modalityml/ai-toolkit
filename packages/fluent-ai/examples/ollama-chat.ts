import { ollama } from "../src";

const models = await ollama().models().run();

console.log(models);

const response = await ollama()
  .chat(models[0].id)
  .messages([
    {
      role: "user",
      text: "What is the capital of France?",
    },
  ])
  .run();

console.log(response);

const streamResponse = await ollama()
  .chat(models[0].id)
  .messages([
    {
      role: "user",
      text: "What is the capital of Spain?",
    },
  ])
  .stream()
  .run();

for await (const chunk of streamResponse) {
  if (chunk.message?.text) {
    process.stdout.write(chunk.message.text);
  }
}
