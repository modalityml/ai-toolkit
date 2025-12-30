import { test, expect, mock } from "bun:test";
import {
  jobSchema,
  openrouter,
  openai,
  fal,
  type Job,
  voyage,
} from "~/src/index";
import { Runner } from "~/src/job/runner";

test("chat job", () => {
  const job: Job = {
    provider: "openrouter",
    type: "chat",
    input: {
      model: "test-model",
      messages: [{ role: "user", text: "hello" }],
    },
  };

  expect(() => {
    jobSchema.parse(job);
  }).not.toThrow();

  expect(job).toEqual(
    openrouter()
      .chat("test-model")
      .messages([{ role: "user", text: "hello" }])
      .build(),
  );
});

test("image job", () => {
  const job: Job = {
    provider: "fal",
    type: "image",
    input: {
      model: "fal-ai/bytedance/seedream/v4/text-to-image",
      prompt: "A beautiful sunset over the mountains",
      size: { width: 1280, height: 1280 },
    },
  };
  expect(() => {
    jobSchema.parse(job);
  }).not.toThrow();

  expect(job).toEqual(
    fal()
      .image("fal-ai/bytedance/seedream/v4/text-to-image")
      .prompt("A beautiful sunset over the mountains")
      .size({ width: 1280, height: 1280 })
      .build(),
  );
});

test("embedding job", () => {
  const job: Job = {
    provider: "voyage",
    type: "embedding",
    input: {
      model: "voyage-3-lite",
      input: "This is a test",
    },
  };

  expect(() => {
    jobSchema.parse(job);
  }).not.toThrow();

  expect(job).toEqual(
    voyage().embedding("voyage-3-lite").input("This is a test").build(),
  );
});

test("models job", () => {
  const job: Job = {
    type: "models",
    provider: "openai",
  };

  expect(() => {
    jobSchema.parse(job);
  }).not.toThrow();

  expect(job).toEqual(openai().models().build());
});

test("runner", () => {
  const chatRunner = mock(() => "test");
  const runner = new Runner({ openrouter: { chat: chatRunner } });

  const job: Job = {
    provider: "openrouter",
    type: "chat",
    input: {
      model: "test-model",
      messages: [{ role: "user", text: "hello" }],
    },
  };

  expect(runner.run(job)).toBe("test");
  expect(chatRunner).toHaveBeenCalledWith(job.input, undefined);
});
