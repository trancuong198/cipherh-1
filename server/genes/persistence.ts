/* Persistence layer for genes/governance state. Auto-detect backend: Postgres (DATABASE_URL) -> Notion (NOTION_TOKEN+NOTION_DATABASE_ID) -> file fallback (data/genes_state.json) */

import fs from "fs";
import path from "path";

let backend: "postgres" | "notion" | "file" | null = null;
let pgClient: any = null;
let notionClient: any = null;

const FILE_PATH = path.join(process.cwd(), "data", "genes_state.json");

async function initPersistence() {
  if (process.env.DATABASE_URL) {
    backend = "postgres";
    const { Client } = await import("pg");
    pgClient = new Client({ connectionString: process.env.DATABASE_URL });
    await pgClient.connect();
    await pgClient.query(`CREATE TABLE IF NOT EXISTS genes_kv (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT now());`);
    return;
  }

  if (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) {
    backend = "notion";
    const { Client } = await import("@notionhq/client");
    notionClient = new Client({ auth: process.env.NOTION_TOKEN });
    return;
  }

  backend = "file";
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify({ governance: {}, genes: {} }, null, 2));
}

async function loadKV(key: string): Promise<any | null> {
  if (backend === "postgres" && pgClient) {
    const res = await pgClient.query("SELECT value FROM genes_kv WHERE key = $1", [key]);
    if (res.rows[0]) return res.rows[0].value;
    return null;
  }

  if (backend === "notion" && notionClient) {
    // Minimal placeholder: Notion mapping requires DB schema; return null for now.
    return null;
  }

  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    const json = JSON.parse(raw);
    return json[key] ?? null;
  } catch (err) {
    console.error('[persistence] loadKV file error', err);
    return null;
  }
}

async function saveKV(key: string, value: any) {
  if (backend === "postgres" && pgClient) {
    await pgClient.query(`INSERT INTO genes_kv (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [key, value]);
    return;
  }

  if (backend === "notion" && notionClient) {
    // Placeholder: implement mapping to Notion DB if desired
    return;
  }

  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    const json = JSON.parse(raw);
    json[key] = value;
    fs.writeFileSync(FILE_PATH, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('[persistence] saveKV file error', err);
  }
}

export async function initGenesPersistence() {
  await initPersistence();
  console.info(`[persistence] backend=${backend}`);
}

export async function loadGovernanceState(): Promise<any> {
  return (await loadKV('governance')) ?? null;
}

export async function saveGovernanceState(state: any) {
  await saveKV('governance', state);
}

export async function loadGenesState(): Promise<any> {
  return (await loadKV('genes')) ?? null;
}

export async function saveGenesState(state: any) {
  await saveKV('genes', state);
}

export async function closePersistence() {
  if (pgClient) {
    try { await pgClient.end(); } catch (err) { /* ignore */ }
  }
}