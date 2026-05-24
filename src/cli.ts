#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotEnv } from "dotenv";

import { collectGitDiff, type GitDiffOptions } from "./diff.js";
import { normalizeFindings, isSeverity } from "./findings.js";
import { formatFindings } from "./formatter.js";
import { HeuristicReviewer } from "./heuristic-reviewer.js";
import { OpenAiReviewer } from "./openai-reviewer.js";
import { parseUnifiedDiff } from "./diff.js";
import { redactSecrets } from "./redaction.js";
import type { OutputFormat, Reviewer, ReviewOptions } from "./types.js";

const version = "0.1.0";

export interface CliDependencies {
  collectDiff?: (options: GitDiffOptions) => Promise<string>;
  reviewer?: Reviewer;
  stdout?: (chunk: string) => void;
  stderr?: (chunk: string) => void;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}

export function parseCliArgs(args: string[]): ReviewOptions & { showHelp: boolean; showVersion: boolean } {
  const parsed: ReviewOptions & { showHelp: boolean; showVersion: boolean } = {
    staged: false,
    paths: [],
    format: "text",
    minSeverity: "low",
    showHelp: false,
    showVersion: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.showHelp = true;
      continue;
    }

    if (arg === "--version" || arg === "-v") {
      parsed.showVersion = true;
      continue;
    }

    if (arg === "--staged") {
      parsed.staged = true;
      continue;
    }

    if (arg === "--base") {
      parsed.base = readValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--path") {
      parsed.paths.push(readValue(args, index, arg));
      index += 1;
      continue;
    }

    if (arg === "--format") {
      parsed.format = parseFormat(readValue(args, index, arg));
      index += 1;
      continue;
    }

    if (arg === "--min-severity" || arg === "--severity") {
      parsed.minSeverity = parseSeverity(readValue(args, index, arg));
      index += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    parsed.paths.push(arg);
  }

  return parsed;
}

export async function runCli(args: string[] = process.argv.slice(2), dependencies: CliDependencies = {}): Promise<void> {
  const parsed = parseCliArgs(args);
  const stdout = dependencies.stdout ?? ((chunk: string) => process.stdout.write(chunk));
  const cwd = dependencies.cwd ?? process.cwd();

  if (parsed.showHelp) {
    stdout(helpText());
    return;
  }

  if (parsed.showVersion) {
    stdout(`${version}\n`);
    return;
  }

  if (!dependencies.env) {
    loadLocalEnv(cwd);
  }

  const env = dependencies.env ?? process.env;
  const collectDiff = dependencies.collectDiff ?? ((options: GitDiffOptions) => collectGitDiff(options, cwd));
  const rawDiff = await collectDiff({
    staged: parsed.staged,
    base: parsed.base,
    paths: parsed.paths
  });

  if (rawDiff.trim().length === 0) {
    stdout(formatFindings([], parsed.format));
    return;
  }

  const redactedDiff = redactSecrets(rawDiff);
  const parsedDiff = parseUnifiedDiff(rawDiff);
  const reviewer = dependencies.reviewer ?? createReviewer(env);
  const findings = normalizeFindings(
    await reviewer.review({
      rawDiff,
      redactedDiff,
      parsedDiff
    }),
    parsed.minSeverity
  );

  stdout(formatFindings(findings, parsed.format));
}

export function createReviewer(env: NodeJS.ProcessEnv): Reviewer {
  const apiKey = env.OPENAI_API_KEY;

  if (apiKey) {
    return new OpenAiReviewer({
      apiKey,
      model: env.OPENAI_MODEL || "gpt-5.5"
    });
  }

  return new HeuristicReviewer();
}

function loadLocalEnv(cwd: string): void {
  loadDotEnv({ path: resolve(cwd, ".env.local"), override: false, quiet: true });
  loadDotEnv({ path: resolve(cwd, ".env"), override: false, quiet: true });
}

function readValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
}

function parseFormat(value: string): OutputFormat {
  if (value === "text" || value === "json") {
    return value;
  }
  throw new Error("--format must be text or json");
}

function parseSeverity(value: string) {
  const normalized = value.toLowerCase();
  if (isSeverity(normalized)) {
    return normalized;
  }
  throw new Error("--min-severity must be critical, high, medium, or low");
}

function helpText(): string {
  return [
    "terminal-code-reviewer [options] [path...]",
    "",
    "Review local git diffs in the terminal.",
    "",
    "Options:",
    "      --staged                  Review staged changes",
    "      --base <ref>              Review changes against a base ref",
    "      --path <path>             Limit review to a path; repeatable",
    "      --format <text|json>      Output format",
    "      --min-severity <level>    critical, high, medium, or low",
    "  -h, --help                    Show help",
    "  -v, --version                 Show version",
    ""
  ].join("\n");
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : "";
if (entrypoint === fileURLToPath(import.meta.url)) {
  runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exitCode = 1;
  });
}
