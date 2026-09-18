# Terminal Code Reviewer

Terminal Code Reviewer is a TypeScript CLI for reviewing local git diffs before they
reach a pull request. It reads `git diff`, redacts common secret patterns, and reviews
the added lines with deterministic local heuristics or, when an API key is set, the
OpenAI Responses API. Version 0.1.0.

## Installation

Requirements: Node.js 20.19 or newer and Git on `PATH`.

```bash
npm ci
npm run build
```

Optional environment variables for model-backed review: `OPENAI_API_KEY`,
`OPENAI_MODEL`. Copy `.env.example` to `.env.local` to set them; without a key the CLI
stays fully local. See [docs/configuration.md](docs/configuration.md).

## Usage

From this repository after `npm run build`:

```bash
node dist/cli.js --help
node dist/cli.js
node dist/cli.js --staged
node dist/cli.js --base origin/main
node dist/cli.js --path src --path package.json
node dist/cli.js --format json
node dist/cli.js --min-severity high
```

After installing or linking the package, the same CLI is available as:

```bash
terminal-code-reviewer --staged --min-severity high
```

All options are listed in [docs/configuration.md](docs/configuration.md). There is no
npm publish workflow in this repository.

## Project structure

```text
├── src
│   ├── cli.ts
│   ├── diff.ts
│   ├── redaction.ts
│   ├── heuristic-reviewer.ts
│   ├── openai-reviewer.ts
│   ├── findings.ts
│   ├── formatter.ts
│   └── index.ts
├── tests
├── docs
│   ├── architecture.md
│   └── archive
├── .env.example
├── eslint.config.js
├── package.json
└── tsconfig.json
```

How the pieces fit together: [docs/architecture.md](docs/architecture.md).

## Coding style

ESLint runs the recommended JavaScript and typescript-eslint rule sets, with unused
arguments allowed only when prefixed `_` (`eslint.config.js`). TypeScript runs in
`strict` mode. CI runs both on pushes to `main` and on pull requests. There is no
formatter or commit convention configured.

```bash
npm run lint
npm run typecheck
```

## Test

```bash
npm test
```

Vitest covers the CLI, diff parsing, redaction, the heuristic and OpenAI reviewers,
finding normalization and output formatting. CI also runs
`npm audit --audit-level=moderate` and `npm outdated`.

## Documentation

- [docs/README.md](docs/README.md): index of all docs
- [docs/architecture.md](docs/architecture.md): flow, modules, privacy and security
- [docs/overview.md](docs/overview.md): audience and use cases
- [docs/configuration.md](docs/configuration.md): environment and CLI options

## License

MIT. See [LICENSE](LICENSE).
