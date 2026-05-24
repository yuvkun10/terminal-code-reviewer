import { normalizeFindings } from "./findings.js";
import type { RawFinding, ReviewContext, Reviewer } from "./types.js";

interface HeuristicRule {
  matches: (line: string) => boolean;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  recommendation: string;
}

const rules: HeuristicRule[] = [
  {
    matches: (line) => secretValuePattern.test(line) || loggedSecretPattern.test(line),
    severity: "critical",
    title: "Secret exposure risk",
    message: "The added line appears to expose or log a secret value.",
    recommendation: "Keep secrets in environment configuration and avoid logging or committing secret material."
  },
  {
    matches: (line) => /\bconsole\.(log|debug|info|warn|error)\s*\(/.test(line),
    severity: "medium",
    title: "Console logging added",
    message: "The diff adds console logging that can leak data or add noise in production.",
    recommendation: "Use the application's structured logger or remove the logging statement before release."
  },
  {
    matches: (line) => /\b(eval|Function)\s*\(/.test(line),
    severity: "high",
    title: "Dynamic code execution",
    message: "The added line uses dynamic code execution.",
    recommendation: "Replace dynamic execution with explicit parsing or dispatch logic."
  },
  {
    matches: (line) => /(^|[^\w.])(?:exec|execSync)\s*\(/.test(line),
    severity: "high",
    title: "Shell command execution",
    message: "The added line executes a shell command, which can become command injection when inputs are not controlled.",
    recommendation: "Use execFile/spawn with argument arrays and validate every user-controlled input."
  },
  {
    matches: (line) => /\b(describe|it|test)\.only\s*\(/.test(line),
    severity: "high",
    title: "Focused test committed",
    message: "A focused test would skip the rest of the suite in CI.",
    recommendation: "Remove .only before committing."
  },
  {
    matches: (line) => /\bcatch\s*\([^)]*\)\s*\{\s*\}/.test(line),
    severity: "medium",
    title: "Empty catch block",
    message: "An empty catch block hides failures and makes debugging harder.",
    recommendation: "Handle the error explicitly or rethrow with useful context."
  },
  {
    matches: (line) => /eslint-disable|ts-ignore|@ts-expect-error/.test(line),
    severity: "low",
    title: "Static analysis suppression",
    message: "The diff suppresses a static analysis or type-checking signal.",
    recommendation: "Document why the suppression is needed or fix the underlying issue."
  }
];

const secretValuePattern =
  /\b(?:OPENAI_API_KEY|[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD|PASSWD|PRIVATE[_-]?KEY)[A-Z0-9_]*)\s*=\s*["']?(?:sk-[A-Za-z0-9_-]{16,}|[A-Za-z0-9_+=/-]{16,})|\b(?:apiKey|api_key|token|secret|password|privateKey|private_key)\b\s*[:=]\s*["'`](?!\[REDACTED])[A-Za-z0-9_./+=-]{8,}["'`]/;
const loggedSecretPattern =
  /\bconsole\.(?:log|debug|info|warn|error)\s*\([^)]*(?:process\.env\.[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)|OPENAI_API_KEY|API[_-]?KEY|TOKEN|SECRET|PASSWORD)/i;

export class HeuristicReviewer implements Reviewer {
  async review(context: ReviewContext): Promise<ReturnType<typeof normalizeFindings>> {
    const findings: RawFinding[] = [];

    for (const file of context.parsedDiff.files) {
      for (const hunk of file.hunks) {
        for (const addedLine of hunk.addedLines) {
          for (const rule of rules) {
            if (rule.matches(addedLine.content)) {
              findings.push({
                file: file.path,
                line: addedLine.lineNumber,
                severity: rule.severity,
                title: rule.title,
                message: rule.message,
                recommendation: rule.recommendation
              });
            }
          }
        }
      }
    }

    return normalizeFindings(findings);
  }
}
