import { z } from "zod";

const systemMessageSchema = z.object({
  role: z.literal("system"),
  text: z.string(),
});

// TODO: support attaching files, images, etc.
const userMessageSchema = z.object({
  id: z.string().optional(),
  role: z.literal("user"),
  text: z.string(),
});

const assistantMessageSchema = z.object({
  id: z.string().optional(),
  role: z.literal("assistant"),
  text: z.string().optional(),
  reasoning: z.string().optional(),
});

const toolMessageSchema = z.object({
  id: z.string().optional(),
  role: z.literal("tool"),
  text: z.string(),
  content: z.object({
    callId: z.string(),
    name: z.string(),
    args: z.any().optional(),
    result: z.any().optional(),
    error: z.any().optional(),
  }),
});

const messagesSchema = z.union([
  systemMessageSchema,
  userMessageSchema,
  assistantMessageSchema,
  toolMessageSchema,
]);

const messageChunkSchema = z.object({
  text: z.string().optional(),
  reasoning: z.string().optional(),
  toolCalls: z
    .array(
      z.object({
        id: z.string(),
        function: z.object({
          name: z.string(),
          arguments: z.any(),
        }),
      }),
    )
    .optional(),
});

export type SystemMessage = z.infer<typeof systemMessageSchema>;
export type UserMessage = z.infer<typeof userMessageSchema>;
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type ToolMessage = z.infer<typeof toolMessageSchema>;
export type Message = z.infer<typeof messagesSchema>;
export type MessageChunk = z.infer<typeof messageChunkSchema>;

const chatToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  input: z.any(), // TODO: should be valid json schema
});

const chatInputSchema = z.object({
  model: z.string(),
  messages: z.array(messagesSchema),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  stream: z.boolean().optional(),
  tools: z.array(chatToolSchema).optional(),
});

const chatUsageSchema = z.object({
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
});

const chatOutputSchema = z.object({
  messages: z.array(z.any()),
  usage: chatUsageSchema.optional(),
});

const embeddingInputSchema = z.object({
  model: z.string(),
  input: z.union([z.string(), z.array(z.string())]),
});

const embeddingOutputSchema = z.object({
  embeddings: z.array(z.array(z.number())),
});

const downloadOptionsSchema = z.union([z.object({ local: z.string() })]);

const imageSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

const imageInputSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  size: imageSizeSchema,
  aspectRatio: z.string().optional(), // TODO: enum?
  n: z.number().optional(),
  seed: z.number().optional(),
  outputFormat: z.string().optional(),
  guidanceScale: z.number().optional(),
  download: downloadOptionsSchema.optional(),
});

const imageOutputSchema = z.object({
  description: z.string().optional(),
  images: z.array(
    z.object({
      url: z.string().optional(),
      contentType: z.string().optional(),
      downloadPath: z.string().optional(),
    }),
  ),
});

const modelsInputSchema = z.object({});

const modelsOutputSchema = z.object({
  models: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
    }),
  ),
});

// TODO: options schema per provider/job type
const optionsSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

export const chatJobSchema = z.object({
  type: z.literal("chat"),
  provider: z.enum(["openrouter", "openai", "ollama"]),
  options: optionsSchema.optional(),
  input: chatInputSchema,
  output: chatOutputSchema.optional(),
});

export const imageJobSchema = z.object({
  type: z.literal("image"),
  provider: z.enum(["fal"]),
  options: optionsSchema.optional(),
  input: imageInputSchema,
  output: imageOutputSchema.optional(),
});

export const modelsJobSchema = z.object({
  type: z.literal("models"),
  provider: z.enum(["openai", "ollama"]),
  options: optionsSchema.optional(),
  input: modelsInputSchema.optional(),
  output: modelsOutputSchema.optional(),
});

export const embeddingJobSchema = z.object({
  type: z.literal("embedding"),
  provider: z.enum(["voyage", "ollama"]),
  options: optionsSchema.optional(),
  input: embeddingInputSchema,
  output: embeddingOutputSchema.optional(),
});

export const jobSchema = z.union([
  chatJobSchema,
  imageJobSchema,
  modelsJobSchema,
  embeddingJobSchema,
]);

export type ChatTool = z.infer<typeof chatToolSchema>;
export type Job = z.infer<typeof jobSchema>;
export type ImageJob = z.infer<typeof imageJobSchema>;
export type EmbeddingJob = z.infer<typeof embeddingJobSchema>;
export type ModelsJob = z.infer<typeof modelsJobSchema>;
export type ChatJob = z.infer<typeof chatJobSchema>;
export type Options = z.infer<typeof optionsSchema>;
