import type { Job } from "../src";
import { runner } from "~/src/job/runner";

const job: Job = {
  provider: "openrouter",
  type: "chat",
  input: {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", text: "You are a helpful assistant." },
      { role: "user", text: "Hi" },
    ],
  },
};

const output = await runner.run(job);

console.log(JSON.stringify(output, null, 2));

// const job = openrouter()
//   .chat()
//   .model("google/gemini-2.5-flash")
//   .messages([
//     system("You are a helpful assistant."),
//     user("write a 100 words story"),
//   ])
//   .temperature(0.7)
//   .maxTokens(100)
//   .stream();

// for await (const chunk of job.run()) {
//   process.stdout.write(text(chunk));
// }

// const weatherTool = tool("get_current_weather")
//   .description("Get the current weather in a given location")
//   .input(
//     z.object({
//       location: z.string(),
//       unit: z.enum(["celsius", "fahrenheit"]).optional(),
//     }),
//   );

// const job = openrouter()
//   .chat()
//   .model("google/gemini-2.5-flash")
//   .tool(weatherTool)
//   .messages([
//     {
//       role: "user",
//       content: "What's the weather like in Boston, Beijing, Tokyo today?",
//     },
//   ]);
// const result = await job.run();
// console.log(JSON.stringify(result, null, 2));
