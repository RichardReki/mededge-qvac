// LOCAL mode: fully on-device medical Q&A. Retrieval + MedGemma generation both run
// on this machine's GPU. Pass a question as args, or run the built-in demo set.
//   node src/ask.js
//   node src/ask.js "What lifestyle changes help lower blood pressure?"
import { createAssistant } from "./lib/assistant.js";

const DEMO_QUESTIONS = [
  "What lifestyle changes help manage high blood pressure?",
  "How is type 2 diabetes usually monitored, and what is a common first-line medication?",
  "What asthma symptoms mean someone should seek urgent care?",
];

const cli = process.argv.slice(2).join(" ").trim();
const questions = cli ? [cli] : DEMO_QUESTIONS;

const a = await createAssistant({ mode: "local" });
await a.warmup();
for (const q of questions) {
  console.log(`\n🩺 Q: ${q}\nA: `);
  await a.ask(q);
  console.log("\n");
}
await a.close();
process.exit(0);
