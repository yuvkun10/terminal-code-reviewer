import { describe, expect, test } from "vitest";

import { redactSecrets } from "../src/redaction.js";

describe("redactSecrets", () => {
  test("redacts env assignments, bearer tokens, and OpenAI-style keys", () => {
    const openAiStyleKey = `sk-proj-${"abcdefghijklmnopqrstuvwxyz1234567890"}`;
    const input = [
      `+OPENAI_API_KEY=${openAiStyleKey}`,
      "+Authorization: Bearer secret-token-value",
      "+const password = \"plain-text\";",
      "+const publicName = \"terminal-code-reviewer\";"
    ].join("\n");

    const redacted = redactSecrets(input);

    expect(redacted).toContain("OPENAI_API_KEY=[REDACTED]");
    expect(redacted).toContain("Authorization: Bearer [REDACTED]");
    expect(redacted).toContain("password = [REDACTED]");
    expect(redacted).toContain("publicName = \"terminal-code-reviewer\"");
    expect(redacted).not.toContain(openAiStyleKey);
    expect(redacted).not.toContain("secret-token-value");
    expect(redacted).not.toContain("plain-text");
  });
});
