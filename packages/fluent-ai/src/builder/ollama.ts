import type { Options } from "~/src/job/schema";
import { ChatBuilder } from "~/src/builder/chat";
import { ModelsBuilder } from "~/src/builder/models";
import { EmbeddingBuilder } from "~/src/builder/embedding";
import { runner } from "~/src/job/ollama";

export function ollama(options?: Options) {
  return {
    chat(model: string) {
      return new ChatBuilder("ollama" as const, options, runner, model);
    },
    models() {
      return new ModelsBuilder("ollama" as const, options, runner);
    },
    embedding(model: string) {
      return new EmbeddingBuilder("ollama" as const, options, runner, model);
    },
  };
}
