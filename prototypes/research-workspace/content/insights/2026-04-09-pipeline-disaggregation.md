# Pipeline Disaggregation: Separating Prefill and Decode to Kill Bubbles

LLM inference has two fundamentally different computational phases. **Prefill** processes the entire input prompt in parallel — it's compute-bound, GPU-hungry, and finishes fast. **Decode** generates tokens one at a time autoregressively — it's memory-bandwidth-bound, latency-sensitive, and runs for hundreds of sequential steps. Mixing them in the same pipeline is like running a sprinter and a marathon runner on the same track at the same time.

Traditional pipeline parallelism splits the model's layers across GPUs in a chain: GPU 0 handles layers 0-15, GPU 1 handles layers 16-31, and so on. Each request flows through the chain. The problem? When a prefill request enters the pipeline, it monopolizes each GPU for much longer than a decode step, creating **pipeline bubbles** — idle time where downstream GPUs wait for the prefill to finish before they can process the next decode step.

**TD-Pipe** (Temporally-Disaggregated Pipeline Parallelism) solves this by separating prefill and decode in time. Dedicated time windows handle all prefill work, then the pipeline switches to decode-only mode. A hierarchy-controller architecture decouples scheduling from execution, and an AI-based greedy strategy predicts output lengths to optimize phase transitions. The result: up to 2.73x throughput over standard pipeline parallelism.

## Partition Phase Separation at FINRA

At FINRA, our distributed inference pipeline had its own version of the prefill/decode conflict. Our EMR jobs had two phases: a **data loading phase** (reading large partitions from S3, deserializing, joining reference data) and a **scoring phase** (running model inference on the prepared data). They had completely different resource profiles — loading was I/O-bound and memory-heavy, scoring was CPU-bound and relatively predictable.

When we mixed phases naively, the same problem emerged. A node loading a massive partition would stall while other nodes sat idle waiting for it to contribute to a downstream shuffle. Our partition locking mechanism helped here: by locking on date range + symbol range, we could **schedule loading and scoring phases independently** across the cluster. Nodes finishing their scoring phase could claim new partitions for loading without waiting for the slowest loader to complete.

This is exactly TD-Pipe's insight applied to EMR: disaggregate the phases temporally, let each phase run optimally in its own time window, and use intelligent scheduling to minimize the transition cost between phases.

## Multitrack Recording

In music production, the shift from live recording to **multitrack recording** follows the same arc. Early studios recorded everything simultaneously — the orchestra, vocalist, and rhythm section all performed together, captured on a single track. If the trumpet player made a mistake in bar 47, everyone re-recorded the entire piece.

Multitrack disaggregated the process temporally: record the rhythm section first (the "prefill" — establishing the foundation), then overdub each instrument in separate passes (the "decode" — adding detail incrementally). Each phase uses different equipment settings, different room configurations, different microphone techniques. Trying to optimize for both simultaneously means optimizing for neither.

TD-Pipe's work-stealing between decode batches mirrors a producer pulling in a session musician for a quick overdub while waiting for the string section to arrive — filling idle time with useful work rather than letting the studio sit empty.

## Construction Phasing

Building construction is perhaps the most literal parallel. No one pours concrete, frames walls, and installs electrical wiring simultaneously in the same space. Instead, construction follows **phased scheduling**: excavation, then foundation, then framing, then mechanical/electrical/plumbing, then finishing. Each phase has different crews, different equipment, and different spatial requirements.

The pipeline bubble problem in LLM inference is equivalent to a framing crew standing idle because the foundation pour in the next building bay is taking longer than expected. TD-Pipe's solution — batch all foundation work together, then batch all framing — mirrors construction's phased approach. The hierarchy-controller is the general contractor, scheduling subcontractors (GPU compute phases) to minimize idle time across the site (the pipeline).

## Key Numbers

| Metric | Standard Pipeline | TD-Pipe |
|--------|------------------|---------|
| Throughput vs tensor parallel | baseline | up to 1.91x |
| Throughput vs pipeline parallel | baseline | up to 2.73x |
| Pipeline bubbles | Phase-switching creates idle GPUs | Eliminated via temporal disaggregation |
| Scheduling | Static, coupled | Hierarchy-controller, decoupled |
| Decode balancing | Fixed assignment | Inter-batch work stealing |

The pattern generalizes: whenever a pipeline mixes workloads with fundamentally different resource profiles, disaggregate them in time. The scheduling complexity increases, but the throughput gains from eliminating bubbles more than compensate.
