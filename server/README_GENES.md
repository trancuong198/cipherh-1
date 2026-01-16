# Symbiosis Genes Persistence

This file documents persistence options for the symbiosis genes and governance state.

Supported backends (auto-detect order):
- Postgres (preferred): set `DATABASE_URL` to a Postgres connection string.
- Notion (optional): set `NOTION_TOKEN` and `NOTION_DATABASE_ID`.
- File fallback: `data/genes_state.json` (dev only, not recommended for production).

Environment variables:
- DATABASE_URL - Postgres connection string (e.g. postgres://user:pass@host:5432/db)
- NOTION_TOKEN - Notion integration token (if using Notion)
- NOTION_DATABASE_ID - Notion database id for storing state (optional)
- SYMBIOSIS_UNLOCK_KEY - dev unlock key to allow unlocking Symbiosis_Lock (optional)

Testing restart preservation (local):
1. Start server on branch `feature/genes-persistence`.
2. Observe logs: `[persistence] backend=...` and `[governance] state restored from persistence` on subsequent restarts.
3. Change a governance state (e.g., blockAction) and stop server. Restart and verify the blocked action remains.

Notes:
- Do not store secrets in repo. Set env vars in your Render/GitHub Secrets.
- File fallback may be lost on redeploy; use Postgres for production.
