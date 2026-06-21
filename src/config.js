// Central configuration. Model constants are imported from the QVAC SDK registry
// (downloaded + cached on first use via the QVAC P2P registry — no cloud API key).
import { GTE_LARGE_FP16, MEDGEMMA_4B_IT_Q4_1, VERBOSITY } from "@qvac/sdk";

// Embedding model for RAG retrieval — small (~670MB), always runs on-device.
export const EMBED_MODEL = GTE_LARGE_FP16;
export const EMBED_MODEL_NAME = "GTE_LARGE_FP16";

// Generation model — MedGemma 4B (medical instruction-tuned), ~2.56GB.
// Runs locally, or is delegated to a P2P provider for weak consumer devices.
export const GEN_MODEL = MEDGEMMA_4B_IT_Q4_1;
export const GEN_MODEL_NAME = "MEDGEMMA_4B_IT_Q4_1";

// MedGemma defaults to a 1024-token context, too small for RAG prompts (system +
// retrieved chunks + question). Raise it; quiet the engine logs; low temperature
// for factual medical answers.
export const GEN_MODEL_CONFIG = { ctx_size: 4096, verbosity: VERBOSITY.ERROR, temp: 0.3 };

export const WORKSPACE = "mededge-health";
export const CORPUS_DIR = "data/corpus";
export const LOG_DIR = "logs";
export const TOP_K = 4;

export const SYSTEM_PROMPT = [
  "You are MedEdge, an offline medical-information assistant running fully on-device.",
  "Answer the user's health question using ONLY the reference context provided below.",
  "If the context does not contain enough information, say so plainly and do not invent facts.",
  "Be concise and clear. This is general educational information, not a diagnosis.",
  "End with a one-line reminder to consult a qualified healthcare professional.",
].join(" ");
