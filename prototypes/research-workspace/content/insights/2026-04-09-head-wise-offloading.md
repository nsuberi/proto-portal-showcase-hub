# HeadInfer: Head-Wise Offloading as Distributed Memory Tiering

Here's a number that should make any distributed systems engineer sit up: **207 GB down to 17 GB**. That's the GPU memory reduction HeadInfer achieves for long-context LLM inference by selectively offloading attention head KV caches to CPU RAM. Not all heads. Not uniformly. *Strategically* — based on which heads actually matter for the current generation step.

The key observation: in multi-head attention, not all heads contribute equally to the output at any given token position. Some heads carry critical contextual information (retrieval heads, induction heads), while others produce near-uniform attention distributions that barely influence the result. HeadInfer exploits this by keeping only the "hot" heads in GPU HBM and parking the rest in CPU DRAM, fetching them back only when they become relevant.

## Shipping Model Weights, Revisited

At FINRA, we shipped model weight packages to each EMR node — the entire model had to be present on every worker before inference could begin. The constraint was brutal: if the weight package exceeded a node's available memory, the node would silently die mid-partition. We learned to profile aggressively, logging not just memory totals but *which model components* consumed what, so we could restructure the deployment when a new model version bloated past the node limit.

HeadInfer inverts this paradigm elegantly. Instead of shipping everything to the compute node and hoping it fits, you **tier the storage**: keep the hot working set on the fast tier (GPU HBM) and overflow the cold set to the slow tier (CPU DRAM). The PCI-e bus between CPU and GPU becomes the equivalent of our EMR cluster's network interconnect — a bandwidth bottleneck you manage, not eliminate.

The parallel to our partition locking mechanism is precise. We locked on date range x symbol range so that different cluster sizes could process independently. HeadInfer "locks" on attention head groups: head 7 lives on GPU, head 23 lives on CPU, and they don't contend for the same memory pages. The scheduling is the hard part — predicting which heads will be hot for the *next* token so you can prefetch them before they're needed.

## The Mixing Console Analogy

If you've ever worked a mixing console, this is immediately intuitive. In a 64-track session, not every instrument is active at every moment. The verse might need vocals, bass, drums, and rhythm guitar — but the brass section, strings, and backing vocals are silent. A skilled engineer routes the active tracks through the main bus (fast GPU memory) and keeps the inactive tracks on standby (CPU RAM), ready to bring up when the chorus hits.

HeadInfer does this automatically. It analyzes the attention pattern history to predict which heads are about to become "active" in the mix, pre-routing them to the GPU bus before they're needed. The prefetch latency is hidden behind the computation of the current token — the same double-buffering technique that audio engineers use when streaming from disk: read the next buffer while playing the current one.

## Tiered Architecture

In building design, this maps to **mechanical tiering**. A skyscraper doesn't keep all its HVAC, electrical, and plumbing infrastructure on every floor. Critical systems (emergency power, fire suppression) are distributed to every floor. Bulk systems (water tanks, main electrical switchgear) are consolidated on mechanical floors — typically every 20-30 stories. The elevator shafts (PCI-e bus) connect the tiers.

HeadInfer follows the same principle: distribute the critical attention heads across the fast tier, consolidate the bulk onto the slow tier, and engineer the interconnect to handle the worst-case transfer load.

## Key Numbers

| Metric | Full GPU KV Cache | HeadInfer (Offloaded) |
|--------|-------------------|-----------------------|
| GPU memory (128K context) | 207 GB | 17 GB | 
| Hardware required | 3x A100 80GB | 1x A100 80GB |
| CPU RAM used | 0 GB | ~190 GB |
| Prefetch hit rate | N/A | >95% |
| Latency overhead | Baseline | <8% per token |

The insight generalizes: **not all data is equally hot**. Whether it's financial partitions on EMR, attention heads on a GPU, or instrument tracks on a mixing console, the winning strategy is always the same — profile, tier, and prefetch.
