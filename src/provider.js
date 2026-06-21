// P2P PROVIDER: a strong device that runs MedGemma inference for remote consumers.
// Starts a QVAC provider over the Hyperswarm DHT and prints its public key. Consumers
// connect with that key and delegate generation to this machine.
//   node src/provider.js                 (random identity)
//   node src/provider.js <64-hex-seed>   (stable identity across restarts)
import { startQVACProvider } from "@qvac/sdk";
import { AuditLog } from "./lib/audit.js";

const seed = process.env.QVAC_PROVIDER_SEED || process.argv[2];
if (seed) process.env.QVAC_HYPERSWARM_SEED = seed;

const audit = new AuditLog({ mode: "p2p-provider" });
console.log("🚀 Starting QVAC P2P provider (this strong device will run MedGemma for remote consumers)...");

const res = await startQVACProvider({});
audit.record("provider_start", { publicKey: res.publicKey, stableIdentity: !!seed });

console.log("\n✅ Provider online.");
console.log("🔑 Provider public key:\n   " + res.publicKey);
console.log("\n▶ On the consumer device run:\n   node src/consumer.js " + res.publicKey + "\n");
console.log("📡 Waiting for delegated inference requests... (Ctrl+C to stop)");

process.on("SIGINT", () => {
  audit.record("provider_stop", {});
  console.log("\n🛑 Provider stopped.");
  process.exit(0);
});
process.stdin.resume();
