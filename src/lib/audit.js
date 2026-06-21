// Structured, auditable performance log for the QVAC hackathon evidence package.
// Writes one JSON object per line (JSONL) capturing model loads/unloads and every
// inference's prompt/tokens/TTFT/tokens-per-sec/backendDevice. A companion exporter
// (tools/export-csv.js) flattens these to CSV. Nothing here ever calls a network API.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

export class AuditLog {
  constructor({ mode = "local", logDir = "logs", device } = {}) {
    this.runId = randomUUID();
    this.mode = mode;
    this.device = device ?? `${os.hostname()} (${os.platform()}/${os.arch()})`;
    fs.mkdirSync(logDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.file = path.join(logDir, `audit-${mode}-${stamp}.jsonl`);
    this.record("session_start", {
      app: "MedEdge",
      node: process.version,
      platform: `${os.platform()}/${os.arch()}`,
      cpuModel: os.cpus()?.[0]?.model,
      cpuCores: os.cpus()?.length,
      totalMemGB: Math.round(os.totalmem() / 1e9),
    });
  }

  record(event, fields = {}) {
    const row = {
      ts: new Date().toISOString(),
      runId: this.runId,
      mode: this.mode,
      device: this.device,
      event,
      ...fields,
    };
    fs.appendFileSync(this.file, JSON.stringify(row) + "\n");
    return row;
  }
}
