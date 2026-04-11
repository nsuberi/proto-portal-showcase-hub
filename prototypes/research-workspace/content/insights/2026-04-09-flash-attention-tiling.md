# FlashAttention: Why Tiling Beats Brute Force in Attention and Everywhere Else

Standard attention is deceptively simple: compute Q*K^T, apply softmax, multiply by V. But that intermediate Q*K^T matrix is N x N — for a 32K-context request, that's over a billion elements, each consuming 2 bytes in float16. The matrix materializes in GPU high-bandwidth memory (HBM), gets read back for softmax, written again, read again for the V multiplication. Every round trip costs time.

FlashAttention's core insight: **never materialize the full attention matrix at all.** Instead, tile the computation into blocks that fit entirely in GPU SRAM (on-chip scratchpad memory, ~20MB on A100) and fuse the entire softmax-attention pipeline into a single kernel pass. Each tile computes a partial softmax using an online algorithm, accumulating running statistics across blocks without ever needing the full row.

The result? Memory drops from O(N^2) to O(N). Wall-clock time drops 3x on GPT-2 at 1K context. By FlashAttention-4 (March 2026), the approach hits 1613 TFLOPs/s on B200 GPUs — 71% of theoretical peak.

## The EMR Memory Parallel

This is the same battle I fought at FINRA on EMR clusters. Large partitions — sometimes millions of rows for a single date-range x symbol-range slice — would kill nodes outright. The executor would try to materialize an entire partition in memory for a join or aggregation, and the JVM would OOM.

The fix was the same principle: **process in chunks that fit in fast memory.** We'd repartition the data into tiles that each executor could handle, maintain running aggregates across tiles, and write partial results incrementally. The per-tile overhead was minimal compared to the cost of spilling to disk (EMR's equivalent of HBM round-trips). FlashAttention's online softmax is structurally identical to a streaming aggregation: you maintain a running max and running sum, updating as each new block arrives.

## The STFT Connection

In signal processing, this tiling idea is so fundamental it has its own name: the **Short-Time Fourier Transform**. A raw FFT of an entire audio file tells you *which* frequencies are present but nothing about *when* they occur. The STFT windows the signal into overlapping blocks and computes the FFT on each block independently.

FlashAttention tiles attention along the sequence dimension. The STFT tiles a signal along the time dimension. Both sacrifice a global view for local computation that fits in fast memory — and both recover the global result through carefully designed accumulation (overlap-add for STFT, online softmax for FlashAttention).

The parallel goes deeper: just as the STFT window size trades off time resolution for frequency resolution, FlashAttention's tile size trades off SRAM utilization for the number of HBM round-trips. Too small a tile means too many kernel launches; too large means you spill from SRAM. The sweet spot depends on the hardware — exactly as the optimal STFT window depends on the analysis goal.

## Building in Bays

In Gothic cathedral architecture, builders didn't attempt to erect the entire structure at once. They worked in **bays** — repeated structural units (two piers + vault + buttress) that could be completed independently. Each bay was structurally self-supporting during construction, and the global structure emerged from their repetition.

FlashAttention builds attention the same way: each tile is a self-contained computation (a "bay") that produces a valid partial result. The flying buttresses are the running softmax statistics — lightweight metadata passed between bays that maintains global structural integrity without requiring the entire building to exist simultaneously.

## Key Numbers

| Metric | Standard Attention | FlashAttention |
|--------|-------------------|----------------|
| Memory complexity | O(N^2) | O(N) |
| GPT-2 1K speedup | baseline | 3x faster |
| A100 utilization | ~30-40% | 50-73% (FA-2) |
| B200 throughput | — | 1613 TFLOPs/s (FA-4) |

The lesson is hardware-universal: when your bottleneck is data movement, not computation, reorganize the algorithm around the memory hierarchy. Tile. Stream. Never materialize what you don't need to store.
