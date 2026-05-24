import { severities, type FindingSummary, type OutputFormat, type ReviewFinding, type Severity } from "./types.js";

export function formatFindings(findings: ReviewFinding[], format: OutputFormat): string {
  if (format === "json") {
    return `${JSON.stringify({ findings, summary: summarizeFindings(findings) }, null, 2)}\n`;
  }

  if (findings.length === 0) {
    return "No findings.\n";
  }

  return `${findings
    .map((finding) =>
      [
        `[${finding.severity}] ${finding.file}:${finding.line} ${finding.title}`,
        `  ${finding.message}`,
        `  Recommendation: ${finding.recommendation}`
      ].join("\n")
    )
    .join("\n\n")}\n`;
}

export function summarizeFindings(findings: ReviewFinding[]): FindingSummary {
  const bySeverity = Object.fromEntries(severities.map((severity) => [severity, 0])) as Record<Severity, number>;

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
  }

  return {
    total: findings.length,
    bySeverity
  };
}
