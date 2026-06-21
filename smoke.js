// QVAC environment GO/NO-GO smoke test.
// Proves: @qvac/sdk loads a model, runs a local completion on this machine,
// streams tokens, and reports stats incl. backendDevice (cpu|gpu) + TTFT + tok/s.
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel } from "@qvac/sdk";

const started = Date.now();
console.log("[smoke] loading LLAMA_3_2_1B_INST_Q4_0 (downloads on first use, ~0.8GB)...");

let n = 0;
const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  onProgress: (p) => {
    // throttle: log first tick, then every 40th, to avoid flooding
    if (n++ % 40 === 0) console.log("[smoke] progress:", JSON.stringify(p));
  },
});
console.log(`[smoke] model loaded in ${((Date.now() - started) / 1000).toFixed(1)}s. modelId=${modelId}`);

const history = [{ role: "user", content: "In one sentence, what is edge AI?" }];
const result = completion({ modelId, history, stream: true });

process.stdout.write("[smoke] response: ");
for await (const token of result.tokenStream) process.stdout.write(token);
process.stdout.write("\n");

const final = await result.final;
const stats = final?.stats ?? (await result.stats);
console.log("[smoke] stats:", JSON.stringify(stats, null, 2));

await unloadModel({ modelId });
const gpu = stats?.backendDevice === "gpu";
console.log(`[smoke] ====== RESULT ======`);
console.log(`[smoke] backendDevice = ${stats?.backendDevice}  (GPU in use: ${gpu})`);
console.log(`[smoke] TTFT(ms) = ${stats?.timeToFirstToken}  |  tokens/sec = ${stats?.tokensPerSecond}`);
console.log(`[smoke] ✅ PASS — local QVAC inference works end-to-end on this machine.`);
process.exit(0);
