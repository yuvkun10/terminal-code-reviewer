import { describe, expect, test } from "vitest";

import { normalizeFindings } from "../src/findings.js";

describe("normalizeFindings", () => {
  test("normalizes, sorts, and filters structured findings by severity threshold", () => {
    const findings = normalizeFindings(
      [
        {
          file: "src/b.ts",
          line: 20,
          severity: "medium",
          title: "Medium issue",
          recommendation: "Handle this."
        },
        {
          file: "../outside.ts",
          line: -1,
          severity: "critical",
          title: "",
          recommendation: ""
        },
        {
          file: "src/a.ts",
          line: 5,
          severity: "LOW",
          title: "Low issue",
          recommendation: "Consider this."
        }
      ],
      "medium"
    );

    expect(findings).toEqual([
      {
        file: "outside.ts",
        line: 1,
        severity: "critical",
        title: "Review finding",
        message: "No details provided.",
        recommendation: "No recommendation provided."
      },
      {
        file: "src/b.ts",
        line: 20,
        severity: "medium",
        title: "Medium issue",
        message: "Medium issue",
        recommendation: "Handle this."
      }
    ]);
  });
});
