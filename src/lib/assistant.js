// MedEdge assistant core. Builds a fully-local RAG pipeline (GTE embeddings +
// built-in QVAC vector store) and answers with MedGemma. The generation model can
// optionally be delegated to a P2P provider (Hyperswarm DHT) so a weak consumer
// device does retrieval on-device and offloads only the heavy generation.
import fs from "node:fs";
import path from "node:path";
import {
  loadModel,
  unloadModel,
  completion,
  ragIngest,
  ragSearch,
  ragDeleteWorkspace,
  ragCloseWorkspace,
} from "@qvac/sdk";
import {
  EMBED_MODEL,
  EMBED_MODEL_NAME,
  GEN_MODEL,
  GEN_MODEL_NAME,
  GEN_MODEL_CONFIG,
  WORKSPACE,
  CORPUS_DIR,
  TOP_K,
  SYSTEM_PROMPT,
} from "../config.js";
import { AuditLog } from "./audit.js";

const throttle = (label) => {
  let n = 0;
  return (p) => {
    if (n++ % 80 === 0) console.log(`  ↓ ${label}: ${(p.percentage ?? 0).toFixed(1)}%`);
  };
};

export async function createAssistant({ mode = "local", delegate = null } = {}) {
  const audit = new AuditLog({ mode });
  // Honest provenance for every record: where generation actually runs, and whether a
  // silent local fallback was even permitted (false => a "delegated" run is genuine).
  const executedOn = delegate ? "provider (P2P delegated)" : "local GPU";
  const fallbackAllowed = delegate ? (delegate.fallbackToLocal ?? false) : null;
  console.log(`\n=== MedEdge starting (mode=${mode}${delegate ? ", generation delegated via P2P" : ""}) ===`);

  // 1) Embedding model — ALWAYS local. Retrieval stays on-device even for P2P consumers.
  let t = performance.now();
  const embedId = await loadModel({ modelSrc: EMBED_MODEL, onProgress: throttle(EMBED_MODEL_NAME) });
  audit.record("model_load", {
    model: EMBED_MODEL_NAME,
    modelId: embedId,
    role: "embedding",
    delegated: false,
    loadMs: Math.round(performance.now() - t),
  });
  console.log(`✓ embedding model loaded locally (${EMBED_MODEL_NAME})`);

  // 2) Generation model — local, or delegated to a P2P provider.
  t = performance.now();
  const genId = await loadModel({
    modelSrc: GEN_MODEL,
    modelConfig: GEN_MODEL_CONFIG,
    onProgress: throttle(GEN_MODEL_NAME),
    ...(delegate ? { delegate } : {}),
  });
  audit.record("model_load", {
    model: GEN_MODEL_NAME,
    modelId: genId,
    role: "generation",
    delegated: !!delegate,
    executedOn,
    fallbackAllowed,
    loadMs: Math.round(performance.now() - t),
  });
  console.log(`✓ generation model ${delegate ? "registered (delegated to provider)" : "loaded locally"} (${GEN_MODEL_NAME})`);

  // 3) Ingest the local corpus into a fresh vector store (built-in, no external DB).
  try {
    await ragDeleteWorkspace({ workspace: WORKSPACE });
  } catch {
    /* workspace did not exist — fine */
  }
  const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".md")).sort();
  const documents = files.map((f) => fs.readFileSync(path.join(CORPUS_DIR, f), "utf8"));
  t = performance.now();
  const ing = await ragIngest({
    modelId: embedId,
    workspace: WORKSPACE,
    documents,
    chunk: true,
    chunkOpts: { chunkSize: 512, chunkOverlap: 64 },
  });
  const chunks = Array.isArray(ing?.processed) ? ing.processed.length : (ing?.processed ?? documents.length);
  audit.record("rag_ingest", {
    workspace: WORKSPACE,
    files,
    docCount: documents.length,
    chunksProcessed: chunks,
    ingestMs: Math.round(performance.now() - t),
  });
  console.log(`✓ ingested ${documents.length} documents (${chunks} chunks) into '${WORKSPACE}'`);

  async function ask(query, { event = "inference", silent = false } = {}) {
    // Retrieve (on-device)
    let ts = performance.now();
    const hits = await ragSearch({ modelId: embedId, workspace: WORKSPACE, query, topK: TOP_K });
    audit.record("rag_search", {
      query,
      topK: TOP_K,
      hits: hits.length,
      topScore: hits[0]?.score ?? null,
      searchMs: Math.round(performance.now() - ts),
    });

    const context = hits.map((h, i) => `[${i + 1}] ${h.content}`).join("\n\n");
    const userMsg = `${SYSTEM_PROMPT}\n\n## Reference context\n${context}\n\n## Question\n${query}\n\n## Answer (use ONLY the reference context above):`;

    // Generate (local or delegated)
    const run = completion({ modelId: genId, history: [{ role: "user", content: userMsg }], stream: true });
    let answer = "";
    for await (const tok of run.tokenStream) {
      answer += tok;
      if (!silent) process.stdout.write(tok);
    }
    const stats = (await run.final)?.stats ?? (await run.stats);
    audit.record(event, {
      model: GEN_MODEL_NAME,
      modelId: genId,
      delegated: !!delegate,
      executedOn,
      fallbackAllowed,
      query,
      promptChars: userMsg.length,
      promptTokens: stats?.promptTokens ?? null,
      generatedTokens: stats?.generatedTokens ?? null,
      ttftMs: stats?.timeToFirstToken ?? null,
      tokensPerSec: stats?.tokensPerSecond ?? null,
      backendDevice: stats?.backendDevice ?? null,
      ragTopScore: hits[0]?.score ?? null,
      answerPreview: answer.slice(0, 240),
    });
    return { answer, stats, hits };
  }

  async function warmup() {
    // First Vulkan inference compiles GPU shaders (one-time cost). Run a throwaway
    // generation so the measured demo questions reflect warm steady-state.
    console.log("• warming up generation model (first GPU call compiles Vulkan shaders)...");
    await ask("Reply with the single word READY.", { event: "warmup", silent: true });
    console.log("✓ warm.\n");
  }

  async function close() {
    try { await ragCloseWorkspace({ workspace: WORKSPACE, deleteOnClose: true }); } catch {}
    try { await unloadModel({ modelId: genId }); } catch {}
    try { await unloadModel({ modelId: embedId }); } catch {}
    audit.record("session_close", {});
    console.log(`\n✓ session closed. Audit log: ${audit.file}`);
  }

  return { ask, warmup, close, audit, embedId, genId };
}
