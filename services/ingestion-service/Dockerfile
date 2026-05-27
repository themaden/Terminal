# ── Build Stage ──
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY . .

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o ingestion-service ./cmd/server/main.go

# ── Production Stage ──
FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/ingestion-service .

EXPOSE 8002

CMD ["./ingestion-service"]
