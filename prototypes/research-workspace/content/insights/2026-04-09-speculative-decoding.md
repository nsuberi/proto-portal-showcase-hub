# Speculative Decoding: Draft Models as Scout Nodes

Autoregressive decoding is inherently sequential — each token depends on all previous tokens. For large models, this means the GPU sits mostly idle during inference, limited by memory bandwidth rather than compute. **Speculative decoding** breaks this bottleneck by using a smaller "draft" model to propose multiple tokens, which the large "verifier" model checks in parallel.

## The EMR Scout Pattern

At FINRA, when running distributed inference on EMR clusters, we encountered a similar pattern: some nodes would finish their partition early and sit idle while others ground through larger partitions. Our solution was to have fast-finishing nodes **scout ahead** — pre-computing results on speculative partitions that might be needed next.

Speculative decoding works the same way. The draft model is the scout: fast, lightweight, and often wrong on individual tokens, but correct enough that the verifier can accept most proposals in a single forward pass. The key metric is the **acceptance rate** — how often the draft model's guesses match what the large model would have generated.

## Signal Processing: Prediction and Correction

This is the classic **predict-correct** pattern from signal processing. A Kalman filter predicts the next state using a simple model, then corrects using the actual measurement. The prediction step is cheap (like the draft model), and the correction step integrates new information (like the verifier).

In audio processing, this same principle drives **Linear Predictive Coding (LPC)**: predict the next sample using a simple linear model of the vocal tract, then only transmit the residual error. Speculative decoding is LPC for language — predict cheaply, transmit only the corrections.

## Structural Redundancy in Architecture

Gothic cathedrals use flying buttresses — structural elements that speculatively distribute load outward, allowing thinner walls and larger windows. If the buttress bears too much load (draft rejected), the wall itself provides the fallback (verifier generates from scratch). The redundancy isn't waste; it enables the primary structure to be more ambitious.

## Key Numbers

A well-tuned speculative decoding setup with a 7B draft model and 70B verifier can achieve:
- **2-3x speedup** in time-to-first-token latency
- **70-85% acceptance rate** on typical text
- **Zero quality loss** — the verifier guarantees outputs are identical to standalone generation
