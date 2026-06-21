// Pre-caches the two models the app needs so the build/test loop isn't blocked
// on a 2.56GB download. Loads each into VRAM (validates it runs) then unloads.
import { loadModel, unloadModel, GTE_LARGE_FP16, MEDGEMMA_4B_IT_Q4_1 } from "@qvac/sdk";

const models = [
  ["GTE_LARGE_FP16 (embeddings)", GTE_LARGE_FP16],
  ["MEDGEMMA_4B_IT_Q4_1 (generation)", MEDGEMMA_4B_IT_Q4_1],
];

for (const [name, src] of models) {
  console.log(`[predownload] loading ${name} ...`);
  let n = 0;
  const id = await loadModel({
    modelSrc: src,
    onProgress: (p) => {
      if (n++ % 80 === 0) console.log(`[predownload] ${name}: ${(p.percentage ?? 0).toFixed(1)}%`);
    },
  });
  console.log(`[predownload] ${name} loaded ok (modelId=${id}); unloading.`);
  await unloadModel({ modelId: id });
}
console.log("[predownload] ✅ both models cached and verified loadable.");
process.exit(0);
