import { describe, expect, test, vi } from "vitest";

import { OpenAiReviewer } from "../src/openai-reviewer.js";

describe("OpenAiReviewer", () => {
  test("asks OpenAI for structured findings with the configured model and redacted diff", async () => {
    const create = vi.fn(async () => ({
      output_text: JSON.stringify({
        findings: [
          {
            file: "src/app.ts",
            line: 4,
            severity: "high",
            title: "Secret exposure",
            message: "A secret is exposed.",
            recommendation: "Remove the secret from the diff."
          }
        ]
      })
    }));
    const reviewer = new OpenAiReviewer({
      apiKey: "test-key",
      model: "gpt-5.5",
      client: {
        responses: {
          create
        }
      }
    });

    const findings = await reviewer.review({
      rawDiff: "OPENAI_API_KEY=sk-secret",
      redactedDiff: "OPENAI_API_KEY=[REDACTED]",
      parsedDiff: {
        files: []
      }
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.5",
        input: expect.stringContaining("OPENAI_API_KEY=[REDACTED]")
      })
    );
    expect(create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        input: expect.stringContaining("sk-secret")
      })
    );
    expect(findings).toEqual([
      {
        file: "src/app.ts",
        line: 4,
        severity: "high",
        title: "Secret exposure",
        message: "A secret is exposed.",
        recommendation: "Remove the secret from the diff."
      }
    ]);
  });
});
