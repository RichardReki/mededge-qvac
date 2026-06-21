# Hardware & Environment (Evidence)

All inference in this project ran on the single consumer machine below. This qualifies
for the **General Purpose** track (≤32 GB RAM retail hardware) and is also entered in the
**Psy Models** track (MedGemma usage). No cluster, no cloud GPU, no private-cloud inference.

## Main device (inference host)

| Component | Spec |
|---|---|
| Machine | MSI laptop (hostname `MSI`) |
| OS | Windows 11 Home China, build 10.0.26200 (win32 / x64) |
| CPU | Intel® Core™ Ultra 9 275HX — 24 cores / 24 logical processors |
| RAM | 32 GB (31.7 GiB usable; `os.totalmem` ≈ 34.0 GB) |
| GPU | **NVIDIA GeForce RTX 5080 Laptop GPU** (16 GB GDDR7) |
| GPU driver | 32.0.15.9597 (NVIDIA), Vulkan driver build 595.97 |
| Inference backend | **Vulkan 1.4.329** (cross-platform GPU), via QVAC llama.cpp engine |
| Disk | C: 931 GB NVMe, ~349 GB free |
| Runtime | Node.js v24.17.0, npm 11.13.0 |
| SDK | @qvac/sdk 0.13.5 |

Vulkan device enumeration (`vulkaninfo --summary`):

```
deviceName = NVIDIA GeForce RTX 5080 Laptop GPU
deviceType = PHYSICAL_DEVICE_TYPE_DISCRETE_GPU
apiVersion = 1.4.329
driverName = NVIDIA
driverInfo = 595.97
```

Confirmed `backendDevice: "gpu"` on every inference in the audit logs (`logs/audit-*.jsonl`).

## Measured on-device performance (MedGemma-4B-it Q4_1, warm)

| Metric | Value |
|---|---|
| Time-to-first-token (warm) | 125–202 ms |
| Generation throughput (warm) | 59–79 tokens/sec |
| Embedding model load (GTE-large, cached) | ~4.3 s |
| Generation model load (MedGemma-4B, cached) | ~8.0 s |
| RAG ingest (10 docs → 19 chunks) | ~0.5 s |
| RAG vector search | 8–29 ms |

(First inference per process incurs a one-time ~5 s Vulkan shader-compilation cost; the
app runs a `warmup()` pass so measured demo questions reflect warm steady state. Both the
cold warmup row and warm rows are visible in the audit logs for full transparency.)

## Screenshots to attach for the submission/video
- `vulkaninfo --summary` output (GPU is a discrete Vulkan device)
- Windows Task Manager → Performance → GPU (shows GPU compute load during a query)
- `node --version` and `npm ls @qvac/sdk`
- A query running with the streamed answer + the audit log line it produced
