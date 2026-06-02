# JetNexus AI

### Otonom Havacılık Operasyon ve Kriz Yönetim Platformu

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)

> Uçuş krizlerini otomatik çözen, yolcu haklarını EU261 kapsamında koruyan ve operasyon merkezlerini tek panelden yöneten çok katmanlı havacılık zekâ platformu.

---

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Sistem Mimarisi](#sistem-mimarisi)
- [Servisler](#servisler)
- [Operasyon Katmanları](#operasyon-katmanları)
- [AI Agent Mimarisi](#ai-agent-mimarisi)
- [Kural Motoru](#kural-motoru)
- [PSS Adaptörleri ve Dış Bağlantılar](#pss-adaptörleri-ve-dış-bağlantılar)
- [EU261 Tazminat Motoru](#eu261-tazminat-motoru)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Bağımsız Servis Başlatma](#bağımsız-servis-başlatma)
- [Proje Yapısı](#proje-yapısı)
- [API Referansı](#api-referansı)
- [Geliştirme Komutları](#geliştirme-komutları)

---

## Genel Bakış

JetNexus AI, havayolu operasyon merkezlerinin (IOCC, HUB Control, PCC, Revenue) gerçek zamanlı olarak kullandığı bir karar destek ve otomasyon platformudur. Uçuş iptali, gecikmesi veya bağlantı kopması gibi irrops (irregular operations) senaryolarında şu adımları otomatik olarak yürütür:

1. **Veri Alımı** — PSS sistemlerinden (Amadeus, Sabre, SITA) ve dış kaynaklardan (hava durumu, ATC, AODB, GDS) gerçek zamanlı veri çeker.
2. **Kriz Tespiti** — IRROPS kuralları ile gecikme/iptal krizini sınıflandırır.
3. **Yeniden Rezervasyon** — MILP optimizasyonu ile en düşük maliyetli yeniden yerleşim planını üretir.
4. **Tazminat Hesabı** — EU261 regülasyonuna göre her yolcu için otomatik tazminat belirler.
5. **Yolcu İletişimi** — Türkçe/İngilizce SMS ve WhatsApp bildirimi gönderir.
6. **Denetim** — Tüm kararları yasal uyumluluk için audit log'a yazar.

---

## Sistem Mimarisi

```
┌──────────────────────────────────────────────────────────────────┐
│                        Dış Sistemler                             │
│   Amadeus · Sabre · SITA · OpenAI · Weather API · ATC · GDS     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │     Ingestion Service (Go)      │
          │  PSS Adapters · Normalizer      │
          │  Webhook Handler · Rate Limiter │
          └────────────┬───────────────────┘
                       │  Apache Kafka
          ┌────────────▼───────────────────┐
          │    Decision Engine (FastAPI)    │
          │  IRROPS Engine · MCT/ACT Rules  │
          │  MILP Optimizer · EU261 Engine  │
          │  AI Agents · PII Guard          │
          └──┬──────────┬──────────┬────────┘
             │          │          │
    ┌─────────▼──┐ ┌────▼────┐ ┌──▼─────────────────┐
    │ PostgreSQL  │ │  Redis  │ │ Notification Service│
    │  (Kalıcı)  │ │ (Cache) │ │  SMS · WhatsApp     │
    └────────────┘ └─────────┘ └────────────────────┘
                                        │
          ┌─────────────────────────────▼────────────────────┐
          │              Frontend (Next.js 15)                │
          │  Dashboard · IOCC · HUB Control · PCC · Revenue  │
          └──────────────────────────────────────────────────┘
```

---

## Servisler

### Decision Engine — `services/decision-engine` (Python/FastAPI)

Ana iş mantığını barındıran servis. Port `8000`'de çalışır.

| Modül | Açıklama |
|---|---|
| `app/agents/` | CrewAI tabanlı çok ajanlı orkestrasyon |
| `app/optimization/` | PuLP/CBC ile MILP yeniden rezervasyon optimizasyonu |
| `app/regulations/` | EU261 tazminat motoru ve validator |
| `app/rules/` | MCT, ACT ve IRROPS karar kuralları |
| `app/guardrails/` | PII maskeleme, prompt injection koruması, rate limiting |
| `app/api/routes/` | REST API uç noktaları (crisis, flights, hub, iocc, pcc, revenue) |
| `app/db/` | SQLAlchemy async ORM, veritabanı modelleri, seed verisi |

### Ingestion Service — `services/ingestion-service` (Go)

Dış sistemlerden veri alan ve Kafka'ya ileten kapı servisi. Port `8002`'de çalışır.

| Modül | Açıklama |
|---|---|
| `internal/adapters/pss/` | Amadeus, Sabre, SITA, Custom PSS adaptörleri |
| `internal/adapters/normalizer.go` | Farklı PSS formatlarını ortak veri modeline dönüştürür |
| `internal/connectors/` | Hava durumu, ATC, AODB, GDS dış bağlantı modülleri |
| `internal/handlers/` | HTTP webhook handler'ları (uçuş olayları, PSS olayları) |
| `internal/middleware/` | API key kimlik doğrulama, rate limiting |
| `internal/queue/` | Kafka producer |

### Notification Service — `services/notification-service` (Python)

Kafka'yı dinleyen ve yolculara bildirim gönderen servis. Port `8001`'de çalışır.

| Kanal | Açıklama |
|---|---|
| `channels/sms.py` | Twilio SMS entegrasyonu |
| `channels/whatsapp.py` | Twilio WhatsApp entegrasyonu |
| `channels/email.py` | E-posta kanalı |
| `templates/` | TR/EN iptal ve yeniden rezervasyon şablonları |

### Frontend — `frontend` (Next.js 15 + TypeScript)

Operasyon merkezleri için dark-mode HUD dashboard. Port `3000`'de çalışır.

---

## Operasyon Katmanları

JetNexus AI dört ayrı operasyon ekranı sunar; her biri havayolunun farklı bir departmanına karşılık gelir:

### IOCC — Integrated Operations Control Center (`/iocc`)

Havayolunun tüm operasyonel kontrolünü yöneten merkez ekran. Aktif krizleri listeler, IRROPS kararlarını manuel olarak onaylar/reddeder ve uçuş durumunu gerçek zamanlı izler.

**API:** `GET /api/v1/iocc/crises/active`, `POST /api/v1/iocc/decisions/{id}/approve`

### HUB Control — Bağlantı Yönetimi (`/hub-control`)

Transit yolcuların bağlantı riskini gerçek zamanlı takip eder. MCT (Minimum Connection Time) ve ACT (Actual Connection Time) hesaplamalarıyla riskli bağlantıları öne çıkarır, çıkış kapısı değişikliklerini yönetir.

**API:** `GET /api/v1/hub/connections/at-risk`, `POST /api/v1/hub/connections/update`

### PCC — Passenger Care Center (`/pcc`)

Risk altındaki yolcuları listeler, yolcu başına karar önerir ve kurtarma aksiyonlarını başlatır. VIP yolcular için öncelikli görünüm sunar.

**API:** `GET /api/v1/pcc/passengers/at-risk`, `POST /api/v1/pcc/passengers/{pnr}/recover`

### Revenue Management (`/revenue`)

Kriz kararlarının maliyet etkisini özetler. Tazminat tutarlarını, yeniden rezervasyon maliyetlerini ve EU261 yükümlülüklerini kıyaslar.

**API:** `GET /api/v1/revenue/impact/summary`, `GET /api/v1/revenue/impact/by-crisis`

---

## AI Agent Mimarisi

```
             ┌──────────────────────────────┐
             │       CoordinatorAgent        │
             │  Tüm ajanları sıraya sokar    │
             └────┬──────────┬──────────────┘
                  │          │
       ┌──────────┘          └──────────────────┐
       ▼                     ▼                  ▼
┌───────────┐    ┌───────────────┐    ┌──────────────────┐
│ Rebooking │    │ Compensation  │    │  Communication   │
│  Agent    │    │    Agent      │    │     Agent        │
│ MILP ile  │    │ EU261 tablosu │    │ TR/EN bildirim   │
│ yeni uçuş │    │ otomatik dol  │    │ metni üretir     │
└───────────┘    └───────────────┘    └──────────────────┘
                                      ┌──────────────────┐
                                      │ Compliance Agent │
                                      │ Yasal denetim    │
                                      └──────────────────┘
```

| Agent | Sorumluluk |
|---|---|
| **Coordinator** | Kriz akışını yönetir, ajan sırasını belirler |
| **Rebooking** | MILP sonuçlarına göre en uygun uçuşa atar |
| **Compensation** | EU261 kurallarına göre tazminat belirler |
| **Communication** | TR/EN yolcu bildirim mesajları üretir |
| **Compliance** | Tüm kararların yasal uyumluluğunu denetler |

---

## Kural Motoru

`services/decision-engine/app/rules/` altında üç temel kural modülü bulunur:

### MCT Calculator (`mct.py`)

Minimum Connection Time — havalimanı ve uçuş tipine göre minimum aktarma süresini hesaplar. Yurt içi/yurt dışı, terminal farkı ve özel havalimanı kurallarını destekler.

### ACT Tracker (`act.py`)

Actual Connection Time — anlık uçuş durumuna göre her transit yolcunun gerçek bağlantı süresini hesaplar. MCT ile kıyaslayarak `OK / AT_RISK / CRITICAL / MISSED` durumunu belirler ve `_act_tracker` singleton'ı üzerinden Hub Control'e canlı veri sağlar.

### IRROPS Engine (`irrops_engine.py`)

Irregular Operations karar motoru. Gecikme/iptal/yönlendirme/erken kalkış senaryolarını sınıflandırır; yolcu değerini (VIP, frequent flyer), bağlantı durumunu ve uçuş doluluk oranını birleştirerek otomatik aksiyon önerir.

---

## PSS Adaptörleri ve Dış Bağlantılar

### PSS Adaptörleri (`ingestion-service/internal/adapters/pss/`)

Farklı rezervasyon sistemlerinin veri formatlarını `PassengerProfile` ortak modeline dönüştürür:

| Adaptör | Sistem | Format |
|---|---|---|
| `amadeus.go` | Amadeus GDS | SOAP/REST |
| `sabre.go` | Sabre GDS | JSON API |
| `sita.go` | SITA Horizon | IATA standard |
| `custom.go` | Özel entegrasyon | Yapılandırılabilir |

`normalizer.go` tüm adaptörlerin çıktısını tutarlı bir `FlightEvent` modeline normalize eder ve Kafka'ya üretir.

### Dış Bağlantılar (`ingestion-service/internal/connectors/`)

| Modül | Veri Kaynağı | Kullanım |
|---|---|---|
| `weather.go` | Hava Durumu API | Pist kapanması, fırtına kararları |
| `atc.go` | ATC (Hava Trafik Kontrolü) | CTOT, slot kısıtlamaları |
| `aodb.go` | AODB (Airport Ops DB) | Gerçek kapı, pist, çıkış saatleri |
| `gds.go` | GDS | Dolu uçuş arama, alternatif güzergah |

---

## EU261 Tazminat Motoru

AB Yönetmeliği 261/2004 kapsamında tazminat otomatik hesaplanır:

| Mesafe | Gecikme | Tazminat |
|:---|:---:|:---:|
| < 1.500 km | ≥ 3 saat veya iptal | **€250** |
| 1.500 – 3.500 km | ≥ 3 saat veya iptal | **€400** |
| > 3.500 km (AB içi) | ≥ 3 saat veya iptal | **€400** |
| > 3.500 km | ≥ 4 saat veya iptal | **€600** |
| > 3.500 km | 3–4 saat arası | **€300** (%50 indirim) |

Olağanüstü haller (hava, güvenlik, ATC kısıtlaması) otomatik olarak tespit edilir ve tazminattan muafiyet uygulanır.

---

## Hızlı Başlangıç

### Gereksinimler

- Python 3.12+
- Node.js 20+
- Go 1.22+
- Docker & Docker Compose *(altyapı için)*

### Docker ile Tam Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/themaden/Terminal.git
cd Terminal

# 2. .env dosyasını oluştur
cp .env.example .env
# POSTGRES_PASSWORD, OPENAI_API_KEY ve SECRET_KEY değerlerini doldur

# 3. Tüm servisleri başlat
docker compose up -d

# 4. Örnek veri yükle (isteğe bağlı)
docker exec jetnexus-decision-engine python -m app.db.seed
```

| Servis | URL |
|---|---|
| Frontend Dashboard | http://localhost:3000 |
| API Swagger UI | http://localhost:8000/docs |
| Decision Engine | http://localhost:8000 |
| Ingestion Service | http://localhost:8002 |

---

## Bağımsız Servis Başlatma

Docker olmadan da her servis kendi runtime'ıyla çalışır.

### Decision Engine (FastAPI + SQLite fallback)

```bash
cd services/decision-engine
pip install -r requirements.txt

# SQLite ile çalıştır (Redis/Kafka olmadan)
DATABASE_URL=sqlite+aiosqlite:///aeroagent.sqlite3 \
APP_ENV=development \
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

### Ingestion Service (Go)

```bash
cd services/ingestion-service
go mod download
go run ./cmd/server/main.go
```

---

## Proje Yapısı

```
jetnexus-ai/
├── services/
│   ├── decision-engine/              # Python/FastAPI — Karar Motoru
│   │   └── app/
│   │       ├── agents/               # AI ajan koordinasyonu (CrewAI)
│   │       ├── api/routes/           # REST uç noktaları
│   │       │   ├── crisis.py         # Kriz yönetimi
│   │       │   ├── flights.py        # Uçuş verileri
│   │       │   ├── hub_control.py    # HUB bağlantı kontrolü
│   │       │   ├── iocc.py           # Operasyon kontrol merkezi
│   │       │   ├── pcc.py            # Yolcu destek merkezi
│   │       │   └── revenue.py        # Gelir etki analizi
│   │       ├── db/                   # ORM modelleri, seed, migrations
│   │       ├── guardrails/           # PII filtre, prompt guard, rate limit
│   │       ├── models/               # Pydantic şemaları
│   │       ├── optimization/         # MILP solver (PuLP/CBC)
│   │       ├── regulations/          # EU261 motoru ve validator
│   │       ├── rules/                # MCT, ACT, IRROPS karar kuralları
│   │       └── services/             # Kriz servis katmanı
│   │
│   ├── ingestion-service/            # Go — Veri Alım Servisi
│   │   └── internal/
│   │       ├── adapters/pss/         # Amadeus, Sabre, SITA, Custom
│   │       ├── adapters/normalizer   # PSS → ortak model dönüştürücü
│   │       ├── connectors/           # Weather, ATC, AODB, GDS
│   │       ├── handlers/             # Webhook ve PSS event handler'ları
│   │       ├── middleware/           # Auth, rate limiting
│   │       ├── models/               # FlightEvent, PassengerProfile
│   │       └── queue/                # Kafka producer
│   │
│   └── notification-service/         # Python — Bildirim Servisi
│       └── app/
│           ├── channels/             # SMS, WhatsApp, Email
│           └── templates/            # TR/EN mesaj şablonları
│
├── frontend/                         # Next.js 15 — Operasyon Paneli
│   └── src/app/
│       ├── dashboard/                # Ana özet ekranı
│       ├── crisis/                   # Kriz listesi ve detay
│       ├── flights/                  # Uçuş takibi
│       ├── passengers/               # Yolcu yönetimi
│       ├── optimization/             # MILP sonuç görünümü
│       ├── hub-control/              # HUB bağlantı ekranı
│       ├── iocc/                     # IOCC operasyon merkezi
│       ├── pcc/                      # Yolcu destek ekranı
│       ├── revenue/                  # Gelir etkisi ekranı
│       └── audit/                    # Karar denetim logu
│
├── infra/
│   └── docker/postgres-init.sql      # Veritabanı başlangıç şeması
├── docker-compose.yml
└── .env.example
```

---

## API Referansı

Tüm uç noktalar `http://localhost:8000/docs` adresindeki Swagger UI üzerinden interaktif olarak test edilebilir.

### Temel Uç Noktalar

| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/health` | Servis sağlık durumu |
| `GET` | `/api/v1/flights` | Aktif uçuş listesi |
| `POST` | `/api/v1/crisis` | Yeni kriz tetikle |
| `GET` | `/api/v1/crisis/{id}` | Kriz detayı ve karar geçmişi |
| `GET` | `/api/v1/iocc/crises/active` | IOCC aktif kriz görünümü |
| `POST` | `/api/v1/iocc/decisions/{id}/approve` | IOCC karar onaylama |
| `GET` | `/api/v1/hub/connections/at-risk` | Riskli transit bağlantılar |
| `GET` | `/api/v1/pcc/passengers/at-risk` | Riskli yolcu listesi |
| `POST` | `/api/v1/pcc/passengers/{pnr}/recover` | Yolcu kurtarma aksiyonu |
| `GET` | `/api/v1/revenue/impact/summary` | Genel maliyet özeti |

---

## Geliştirme Komutları

```bash
# Docker ile
docker compose up -d          # Tüm servisleri başlat
docker compose down           # Durdur
docker compose logs -f        # Canlı log takibi

# Test
cd services/decision-engine && pytest
cd services/notification-service && pytest

# Linting
cd services/decision-engine && ruff check .

# Frontend
cd frontend && npm run build  # Production build
cd frontend && npm run lint   # ESLint kontrolü
```

---

## Lisans

MIT License — detaylar için [LICENSE](LICENSE) dosyasına bakın.
