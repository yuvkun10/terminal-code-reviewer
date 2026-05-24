# Terminal Code Reviewer

Terminal Code Reviewer is a TypeScript CLI that reviews local git diffs from the terminal. It uses OpenAI when `OPENAI_API_KEY` is available and falls back to deterministic local heuristics when it is not.

## Features

- Review unstaged changes, staged changes, or changes from a base ref.
- Filter review scope with one or more `--path` values.
- Emit human-readable text or stable JSON.
- Filter findings by severity.
- Redact common env values, bearer tokens, and secret-looking values before model review.
- Produce structured findings with file, line, severity, message, and recommendation.

## Usage

Install dependencies and build the CLI:

```bash
npm ci
npm run build
```

Review the current working tree:

```bash
node dist/cli.js
```

Review staged changes against a base branch and only include high-severity findings or above:

```bash
node dist/cli.js --staged --base origin/main --min-severity high
```

Review specific paths and emit JSON:

```bash
node dist/cli.js --path src --path package.json --format json
```

## OpenAI

Set `OPENAI_API_KEY` to use the model reviewer. The default model is `gpt-5.5`; override it with `OPENAI_MODEL` when needed.

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
```

When no API key is present, the CLI uses a deterministic local reviewer that flags risky patterns such as secret exposure, console logging, unsafe shell execution, disabled tests, and broad `catch` blocks.

## Development

```bash
npm run lint
npm test
npm run build
```
