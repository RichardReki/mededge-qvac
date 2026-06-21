# MedEdge — Submission Checklist & Hand-off

Everything below the line is **done and verified**. What's left needs *your* accounts/camera:
push to GitHub, record a ≤5-min video, fill the DoraHacks form, join Discord.

Deadline: **2026-06-21 23:59 UTC** (= Beijing 2026-06-22 07:59).

---

## ✅ Already done (verified working)

- QVAC SDK integrated end-to-end; **all inference local or P2P-delegated, zero cloud AI** (`@qvac/sdk` 0.13.5).
- Local RAG + MedGemma-4B Q&A — grounded answers, **GPU (Vulkan)**, warm **71–114 tok/s**, TTFT ~140 ms.
- **P2P delegated inference proven** (provider + consumer, two-sided logs, `fallbackToLocal=false`).
- Structured **audit logs** (`logs/*.jsonl` + `logs/audit-summary.csv`): prompt, tokens, TTFT, tokens/sec, `backendDevice`, model loads.
- **Apache-2.0** license, README, hardware spec, remote-API disclosure (`evidence/`).
- Local git repo committed (`git log` → MedEdge initial commit).

---

## 1. Push to GitHub (~3 min)

Create a **public** repo and push. With the GitHub CLI:

```powershell
cd f:\Hacks\qvac-edge
gh repo create mededge-qvac --public --source=. --remote=origin --description "Private offline medical RAG + P2P delegated inference on QVAC" --push
```

Or manually: create an empty public repo on github.com, then:

```powershell
cd f:\Hacks\qvac-edge
git remote add origin https://github.com/<you>/mededge-qvac.git
git push -u origin main
```

Confirm the repo is **public** and shows the `LICENSE` (Apache-2.0).

## 2. Record the demo video (≤5 min, YouTube **unlisted**)

Keep it technical — judges weight **verifiable results over UI**. Show the audit-log numbers
matching what's on screen (this is what the artifact-consistency review checks).

**Scene 1 — what & why (30s).** "MedEdge: a fully offline, private medical Q&A assistant on QVAC.
Health data is sensitive; nothing leaves my device. Powered by MedGemma running on my own GPU."

**Scene 2 — local mode (90s).**
```powershell
npm run ask
```
Show: models load, the 3 questions stream grounded answers (blood pressure → DASH/sodium;
type-2 diabetes → HbA1c + metformin; asthma → red flags). Then open the newest
`logs/audit-local-*.jsonl` and point at one line: `backendDevice:"gpu"`, `ttftMs`, `tokensPerSec`,
`promptTokens/generatedTokens`. Say the numbers out loud — they must match the video.

**Scene 3 — privacy proof (20s).** Open `evidence/remote-apis.json` → `remoteApiCalls: []`.
Optionally turn on airplane mode and ask one more question to show it still works.

**Scene 4 — P2P delegated inference (110s).** Two terminals side by side.
```powershell
# Terminal 1 (provider — the strong device):
npm run provider
# copy the printed public key, then Terminal 2 (consumer — the weak device):
npm run consumer -- <public-key>
```
Narrate: "Retrieval runs locally on the weak device; the heavy MedGemma generation is
**delegated over the Hyperswarm DHT** to the provider." Show the consumer answering, and the
**provider terminal printing `kind=completion` request-lifecycle lines** — that's the provider
doing the work. Then show the consumer log line: `delegated:true`, `executedOn:"provider (P2P
delegated)"`, `fallbackAllowed:false`.
> Tip: start the provider, wait ~30 s for the DHT to warm, then run the consumer. If the first
> connect errors `PEER_CONNECTION_FAILED` (cold DHT), just run the consumer again — it connects
> on retry. (Or set `$env:QVAC_FALLBACK="true"` for a guaranteed-complete demo, but then the log
> may show a local fallback.)

**Scene 5 — close (15s).** "Apache-2.0, open source, reproducible. Private edge AI, today."

Upload to YouTube as **Unlisted**, copy the link.

## 3. DoraHacks submission form

Create the project at the hackathon page → "Submit BUIDL", and use:

- **Product name:** MedEdge
- **Description:** Fully offline, privacy-preserving medical Q&A on the edge. Local RAG (GTE-large
  embeddings + QVAC built-in vector store) grounds answers from a medical corpus; MedGemma-4B
  generates them on-device via the QVAC SDK. Adds P2P delegated inference so a weak device runs
  retrieval locally and offloads the heavy generation to a stronger peer over Hyperswarm. Zero
  cloud AI calls; runs in airplane mode after first model download.
- **Track(s):** Psy Models (QVAC MedGemma) **and** General Purpose (≤32 GB consumer hardware)
- **Repo:** `<your GitHub URL>` (public, Apache-2.0)
- **Demo video:** `<YouTube unlisted URL>`
- **Reproducibility & hardware:** see `README.md` + `evidence/hardware.md` (RTX 5080 Laptop, Vulkan 1.4, Node 24.17, Win 11)
- **Structured remote-API file:** `evidence/remote-apis.json` (zero remote AI calls)
- **Auditable performance log:** `logs/audit-*.jsonl` + `logs/audit-summary.csv`
- **Prior work disclosure:** None — all code, corpus, and logs were created during the hackathon
  build period. Third-party: `@qvac/sdk`, and the open models MedGemma-4B and GTE-large (downloaded
  via the QVAC registry).
- **Build-in-Public hashtag (optional):** e.g. `#MedEdgeQVAC` (tag `@QVAC` on X to earn the social bonus)
- **Team / location:** (fill in)

## 4. Join Discord (mandatory)

Join the Tether Dev Discord (`discord.com/invite/tetherdev`) — it's a non-negotiable rule and also
where the community/social vote happens.

---

## Why this passes the 3-stage verification

- **Stage 1 (static analysis):** clean repo, Apache-2.0, all inference via `@qvac/sdk`, no cloud SDK/keys.
- **Stage 2 (artifact consistency):** the audit logs, the video, and `evidence/hardware.md` all agree —
  same model (`MEDGEMMA_4B_IT_Q4_1`), same `backendDevice:"gpu"`, same TTFT/tok-s ranges; the provider
  session log corroborates the consumer's `delegated:true` lines.
- **Stage 3 (live test):** `npm install && npm run ask` reproduces local mode; `npm run provider` +
  `npm run consumer` reproduces P2P. First run pulls the models once via the QVAC registry.
