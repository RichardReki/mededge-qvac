// Flattens all logs/audit-*.jsonl files into a single CSV for the evidence package.
//   node tools/export-csv.js  ->  logs/audit-summary.csv
import fs from "node:fs";
import path from "node:path";

const LOG_DIR = "logs";
const OUT = path.join(LOG_DIR, "audit-summary.csv");

const COLUMNS = [
  "ts", "mode", "event", "device", "model", "role", "delegated",
  "loadMs", "ingestMs", "searchMs",
  "promptTokens", "generatedTokens", "ttftMs", "tokensPerSec", "backendDevice",
  "ragTopScore", "topScore", "hits", "chunksProcessed", "query",
];

const rows = [];
for (const f of fs.readdirSync(LOG_DIR).filter((f) => f.startsWith("audit-") && f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(LOG_DIR, f), "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch { /* skip malformed */ }
  }
}

const esc = (v) => {
  if (v === undefined || v === null) return "";
  const s = String(v).replace(/"/g, '""').replace(/\r?\n/g, " ");
  return /[",]/.test(s) ? `"${s}"` : s;
};

const csv = [COLUMNS.join(",")]
  .concat(rows.map((r) => COLUMNS.map((c) => esc(r[c])).join(",")))
  .join("\n");

fs.writeFileSync(OUT, csv);
console.log(`Wrote ${rows.length} log events from ${LOG_DIR}/*.jsonl -> ${OUT}`);
