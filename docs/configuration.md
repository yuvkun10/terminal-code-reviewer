# Configuration

## Environment

An OpenAI API key is needed only if you want model-backed review.

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```dotenv
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

Leave `OPENAI_API_KEY` blank or omit `.env.local` to keep review fully local with the
heuristic reviewer. `.env`, `.env.local`, and other `.env.*` files are ignored;
[`.env.example`](../.env.example) is the only env file intended for version control.

## CLI options

| Option | Description |
| --- | --- |
| `--staged` | Review staged changes with `git diff --cached`. |
| `--base <ref>` | Review changes against a base ref such as `origin/main`. |
| `--path <path>` | Limit review to a path. Repeat for multiple paths. Positional paths are also accepted. |
| `--format <text\|json>` | Choose human-readable text or stable JSON output. |
| `--min-severity <level>` | Filter output to `critical`, `high`, `medium`, or `low` and above. |
| `-h`, `--help` | Show CLI help. |
| `-v`, `--version` | Show the CLI version. |
