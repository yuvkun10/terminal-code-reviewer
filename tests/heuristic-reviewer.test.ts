import { describe, expect, test } from "vitest";

import { parseUnifiedDiff } from "../src/diff.js";
import { HeuristicReviewer } from "../src/heuristic-reviewer.js";

describe("HeuristicReviewer", () => {
  test("flags logged secrets but allows ordinary env configuration reads", async () => {
    const diff = [
      "diff --git a/src/app.ts b/src/app.ts",
      "--- a/src/app.ts",
      "+++ b/src/app.ts",
      "@@ -1,1 +1,3 @@",
      "+const apiKey = env.OPENAI_API_KEY;",
      "+console.log(process.env.OPENAI_API_KEY);",
      "+test.only('focused', () => {});",
      "+const match = /x/.exec(value);"
    ].join("\n");

    const reviewer = new HeuristicReviewer();
    const findings = await reviewer.review({
      rawDiff: diff,
      redactedDiff: diff,
      parsedDiff: parseUnifiedDiff(diff)
    });

    expect(findings).toEqual([
      expect.objectContaining({
        line: 2,
        severity: "critical",
        title: "Secret exposure risk"
      }),
      expect.objectContaining({
        line: 3,
        severity: "high",
        title: "Focused test committed"
      }),
      expect.objectContaining({
        line: 2,
        severity: "medium",
        title: "Console logging added"
      })
    ]);
  });
});
