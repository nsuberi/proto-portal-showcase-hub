# Continuous Batching: From Static Partitions to Dynamic Streams

Traditional inference serving batches requests together and processes them as a unit. The problem: requests finish at different times, but the entire batch is held until the longest request completes. Short prompts wait for long ones. GPU utilization plummets.

**Continuous batching** (also called "inflight batching") solves this by treating the batch as a dynamic stream — new requests join and completed requests leave on a per-iteration basis, just like passengers boarding and exiting a bus at each stop.

## The Partition Problem at FINRA

This is exactly the problem we faced with EMR cluster partitions. Fixed partition assignments meant that some nodes would finish early (small partitions, few symbols) while others would grind through massive date-range × symbol-range blocks. The cluster was only as fast as its slowest partition.

Our solution was dynamic work-stealing: when a node finished its partition, it could claim unstarted work from the queue rather than sitting idle. The key challenge was **partition locking** — ensuring that two nodes never processed the same date-range × symbol-range combination, which would corrupt versioned output.

Continuous batching faces the same challenge: GPU memory must be managed so that one request's KV cache doesn't collide with another's. PagedAttention provides the "locking" mechanism — each request's memory is tracked in a block table, preventing conflicts.

## Musical Polyphony

A symphony orchestra is a continuous batch processor. Instruments (requests) enter and exit the texture at different times, but the conductor (scheduler) keeps everything synchronized on the downbeat (each inference iteration). A fugue is the perfect analogy: voices enter one by one, each at a different point in its sequence, all sharing the same harmonic space without interference.

Static batching would be like requiring every instrument to play from the first measure to the last — absurd for music, and equally wasteful for inference.

## Structural Flows

Modern buildings use continuous-flow HVAC systems, not batch heating. Each zone adjusts independently based on occupancy and temperature, while the central plant runs at whatever capacity the aggregate demand requires. The key metric is the same as in continuous batching: **utilization factor** — what percentage of total capacity is actually doing useful work at any given moment.

## Impact

The shift from static to continuous batching typically delivers:
- **2-10x throughput improvement** depending on request length variance
- **50-90% GPU utilization** (up from 10-30% with static batching)
- **Lower tail latencies** for short requests (no longer blocked by long ones)
