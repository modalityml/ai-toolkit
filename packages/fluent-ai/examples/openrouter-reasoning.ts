import { openrouter } from "~/src/index";

const stream = await openrouter()
  .chat("deepseek/deepseek-r1")
  .messages([
    {
      role: "user",
      text: "How would you build the world's tallest skyscraper?",
    },
  ])
  .stream()
  .run();

for await (const chunk of stream) {
  console.log(JSON.stringify(chunk, null, 2));
}
