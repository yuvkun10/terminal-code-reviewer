import OpenAI from "openai";

import { normalizeFindings } from "./findings.js";
import type { RawFinding, ReviewContext, Reviewer } from "./types.js";

interface OpenAiClient {
  responses: {
    create(params: Record<string, unknown>): Promise<{
      output_text?: string | null;
    }>;
  };
}

export interface OpenAiReviewerOptions {
  apiKey: string;
  model?: string;
  client?: OpenAiClient;
}

export class OpenAiReviewer implements Reviewer {
  private readonly client: OpenAiClient;
  private readonly model: string;

  constructor(options: OpenAiReviewerOptions) {
    this.model = options.model ?? "gpt-5.5";
    this.client = options.client ?? (new OpenAI({ apiKey: options.apiKey }) as unknown as OpenAiClient);
  }

  async review(context: ReviewContext): Promise<ReturnType<typeof normalizeFindings>> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: [
        "You are a senior code reviewer.",
        "Review only the provided git diff.",
        "Return concise, actionable findings. Do not include praise or summaries.",
        "Use severity critical, high, medium, or low.",
        "Report only issues with a concrete file and line in the new version."
      ].join(" "),
      input: buildReviewPrompt(context.redactedDiff),
      text: {
        format: {
          type: "json_schema",
          name: "terminal_code_review_findings",
          strict: true,
          schema: findingsSchema
        }
      }
    });

    return normalizeFindings(readFindings(response.output_text));
  }
}

function buildReviewPrompt(redactedDiff: string): string {
  return [
    "Review this redacted git diff and return JSON matching the requested schema.",
    "Every finding must include file, line, severity, title, message, and recommendation.",
    "Diff:",
    redactedDiff
  ].join("\n\n");
}

function readFindings(outputText: string | null | undefined): RawFinding[] {
  if (!outputText) {
    return [];
  }

  try {
    const parsed = JSON.parse(outputText) as { findings?: unknown };
    return Array.isArray(parsed.findings) ? (parsed.findings as RawFinding[]) : [];
  } catch {
    return [];
  }
}

const findingsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          file: {
            type: "string"
          },
          line: {
            type: "integer",
            minimum: 1
          },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"]
          },
          title: {
            type: "string"
          },
          message: {
            type: "string"
          },
          recommendation: {
            type: "string"
          }
        },
        required: ["file", "line", "severity", "title", "message", "recommendation"]
      }
    }
  },
  required: ["findings"]
};
