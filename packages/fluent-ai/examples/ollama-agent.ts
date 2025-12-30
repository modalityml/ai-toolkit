import z from "zod";
import { agent, agentTool, inspectAgentStream, ollama } from "~/src/index";

const retrieveContext = async (args: { query: string }) => {
  await Bun.sleep(500); // Simulate latency

  return {
    context:
      "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower from 1887 to 1889.",
  };
};

const retrieveContextTool = agentTool("retrieve_context")
  .description("Retrieve information to help answer a query.")
  .input(
    z.object({
      query: z.string().describe("The query to retrieve context for."),
    }),
  )
  .execute(retrieveContext);

const chatAgent = agent("chat-agent")
  .model(ollama().chat("qwen3:1.7b"))
  .tool(retrieveContextTool)
  .instructions(
    () => `You have access to a tool that retrieves context.
Use the tool to help answer user queries.`,
  );

const stream = chatAgent.generate(
  [
    {
      id: "1",
      role: "user",
      text: "Tell me about the Eiffel Tower.",
    },
  ],
  { maxSteps: 8 },
);

await inspectAgentStream(stream);
