# Audience and use cases

Terminal Code Reviewer is built for developers who prefer terminal-first workflows,
maintainers who want a lightweight second pass before review, and teams that need
machine-readable self-review output without sending every change to a hosted code-review
product.

## Use cases

- Run a quick self-review before committing working-tree changes.
- Review staged changes in a pre-commit or pre-push workflow.
- Check a branch against `origin/main` before opening a pull request.
- Limit review to risky areas such as `src/`, config files, or package manifests.
- Emit JSON for scripts that fail on high-severity findings or attach results to CI logs.
