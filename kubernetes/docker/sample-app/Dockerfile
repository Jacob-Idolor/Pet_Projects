FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server .

FROM alpine:3.19
RUN adduser -D -g '' appuser
USER appuser
WORKDIR /home/appuser
COPY --from=builder /server ./server
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=2s --retries=3 CMD wget -qO- http://localhost:8080/health || exit 1
ENTRYPOINT ["./server"]
