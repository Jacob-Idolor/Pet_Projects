# Lab 07 — Sampling

**Level:** L6 · **Time:** 45–60 min · **Prerequisites:** Lab 04 · **Curriculum:** [09 — Production patterns](../../curriculum/09-production-patterns.md)

## Concepts

At scale you cannot retain every trace. **Sampling** chooses which traces to keep. **Head sampling** decides at start; **tail sampling** decides after the trace completes (can keep all errors).

## Goals

- Configure probabilistic head sampling
- Configure tail sampling for errors and slow traces
- Observe sample rate in Jaeger

## Steps

### 1. Head sampling — 10%

Copy [configs/collector-head-sampling.yaml](../../configs/collector-head-sampling.yaml) over the stack config (or merge processors):

```yaml
processors:
  probabilistic_sampler:
    sampling_percentage: 10
```

Restart Collector, generate 50 requests:

```bash
for i in $(seq 1 50); do curl -s http://localhost:8080/ > /dev/null; done
```

In Jaeger, compare trace count vs requests — roughly 10% visible (variance is normal).

### 2. Tail sampling — keep errors

Use [configs/collector-tail-sampling.yaml](../../configs/collector-tail-sampling.yaml):

- Drops most successful fast traces
- Keeps ERROR status and traces > 500ms

```bash
# swap config, restart collector
docker compose -f examples/stack/docker-compose.yml restart otel-collector

for i in $(seq 1 30); do curl -s http://localhost:8080/work > /dev/null; done
for i in $(seq 1 10); do curl -s http://localhost:8080/error > /dev/null; done
```

Verify: error traces appear reliably; many `/work` traces may be dropped.

### 3. Document your strategy

In [PROGRESS.md](../../PROGRESS.md) notes, write a 3-sentence sampling policy for a hypothetical API at 5k req/s.

Example:

> Head sample 5% of success paths at the SDK. Tail sample at Collector: keep 100% errors, 100% traces > 2s, 1% of remainder. Metrics remain unsampled for accurate SLIs.

### 4. Troubleshooting drill

Complete scenarios **S4** and **S5** in [drills/troubleshooting-scenarios.md](../../drills/troubleshooting-scenarios.md).

## Reflect

- Why aren't metrics sampled the same way as traces?
- What memory implications does tail sampling have on the Collector?

## Checklist

- [ ] Tested head sampling
- [ ] Tested tail sampling with error preservation
- [ ] Wrote sampling policy notes
- [ ] Completed troubleshooting scenarios S4–S5
- [ ] Updated [PROGRESS.md](../../PROGRESS.md)

## Capstone

Instrument an app from another track ([games](../games/), [stocks](../stocks/), etc.), export to this stack, add screenshots to that project's README.
