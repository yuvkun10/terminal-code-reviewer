export const severities = ["critical", "high", "medium", "low"] as const;

export type Severity = (typeof severities)[number];
export type OutputFormat = "text" | "json";

export interface ReviewFinding {
  file: string;
  line: number;
  severity: Severity;
  title: string;
  message: string;
  recommendation: string;
}

export interface RawFinding {
  file?: unknown;
  path?: unknown;
  line?: unknown;
  lineNumber?: unknown;
  severity?: unknown;
  title?: unknown;
  message?: unknown;
  recommendation?: unknown;
}

export interface AddedLine {
  lineNumber: number;
  content: string;
}

export interface DiffHunk {
  oldStart: number;
  newStart: number;
  addedLines: AddedLine[];
}

export interface DiffFile {
  path: string;
  hunks: DiffHunk[];
}

export interface ParsedDiff {
  files: DiffFile[];
}

export interface ReviewOptions {
  staged: boolean;
  base?: string;
  paths: string[];
  format: OutputFormat;
  minSeverity: Severity;
}

export interface ReviewContext {
  rawDiff: string;
  redactedDiff: string;
  parsedDiff: ParsedDiff;
}

export interface Reviewer {
  review(context: ReviewContext): Promise<ReviewFinding[]>;
}

export interface FindingSummary {
  total: number;
  bySeverity: Record<Severity, number>;
}
