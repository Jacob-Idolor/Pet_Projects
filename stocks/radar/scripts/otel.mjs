/**
 * Optional OpenTelemetry for Stocks Radar CI / laptop scripts.
 *
 * Off by default (no export, no AWS cost). Enable with:
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
 *
 * Optional:
 *   OTEL_SERVICE_NAME=stocks-radar-quotes
 *   OTEL_TRACES_EXPORTER=console
 *   OTEL_SDK_DISABLED=true
 */

const DISABLED =
  process.env.OTEL_SDK_DISABLED === "true" || process.env.OTEL_SDK_DISABLED === "1";

function endpointConfigured() {
  return Boolean(
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ||
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim()
  );
}

export function otelEnabled() {
  return !DISABLED && endpointConfigured();
}

const noopSpan = {
  setAttribute() {
    return this;
  },
  setAttributes() {
    return this;
  },
  setStatus() {
    return this;
  },
  recordException() {
    return this;
  },
  addEvent() {
    return this;
  },
  end() {},
  isRecording() {
    return false;
  },
};

const noop = {
  enabled: false,
  startSpan() {
    return noopSpan;
  },
  async withSpan(_name, fn) {
    return fn(noopSpan);
  },
};

/**
 * @param {string} serviceName
 * @param {(otel: typeof noop) => Promise<unknown>} fn
 */
export async function withOtel(serviceName, fn) {
  if (!otelEnabled()) {
    return fn(noop);
  }

  let api;
  let provider;
  let SpanStatusCode;

  try {
    api = await import("@opentelemetry/api");
    ({ SpanStatusCode } = api);

    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const semconv = await import("@opentelemetry/semantic-conventions");
    const serviceAttr =
      semconv.ATTR_SERVICE_NAME || semconv.SEMRESATTRS_SERVICE_NAME || "service.name";

    const { NodeTracerProvider } = await import("@opentelemetry/sdk-trace-node");
    const { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } = await import(
      "@opentelemetry/sdk-trace-base"
    );
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");

    const resource = resourceFromAttributes({
      [serviceAttr]: process.env.OTEL_SERVICE_NAME || serviceName,
      "service.namespace": "stocks-radar",
      "deployment.environment": process.env.GITHUB_ACTIONS ? "ci" : "local",
    });

    const base = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "").replace(/\/$/, "");
    const url =
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim() ||
      (base.endsWith("/v1/traces") ? base : `${base}/v1/traces`);

    const spanProcessors = [new BatchSpanProcessor(new OTLPTraceExporter({ url }))];
    if (process.env.OTEL_TRACES_EXPORTER === "console") {
      spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    }

    provider = new NodeTracerProvider({ resource, spanProcessors });
    provider.register();
    console.log(`OTel traces → ${url} (service=${process.env.OTEL_SERVICE_NAME || serviceName})`);
  } catch (e) {
    console.warn(
      `OTel requested but SDK failed to load (${e.message}). Run npm install in stocks/radar. Continuing without telemetry.`
    );
    return fn(noop);
  }

  const tracer = api.trace.getTracer(serviceName, "0.1.0");

  const otel = {
    enabled: true,
    startSpan(name, attrs = {}) {
      const span = tracer.startSpan(name);
      span.setAttributes(attrs);
      return span;
    },
    async withSpan(name, spanFn, attrs = {}) {
      const span = tracer.startSpan(name);
      span.setAttributes(attrs);
      return api.context.with(api.trace.setSpan(api.context.active(), span), async () => {
        try {
          const result = await spanFn(span);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          span.recordException(err);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: String(err.message || err),
          });
          throw err;
        } finally {
          span.end();
        }
      });
    },
  };

  try {
    return await fn(otel);
  } finally {
    try {
      await provider.forceFlush();
      await provider.shutdown();
    } catch (e) {
      const msg = String(e.message || e);
      // OTLP export often fails in dry local runs without a collector — non-fatal.
      if (!/ECONNREFUSED|fetch failed|network/i.test(msg)) {
        console.warn(`OTel shutdown: ${msg}`);
      }
    }
  }
}
