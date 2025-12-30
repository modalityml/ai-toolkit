import { ollama } from "../src";

const result = await ollama()
  .embedding("embeddinggemma")
  .input(["Why is the sky blue?", "Why is the grass green?"])
  .run();

console.log(result.embeddings);
