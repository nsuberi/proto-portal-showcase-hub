# INT-FlashAttention: Quantizing the Inner Loop

The attention mechanism is the heartbeat of every transformer — and its biggest bottleneck. FlashAttention solved half the problem by tiling the computation to fit in GPU SRAM, avoiding costly round-trips to high-bandwidth memory (HBM). But it left precision untouched: every multiply-accumulate still ran in FP16 or BF16. **INT-FlashAttention closes that gap**, fusing INT8 quantization directly into the tiled attention kernel to achieve 72% faster inference with negligible accuracy loss.

The core insight is deceptively simple: if you can quantize the Q, K, and V matrices to 8-bit integers *before* the tiled GEMM, you halve the memory bandwidth per element and unlock the GPU's integer tensor cores — which often have 2x the throughput of their floating-point counterparts. The tricky part is maintaining numerical stability across the softmax normalization that sits between the two matrix multiplies (QK^T and then softmax(QK^T)V). INT-FlashAttention solves this with a per-block dynamic quantization scheme: each tile gets its own scale factor, computed on-the-fly, keeping the quantization error local rather than cumulative.

## The EMR Memory Parallel

This is the same class of problem we wrestled with on EMR clusters at FINRA: **how do you reduce per-node memory consumption without corrupting results?** When a partition was too large, the node would OOM and die silently. Our solution was aggressive memory profiling — logging partition characteristics (row count, column cardinality, symbol density) to identify which data shapes triggered the blowup, then restructuring the partition boundaries to keep each node's peak allocation under the threshold.

INT-FlashAttention applies the same principle at the hardware level. Instead of restructuring data, it restructures *precision*. Each SRAM tile is a "partition" with a strict memory budget. By quantizing to INT8, you effectively halve the partition size — doubling the number of tokens you can process per tile before spilling to HBM. The per-tile scale factors are the equivalent of per-partition metadata: small overhead that prevents corruption.

## The Audio Bit-Depth Connection

If you've worked with digital audio, quantization is visceral. The difference between 16-bit and 8-bit PCM is the difference between CD quality and a lo-fi telephone. Drop from 65,536 to 256 amplitude levels and you hear the quantization noise — a gritty, stepped distortion.

But audio engineers discovered that **dithering** — adding a tiny amount of shaped noise before quantizing — can make 8-bit audio sound remarkably close to 16-bit. The noise masks the quantization steps, trading a barely-perceptible hiss for a clean signal.

INT-FlashAttention's per-block dynamic scaling plays an analogous role. By calibrating the quantization range independently for each tile, it keeps the "quantization noise" (numerical error) below the threshold where it affects model output quality. The error is there — just as dither noise is there — but it's shaped to be imperceptible at the application level.

## Structural Compression

In architecture, this maps to engineered materials. A steel I-beam uses less material than a solid rectangular beam of the same load capacity. The insight is geometric: concentrate material where stress is highest (the flanges), remove it where stress is lowest (the web center). INT-FlashAttention does the same with precision — full dynamic range where the softmax concentrates probability mass, aggressive compression in the low-attention tails.

## Key Numbers

| Metric | FP16 FlashAttention | INT-FlashAttention | Improvement |
|--------|--------------------|--------------------|-------------|
| Kernel latency | 1.0x baseline | 0.58x | **72% faster** |
| Memory bandwidth | 2 bytes/element | 1 byte/element | **2x reduction** |
| Accuracy (perplexity) | Baseline | +0.02 | **Negligible** |
| Tensor core utilization | FP16 cores | INT8 cores (2x TOPS) | **Double throughput** |

The takeaway: precision is a resource, not a constant. Just as you'd profile partition sizes to prevent OOM on EMR, you can profile numerical precision to fit more computation into the GPU's fastest memory tier.
