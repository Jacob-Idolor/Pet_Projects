package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
)

func main() {
	ctx := context.Background()
	shutdown, err := setupOTel(ctx)
	if err != nil {
		panic(err)
	}
	defer func() {
		_ = shutdown(ctx)
	}()

	slog.SetDefault(slog.New(newTraceLogHandler()))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/", indexHandler)
	mux.HandleFunc("/work", workHandler)
	mux.HandleFunc("/chain", chainHandler)
	mux.HandleFunc("/error", errorHandler)

	handler := otelhttp.NewHandler(mux, "go-http-server")
	slog.Info("listening", "port", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}

func setupOTel(ctx context.Context) (func(context.Context) error, error) {
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(getServiceName()),
		),
	)
	if err != nil {
		return nil, err
	}

	traceExp, err := otlptracehttp.New(ctx)
	if err != nil {
		return nil, err
	}
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExp),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	metricExp, err := otlpmetrichttp.New(ctx)
	if err != nil {
		return nil, err
	}
	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExp)),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	return func(ctx context.Context) error {
		err1 := tp.Shutdown(ctx)
		err2 := mp.Shutdown(ctx)
		if err1 != nil {
			return err1
		}
		return err2
	}, nil
}

func getServiceName() string {
	if name := os.Getenv("OTEL_SERVICE_NAME"); name != "" {
		return name
	}
	return "go-http-lab"
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	slog.InfoContext(r.Context(), "index request")
	fmt.Fprintln(w, "OpenTelemetry Go sample — try /work, /chain, /error")
}

func workHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tracer := otel.Tracer("go-http-lab/manual")

	ctx, span := tracer.Start(ctx, "simulateWork")
	defer span.End()

	span.SetAttributes(attribute.Int("work.units", 3))
	time.Sleep(80 * time.Millisecond)
	slog.InfoContext(ctx, "work completed")

	fmt.Fprintln(w, "work done")
}

func chainHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tracer := otel.Tracer("go-http-lab/manual")

	ctx, root := tracer.Start(ctx, "chain.root")
	defer root.End()

	if err := downstreamCall(ctx, tracer); err != nil {
		root.RecordError(err)
		root.SetStatus(codes.Error, err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Fprintln(w, "chain complete")
}

func downstreamCall(ctx context.Context, tracer trace.Tracer) error {
	ctx, span := tracer.Start(ctx, "downstreamCall")
	defer span.End()

	time.Sleep(50 * time.Millisecond)
	slog.InfoContext(ctx, "downstream step finished")
	return nil
}

func errorHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tracer := otel.Tracer("go-http-lab/manual")
	_, span := tracer.Start(ctx, "intentionalError")
	defer span.End()

	err := fmt.Errorf("simulated payment failure")
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
	slog.ErrorContext(ctx, "request failed", "error", err.Error())

	http.Error(w, err.Error(), http.StatusInternalServerError)
}

type traceLogHandler struct {
	inner slog.Handler
}

func newTraceLogHandler() slog.Handler {
	return &traceLogHandler{inner: slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})}
}

func (h *traceLogHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.inner.Enabled(ctx, level)
}

func (h *traceLogHandler) Handle(ctx context.Context, r slog.Record) error {
	spanCtx := trace.SpanContextFromContext(ctx)
	if spanCtx.IsValid() {
		r.AddAttrs(
			slog.String("trace_id", spanCtx.TraceID().String()),
			slog.String("span_id", spanCtx.SpanID().String()),
		)
	}
	return h.inner.Handle(ctx, r)
}

func (h *traceLogHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &traceLogHandler{inner: h.inner.WithAttrs(attrs)}
}

func (h *traceLogHandler) WithGroup(name string) slog.Handler {
	return &traceLogHandler{inner: h.inner.WithGroup(name)}
}
