# Sampling strategies — keep what matters at scale

At 10,000 requests/second, storing every span is expensive and slow to search. **Sampling** chooses which traces to retain. **Metrics are not sampled** the same way — SLIs need complete aggregates.

---

## The fundamental trade-off

| Keep 100% traces | Sample heavily |
|------------------|----------------|
| Complete debugging | Lower cost |
| High storage cost | May miss rare bugs |
| Slow trace search | Need smart sampling rules |

**Industry practice:** sample most success paths; **always keep errors and slow traces** when possible.

---

## Head sampling

Decision at **trace start** — before spans complete.

```yaml
processors:
  probabilistic_sampler:
    sampling_percentage: 10
```

SDK equivalent:

```go
sdktrace.WithSampler(sdktrace.TraceIDRatioBased(0.1))
```

| Pros | Cons |
|------|------|
| Simple, low memory | Can't "upgrade" a boring trace that later errors |
| Works at app or Collector | 10% sample might still drop the one bug you need |

**Use for:** high-volume success paths, dev/staging cost control.

---

## Tail sampling

Decision after **trace completes** — see all spans before choosing.

```yaml
processors:
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: errors
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: slow
        type: latency
        latency: {threshold_ms: 2000}
      - name: random
        type: probabilistic
        probabilistic: {sampling_percentage: 5}
```

| Pros | Cons |
|------|------|
| Keep 100% errors/slow | Needs memory buffer (`decision_wait`) |
| Smart retention | Must run at Collector (not typical in SDK) |

**Use for:** production gateway Collector.

Lab: [lab-07-sampling](../labs/lab-07-sampling/)

Configs: [configs/collector-tail-sampling.yaml](../configs/collector-tail-sampling.yaml)

---

## Adaptive sampling (awareness)

Some vendors and advanced Collectors adjust rates based on traffic. OTel spec supports extensible sampling — check your backend's docs.

---

## What NOT to sample away

| Signal | Sampling |
|--------|----------|
| **Traces** | Yes — primary sampling target |
| **Metrics** | No — counters/histograms must reflect all requests |
| **Logs** | Usually not sampled at source; use log level + aggregation |

If you sample metrics per-request, your error **rate** will be wrong.

---

## Consistent sampling across services

**Problem:** Service A samples 10%, Service B samples 10% independently — end-to-end traces fragment.

**Fix:**

- Sample decision at **entry** (ingress) and propagate sampling flag in trace context
- Or use tail sampling at central Collector only

The `traceparent` flags field includes a **sampled** bit — downstream honors it.

---

## Cost math (rough)

```
1M spans/day × 500 bytes ≈ 500 MB/day raw
× 365 ≈ 180 GB/year per service

× 20 microservices = 3.6 TB/year at 100% sampling
× 10% sampling = 360 GB/year
```

Sampling + cardinality control = FinOps for observability.

---

## Debugging while sampling is on

1. Temporarily set 100% for one service (staging)
2. Use `trace_id` from logs (logs aren't sampled the same way)
3. Tail sampling policy for specific attributes (e.g. `customer.tier=enterprise`)

---

## Check yourself

1. Head vs tail sampling — when is each appropriate?
2. Why shouldn't you sample HTTP request counters at 10%?
3. Where should tail sampling run — SDK or Collector?

Answers: [concept-self-check.md](../drills/concept-self-check.md) § Block 7

---

## Next

[09 — History and ecosystem](09-history-and-ecosystem.md)
