import { describe, expect, test } from "vitest";

import { buildDiffArgs, parseUnifiedDiff } from "../src/diff.js";

describe("parseUnifiedDiff", () => {
  test("maps added lines to file paths and new-file line numbers", () => {
    const diff = [
      "diff --git a/src/app.ts b/src/app.ts",
      "index 1111111..2222222 100644",
      "--- a/src/app.ts",
      "+++ b/src/app.ts",
      "@@ -1,3 +1,4 @@",
      " import { run } from './run';",
      "-const timeout = 1000;",
      "+const timeout = 0;",
      "+console.log(process.env.OPENAI_API_KEY);",
      " run(timeout);"
    ].join("\n");

    const parsed = parseUnifiedDiff(diff);

    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0]?.path).toBe("src/app.ts");
    expect(parsed.files[0]?.hunks[0]?.addedLines).toEqual([
      {
        lineNumber: 2,
        content: "const timeout = 0;"
      },
      {
        lineNumber: 3,
        content: "console.log(process.env.OPENAI_API_KEY);"
      }
    ]);
  });
});

describe("buildDiffArgs", () => {
  test("builds staged, base, and path-filtered git diff arguments", () => {
    expect(
      buildDiffArgs({
        staged: true,
        base: "origin/main",
        paths: ["src", "package.json"]
      })
    ).toEqual(["diff", "--cached", "--unified=80", "origin/main", "--", "src", "package.json"]);
  });
});
