import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { DiffFile, DiffHunk, ParsedDiff } from "./types.js";

const execFileAsync = promisify(execFile);

export interface GitDiffOptions {
  staged?: boolean;
  base?: string;
  paths?: string[];
}

export function buildDiffArgs(options: GitDiffOptions): string[] {
  const args = ["diff"];

  if (options.staged) {
    args.push("--cached");
  }

  args.push("--unified=80");

  if (options.base) {
    args.push(options.base);
  }

  if (options.paths && options.paths.length > 0) {
    args.push("--", ...options.paths);
  }

  return args;
}

export async function collectGitDiff(options: GitDiffOptions, cwd = process.cwd()): Promise<string> {
  const { stdout } = await execFileAsync("git", buildDiffArgs(options), {
    cwd,
    maxBuffer: 50 * 1024 * 1024
  });

  return stdout;
}

export function parseUnifiedDiff(diff: string): ParsedDiff {
  const files: DiffFile[] = [];
  let currentFile: DiffFile | undefined;
  let currentHunk: DiffHunk | undefined;
  let newLineNumber = 0;

  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) {
      currentFile = undefined;
      currentHunk = undefined;
      continue;
    }

    if (line.startsWith("+++ ")) {
      const path = normalizeDiffPath(line.slice(4));
      if (path !== "/dev/null") {
        currentFile = {
          path,
          hunks: []
        };
        files.push(currentFile);
      }
      continue;
    }

    const hunkMatch = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunkMatch && currentFile) {
      currentHunk = {
        oldStart: Number(hunkMatch[1]),
        newStart: Number(hunkMatch[2]),
        addedLines: []
      };
      currentFile.hunks.push(currentHunk);
      newLineNumber = currentHunk.newStart;
      continue;
    }

    if (!currentHunk) {
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      currentHunk.addedLines.push({
        lineNumber: newLineNumber,
        content: line.slice(1)
      });
      newLineNumber += 1;
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      continue;
    }

    newLineNumber += 1;
  }

  return { files };
}

function normalizeDiffPath(path: string): string {
  return path.replace(/^"|"$/g, "").replace(/^b\//, "").replace(/^a\//, "");
}
