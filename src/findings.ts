import { severities, type RawFinding, type ReviewFinding, type Severity } from "./types.js";

const severityScore: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export function normalizeFindings(rawFindings: RawFinding[], minSeverity: Severity = "low"): ReviewFinding[] {
  const threshold = severityScore[minSeverity];

  return rawFindings
    .map(toFinding)
    .filter((finding) => severityScore[finding.severity] >= threshold)
    .sort((left, right) => {
      const severityDelta = severityScore[right.severity] - severityScore[left.severity];
      if (severityDelta !== 0) {
        return severityDelta;
      }

      const fileDelta = left.file.localeCompare(right.file);
      if (fileDelta !== 0) {
        return fileDelta;
      }

      return left.line - right.line;
    });
}

export function isSeverity(value: string): value is Severity {
  return severities.includes(value as Severity);
}

export function severityRank(severity: Severity): number {
  return severityScore[severity];
}

function toFinding(raw: RawFinding): ReviewFinding {
  const title = readText(raw.title).trim() || "Review finding";
  const message = readText(raw.message).trim() || (title === "Review finding" ? "No details provided." : title);

  return {
    file: sanitizePath(readText(raw.file) || readText(raw.path) || "unknown"),
    line: normalizeLine(raw.line ?? raw.lineNumber),
    severity: normalizeSeverity(raw.severity),
    title,
    message,
    recommendation: readText(raw.recommendation).trim() || "No recommendation provided."
  };
}

function normalizeSeverity(value: unknown): Severity {
  const normalized = readText(value).toLowerCase();
  return isSeverity(normalized) ? normalized : "low";
}

function normalizeLine(value: unknown): number {
  const numberValue = typeof value === "number" ? value : Number(readText(value));
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 1;
}

function sanitizePath(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  const segments = normalized.split("/").filter((segment) => segment && segment !== "." && segment !== "..");
  return segments.join("/") || "unknown";
}

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}
