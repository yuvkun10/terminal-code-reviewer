# AGENTS.md

Terminal Code Reviewer is a TypeScript CLI that reviews local git diffs with deterministic heuristics or, when a key is set, the OpenAI Responses API, after redacting common secret patterns.

## Setup

Node.js 20.19 or newer and Git on `PATH`.

```bash
npm ci
npm run build
```

Optional variables for model backed review: `OPENAI_API_KEY`, `OPENAI_MODEL`. Copy `.env.example` to `.env.local` to set them. See [docs/configuration.md](docs/configuration.md).

## Commands

```bash
npm run build      # tsc -p tsconfig.json
npm run typecheck  # tsc -p tsconfig.json --noEmit
npm run lint       # eslint "src/**/*.ts" "tests/**/*.ts"
npm test           # vitest run
npm audit --audit-level=moderate
npm outdated
node dist/cli.js --staged --min-severity high
```

## Project structure

- `src/cli.ts`: entry and options.
- `src/diff.ts`: git diff reading and parsing.
- `src/redaction.ts`: secret redaction before any review.
- `src/heuristic-reviewer.ts`, `src/openai-reviewer.ts`: reviewers.
- `src/findings.ts`, `src/formatter.ts`: normalization and output.
- `tests/`: Vitest suites.

Details are in [docs/architecture.md](docs/architecture.md).

## Conventions

- TypeScript `strict`. ESLint recommended JavaScript and `typescript-eslint` rules; unused arguments only with a `_` prefix.
- No formatter or commit convention is enforced. Do not add attribution trailers.

## Testing

Before a PR run audit, outdated, lint, typecheck, test and build. CI runs the same.

## Safety

- Redaction must run before any diff text reaches a model. Do not weaken it.
- Never commit `.env` or `.env.local` files or API keys.

## More

- [docs/README.md](docs/README.md): docs index
- [docs/architecture.md](docs/architecture.md): flow, privacy and security
