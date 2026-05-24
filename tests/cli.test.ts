import { describe, expect, test, vi } from "vitest";

import { parseCliArgs, runCli } from "../src/cli.js";
import type { Reviewer } from "../src/types.js";

describe("parseCliArgs", () => {
  test("parses staged, base, paths, format, and minimum severity", () => {
    expect(
      parseCliArgs([
        "--staged",
        "--base",
        "origin/main",
        "--path",
        "src",
        "--path",
        "tests",
        "--format",
        "json",
        "--min-severity",
        "high"
      ])
    ).toMatchObject({
      staged: true,
      base: "origin/main",
      paths: ["src", "tests"],
      format: "json",
      minSeverity: "high"
    });
  });
});

describe("runCli", () => {
  test("uses an injected reviewer and writes JSON output", async () => {
    const reviewer: Reviewer = {
      review: vi.fn(async () => [
        {
          file: "src/app.ts",
          line: 2,
          severity: "medium",
          title: "Avoid console logging",
          message: "Console logging was added.",
          recommendation: "Use a structured logger."
        }
      ])
    };
    const stdout = vi.fn();

    await runCli(["--format", "json"], {
      collectDiff: async () => "diff --git a/src/app.ts b/src/app.ts\n",
      reviewer,
      stdout,
      stderr: vi.fn(),
      env: {}
    });

    expect(reviewer.review).toHaveBeenCalledWith(
      expect.objectContaining({
        rawDiff: "diff --git a/src/app.ts b/src/app.ts\n"
      })
    );
    expect(JSON.parse(stdout.mock.calls.join(""))).toMatchObject({
      findings: [
        {
          file: "src/app.ts",
          line: 2,
          severity: "medium"
        }
      ]
    });
  });
});
