# JetNexus AI

### Otonom Havacılık IRROPS Yönetim Platformu

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)

> Uçuş krizlerini otomatik tespit eden, 4-derece öncelik hiyerarşisiyle MILP optimizasyonu yapan, EASA/IATA/EU261 uyumlu kararlar üreten ve operasyon merkezlerini tek panelden yöneten çok katmanlı havacılık zekâ platformu.

---

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Sistem Mimarisi](#sistem-mimarisi)
- [AI Nasıl Çalışır](#ai-nasıl-çalışır)
- [IRROPS Modülleri](#irrops-modülleri)
- [Frontend Sayfaları](#frontend-sayfaları)
- [Servisler](#servisler)
- [EU261 Tazminat Motoru](#eu261-tazminat-motoru)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [API Referansı](#api-referansı)
- [Proje Yapısı](#proje-yapısı)

---

## Genel Bakış

JetNexus AI; uçuş iptali, gecikmesi veya bağlantı kopması gibi IRROPS senaryolarında şu adımları **otomatik** olarak yürütür:

1. **Otomatik Kriz Tespiti** — Scheduler her 5 dakikada uçuş ve hava verilerini kontrol eder; gecikme > 30 dk veya kritik hava tehdidi tespit edince krizi kendisi açar.
2. **4-Derece Öncelik** — UM/Engelli → Elite/Platinum → Aile Grupları → Standart yolcu sıralaması.
3. **MILP Optimizasyonu** — PuLP/CBC solver ile en düşük maliyetli yeniden rezervasyon planı saniyeler içinde üretilir.
4. **Multi-Agent AI** — GPT-4o veya Llama 3.2; rebooking doğrulama, EU261 denetimi, TR/EN bildirim metni ve uyum skoru üretir.
5. **Mürettebat Kurtarma** — EASA FTL (13s görev / 10s dinlenme) denetimiyle otomatik ekip rotasyonu.
6. **Bagaj Uzlaştırma** — IATA Resolution 753 uyumlu çanta-yolcu eşleşme ve yönlendirme emirleri.
7. **Etki Grafiği** — Domino etkisi, bağlantı kaçırma ve aile bölünme riski hesabı.
8. **Bildirim** — Twilio SMS ve WhatsApp ile yolculara anlık bildirim.

---

## Sistem Mimarisi

```
┌──────────────────────────────────────────────────────┐
│              Dış Sistemler                           │
│   Cirium · Amadeus · OpenAI · Twilio · Weather API  │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   Ingestion Service     │
          │   Go / Gin — :8002      │
          │   PSS Adapter · Kafka   │
          └────────────┬────────────┘
                       │  Apache Kafka
          ┌────────────▼────────────────────────────┐
          │         Decision Engine                  │
          │         Python / FastAPI — :8000         │
          │                                          │
          │  ┌─────────────┐  ┌──────────────────┐  │
          │  │  Scheduler  │  │   MILP Solver    │  │
          │  │  (5 dk poll)│  │   PuLP / CBC     │  │
          │  └─────────────┘  └──────────────────┘  │
          │  ┌─────────────────────────────────────┐ │
          │  │        AI Agent Koordinatörü         │ │
          │  │  Rebooking · Compensation ·          │ │
          │  │  Communication · Compliance          │ │
          │  └─────────────────────────────────────┘ │
          │  ┌───────────┐ ┌────────┐ ┌───────────┐  │
          │  │ Crew      │ │Baggage │ │  Impact   │  │
          │  │ Recovery  │ │ IATA   │ │  Graph    │  │
          │  │ EASA FTL  │ │  753   │ │  Domino   │  │
          │  └───────────┘ └────────┘ └───────────┘  │
          └──────┬────────────────┬───────────────────┘
                 │                │
          ┌──────▼──────┐  ┌──────▼──────────────┐
          │  SQLite /   │  │ Notification Service │
          │  PostgreSQL │  │ Python — :8001        │
          └─────────────┘  │ SMS · WhatsApp        │
                           └──────────────────────┘
                                    │
          ┌─────────────────────────▼────────────────┐
          │           Frontend (Next.js 16)           │
          │  Dashboard · IOCC · PCC · Mürettebat ·    │
          │  Bagaj · Etki Grafiği · Hub · Prediction  │
          │  :3000                                    │
          └──────────────────────────────────────────┘
```

---

## AI Nasıl Çalışır

### Katman 1 — MILP Matematiksel Optimizer

Kriz tetiklendiğinde ilk çalışan katman. Saniyeler içinde tamamlanır.

```
Yolcular + Alternatif Uçuşlar
         ↓
   PuLP / CBC Solver
         ↓
Maliyet minimize, öncelik maximize

Kısıtlar:
  • Tier 1 (UM/Engelli)  → hard constraint: iade yasak
  • Tier 3 (Aile grubu)  → equality: aynı uçuşa
  • Platinum refund ceza → 4x
  • Uçuş kapasitesi      → aşılamaz
```

### Katman 2 — Multi-Agent AI (GPT-4o / Llama 3.2)

MILP kararları hazır olunca her yolcu için 4 ajan sırayla çalışır:

| Ajan | Görev |
|------|-------|
| **Rebooking Agent** | Uçuş atamasını doğrular, lounge/upgrade önerir |
| **Compensation Agent** | EU261 tazminat hesabını denetler |
| **Communication Agent** | Türkçe + İngilizce SMS metni üretir |
| **Compliance Agent** | IATA/EU261 uyum skoru verir (0.0–1.0) |

**LLM Öncelik Zinciri:**
```
OPENAI_API_KEY var → GPT-4o
Ollama kurulu      → Llama 3.2 (yerel, ücretsiz)
İkisi de yok       → Kural tabanlı fallback (sistem yine çalışır)
```

### Otomatik Kriz Tetikleyici

```python
# Scheduler her 5 dakikada çalışır
if flight.delay_minutes > 30:
    → CrisisService.trigger_crisis()   # otomatik kriz açılır

if weather.severity == CRITICAL and time_to_impact < 90:
    → CrisisService.trigger_crisis()   # etkilenen uçuşlar için kriz
```

---

## IRROPS Modülleri

### Mürettebat Kurtarma (EASA FTL)
- 60 kişilik simüle ekip havuzu (kaptan, yardımcı pilot, kabin)
- Maksimum görev süresi: 13 saat | Minimum dinlenme: 10 saat
- Tip sertifikası eşleşmesi (B737, A320, A330, B777, B787)
- `GET /api/v1/crew/availability` · `POST /api/v1/crew/recover/{flight}`

### Bagaj Uzlaştırma (IATA 753)
- Yolcu başına bagaj takibi ve çanta-yolcu eşleşme
- Kriz sonrası otomatik yönlendirme emirleri
- `GET /api/v1/baggage/status/{pnr}` · `POST /api/v1/baggage/reconcile/{crisis_id}`

### Etki Grafiği (Domino Etkisi)
- Cascade zinciri: hangi uçuş hangi uçuşu etkiliyor
- Bağlantı kaçırma riski ve aile bölünme uyarıları
- EU261 toplam yükümlülük tahmini
- `GET /api/v1/impact/{crisis_id}`

### Soft Hold & Senaryo Havuzu
- Kriz öncesi alternatif kapasite rezervasyonu
- "Ya iptal olursa?" senaryoları ön hesaplama
- `POST /api/v1/prediction/soft-hold/{flight}` · `POST /api/v1/prediction/scenario-pool/{flight}`

### 4-Derece Öncelik Hiyerarşisi

| Derece | Kapsam | Kural |
|--------|--------|-------|
| **Tier 1** | UM çocuk / Engelli | Hard constraint — asla iade yok |
| **Tier 2** | Platinum / Gold | Refund ceza katsayısı 4x / 2.5x |
| **Tier 3** | Aile / grup | Bölünme yasak — aynı uçuşa |
| **Tier 4** | Standart | Maliyet optimizasyonu |

---

## Frontend Sayfaları

| Sayfa | URL | İçerik |
|-------|-----|---------|
| **Dashboard** | `/` | KPI kartları, dünya haritası, aktif krizler, yolcular |
| **IOCC** | `/iocc` | Tüm krizler, karar onaylama/reddetme |
| **Yolcular** | `/pcc` | Risk altındaki yolcular, EU261 tazminat |
| **Mürettebat** | `/crew` | EASA FTL uyum, ekip ataması, kurtarma planı |
| **Bagaj** | `/baggage` | PNR sorgulama, IATA 753 uzlaştırma |
| **Etki Grafiği** | `/impact` | Domino zinciri, aile bölünme riski |
| **Hub Kontrol** | `/hub-control` | Transit bağlantı riski |
| **Risk Tahmini** | `/prediction` | Hava tehdidi, soft-hold, senaryo havuzu |
| **Oteller** | `/hotels` | Otel kapasitesi ve rezervasyon |
| **Otobüsler** | `/buses` | Transfer araç filosu |
| **Kayıtlar** | `/audit` | Karar denetim logu |

---

## Servisler

### Decision Engine — `services/decision-engine` (Python/FastAPI) · Port 8000

| Modül | Açıklama |
|-------|----------|
| `app/agents/` | Multi-agent koordinatör (GPT-4o / Llama fallback) |
| `app/optimization/` | MILP solver — 4-derece öncelik kısıtları |
| `app/api/routes/` | REST API (crisis, flights, crew, baggage, impact, prediction...) |
| `app/integrations/scheduler.py` | Otomatik kriz tetikleyici, hava durumu izleme |
| `app/services/crisis_service.py` | Kriz akış yönetimi, öncelik sıralama |
| `app/db/` | SQLAlchemy async ORM, SQLite (dev) / PostgreSQL (prod) |

### Ingestion Service — `services/ingestion-service` (Go) · Port 8002

PSS sistemlerinden (Amadeus, Sabre, SITA) ve dış kaynaklardan veri alan Kafka kapı servisi.

### Notification Service — `services/notification-service` (Python) · Port 8001

Kafka'yı dinleyen Twilio SMS + WhatsApp bildirim servisi.

---

## EU261 Tazminat Motoru

| Mesafe | Gecikme | Tazminat |
|--------|---------|----------|
| < 1.500 km | ≥ 3 saat / iptal | **€250** |
| 1.500 – 3.500 km | ≥ 3 saat / iptal | **€400** |
| > 3.500 km | 3–4 saat arası | **€300** |
| > 3.500 km | ≥ 4 saat / iptal | **€600** |

Olağanüstü haller (fırtına, ATC kısıtı, güvenlik) otomatik tespit edilir; tazminattan muafiyet uygulanır ancak **bakım hakkı** (otel, yemek) her durumda geçerlidir.

---

## Hızlı Başlangıç

### Docker ile (Önerilen)

```bash
git clone https://github.com/themaden/Terminal.git
cd Terminal
cp .env.example .env
# .env içine POSTGRES_PASSWORD ekle

docker compose up -d
```

| Servis | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| Decision Engine | http://localhost:8000 |

### Docker Olmadan (SQLite)

```bash
# Backend
cd services/decision-engine
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (ayrı terminal)
cd frontend
npm install
npm run dev
```

### Gerçek Veriye Geçmek

`.env` dosyasına key eklemek yeterli — sistem otomatik olarak mock'tan gerçek veriye geçer:

```env
OPENAI_API_KEY=sk-...          # GPT-4o devreye girer
CIRIUM_APP_ID=...              # Gerçek uçuş verisi
CIRIUM_APP_KEY=...
AMADEUS_CLIENT_ID=...          # Amadeus PSS
TWILIO_ACCOUNT_SID=...         # SMS/WhatsApp
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

---

## API Referansı

Tüm endpointler `http://localhost:8000/docs` Swagger UI üzerinden test edilebilir.

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/health` | Servis sağlık durumu |
| `POST` | `/api/v1/crisis/trigger` | Kriz tetikle |
| `GET` | `/api/v1/crisis/active` | Aktif krizler |
| `GET` | `/api/v1/crew/availability` | Müsait mürettebat |
| `POST` | `/api/v1/crew/recover/{flight}` | Ekip kurtarma planı |
| `GET` | `/api/v1/baggage/status/{pnr}` | Bagaj durumu |
| `POST` | `/api/v1/baggage/reconcile/{crisis_id}` | Kriz bagaj uzlaştırma |
| `GET` | `/api/v1/impact/{crisis_id}` | Etki grafiği |
| `GET` | `/api/v1/prediction/weather-forecast` | Hava tehdidi tahmini |
| `POST` | `/api/v1/prediction/soft-hold/{flight}` | Kapasite soft-hold |
| `GET` | `/api/v1/pcc/passengers/at-risk` | Risk altındaki yolcular |
| `GET` | `/api/v1/iocc/dashboard` | IOCC özet |

---

## Proje Yapısı

```
Terminal/
├── services/
│   ├── decision-engine/          # Python/FastAPI — Karar Motoru
│   │   └── app/
│   │       ├── agents/           # Multi-agent koordinatör + promptlar
│   │       ├── api/routes/       # crisis, crew, baggage, impact, prediction...
│   │       ├── db/               # ORM modelleri, seed data
│   │       ├── integrations/     # Scheduler, Cirium, Amadeus
│   │       ├── models/           # Pydantic şemaları (4-derece öncelik alanları)
│   │       ├── optimization/     # MILP solver (4-tier constraints)
│   │       └── services/         # CrisisService, öncelik sıralama
│   │
│   ├── ingestion-service/        # Go — PSS & Dış Veri Alımı
│   └── notification-service/     # Python — Twilio SMS/WhatsApp
│
├── frontend/                     # Next.js 16
│   ├── app/
│   │   ├── page.tsx              # Dashboard (harita + KPI + krizler)
│   │   ├── crew/                 # Mürettebat kurtarma
│   │   ├── baggage/              # Bagaj uzlaştırma
│   │   ├── impact/               # Etki grafiği
│   │   ├── iocc/                 # Operasyon kontrol merkezi
│   │   ├── pcc/                  # Yolcu destek merkezi
│   │   └── prediction/           # Risk tahmini
│   ├── components/dashboard/     # Sidebar, Header, FlightMap, StatsBar...
│   └── lib/api.ts                # Tüm API tipleri ve çağrı fonksiyonları
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Lisans

MIT License — detaylar için [LICENSE](LICENSE) dosyasına bakın.
