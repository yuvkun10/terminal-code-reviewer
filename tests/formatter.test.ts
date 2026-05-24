import { describe, expect, test } from "vitest";

import { formatFindings } from "../src/formatter.js";
import type { ReviewFinding } from "../src/types.js";

const findings: ReviewFinding[] = [
  {
    file: "src/app.ts",
    line: 10,
    severity: "high",
    title: "Secret logged",
    message: "A secret may be written to logs.",
    recommendation: "Remove the logging statement."
  }
];

describe("formatFindings", () => {
  test("renders text findings with severity, location, message, and recommendation", () => {
    expect(formatFindings(findings, "text")).toContain(
      "[high] src/app.ts:10 Secret logged\n  A secret may be written to logs.\n  Recommendation: Remove the logging statement."
    );
  });

  test("renders stable JSON for machine consumers", () => {
    expect(JSON.parse(formatFindings(findings, "json"))).toEqual({
      findings,
      summary: {
        total: 1,
        bySeverity: {
          critical: 0,
          high: 1,
          medium: 0,
          low: 0
        }
      }
    });
  });
});
