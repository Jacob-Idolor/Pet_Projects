# Teachings — deep concept guides

These documents go **deeper than curriculum modules**. Use them when you want to fully understand OpenTelemetry, not just complete labs.

**Start here:** [CORE-CONCEPTS.md](../CORE-CONCEPTS.md)

## Reading order

| # | Document | Time | You'll understand |
|---|----------|------|-------------------|
| 01 | [The complete picture](01-the-complete-picture.md) | 15 min | What OTel is and isn't |
| 02 | [Data model](02-data-model.md) | 20 min | Resource, Span, Metric, LogRecord |
| 03 | [Context propagation](03-context-propagation.md) | 25 min | W3C headers, broken traces, baggage intro |
| 04 | [SDK internals](04-sdk-internals.md) | 20 min | Providers, batching, shutdown |
| 05 | [OTLP and backends](05-otlp-and-backends.md) | 15 min | Wire protocol, vendor neutrality |
| 06 | [Semantic conventions](06-semantic-conventions.md) | 15 min | Standard vocabulary |
| 07 | [Sampling strategies](07-sampling-strategies.md) | 20 min | Head/tail, cost, consistent sampling |
| 09 | [History and ecosystem](09-history-and-ecosystem.md) | 10 min | OpenTracing/Census, CNCF, vendors |
| 10 | [Mastery checklist](10-mastery-checklist.md) | ongoing | Prove full understanding |
| — | [Glossary](GLOSSARY.md) | reference | Term lookup |

## Pair with curriculum

| Teaching | Curriculum module |
|----------|-------------------|
| 01 | 02-opentelemetry-concepts |
| 02, 05 | 11-data-model-and-otlp |
| 03 | 10-context-and-propagation, 13-baggage |
| 04 | 07-instrumentation, 14-architecture |
| 06 | 12-semantic-conventions |
| 07 | 09-production, Lab 07 |

## Pair with drills

After each teaching, answer the matching block in [concept-self-check.md](../drills/concept-self-check.md).
