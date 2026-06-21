// P2P CONSUMER: simulates a weak edge device. Retrieval (GTE embeddings + vector
// search) runs locally on-device; the heavy MedGemma generation is delegated to the
// provider over the Hyperswarm DHT. fallbackToLocal keeps it working if the peer drops.
//   node src/consumer.js <provider-public-key>
import { close } from "@qvac/sdk";
import { createAssistant } from "./lib/assistant.js";

const providerPublicKey = process.argv[2];
if (!providerPublicKey) {
  console.error("Usage: node src/consumer.js <provider-public-key>");
  console.error("Start a provider first with: node src/provider.js");
  process.exit(1);
}

const DEMO_QUESTIONS = [
  "What lifestyle changes help manage high blood pressure?",
  "What are red-flag asthma symptoms that need urgent care?",
];

// fallbackToLocal defaults FALSE for honesty: with no local fallback, the consumer can
// only answer if the provider genuinely served the inference over P2P — so a logged
// "delegated: true" is always true. Set QVAC_FALLBACK=true for demo robustness (allows
// silent local fallback if the peer is briefly unreachable).
const fallbackToLocal = process.env.QVAC_FALLBACK === "true";
console.log(`📱 Consumer: retrieval runs locally; MedGemma generation is delegated to the provider over P2P. (fallbackToLocal=${fallbackToLocal})`);
const a = await createAssistant({
  mode: "p2p-consumer",
  delegate: { providerPublicKey, timeout: 60_000, fallbackToLocal },
});
await a.warmup();
for (const q of DEMO_QUESTIONS) {
  console.log(`\n🩺 Q: ${q}\nA: `);
  await a.ask(q);
  console.log("\n");
}
await a.close();
// Gracefully close the SDK / DHT connection so the provider sees a clean disconnect
// (avoids a cosmetic ETIMEDOUT on the provider after the answers are already delivered).
await close();
// Give the peer a moment to receive the close, then exit (DHT keeps the loop alive).
await new Promise((r) => setTimeout(r, 800));
process.exit(0);
