# ✈️ JetNexus AI

### Otonom Havacılık Kriz Yönetim Sistemi

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![License](https://img.shields.io/badge/Lisans-MIT-f59e0b?style=for-the-badge)](LICENSE)

> **Çok Ajanlı AI · MILP Optimizasyonu · EU261 Uyumluluğu · Gerçek Zamanlı İletişim**
>
> Uçuş krizlerini saniyeler içinde çözen, yolcu haklarını otomatik koruyan otonom havacılık zekâ platformu.

---

## İçindekiler

- [Özellikler](#-özellikler)
- [Sistem Mimarisi](#-sistem-mimarisi)
- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [🔑 .env Kurulum Rehberi](#-env-kurulum-rehberi)
- [Bağımsız Servis Başlatma](#-bağımsız-servis-başlatma)
- [Proje Yapısı](#-proje-yapısı)
- [AI Agent Mimarisi](#-ai-agent-mimarisi)
- [EU261 Tazminat Tablosu](#-eu261-tazminat-tablosu)
- [Geliştirme Komutları](#-geliştirme-komutları)
- [Lisans](#-lisans)

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| 🤖 **Çok Ajanlı Karar Motoru** | CrewAI tabanlı ajan orkestrasyonu ile saniyeler içinde aksiyon |
| 📊 **MILP Optimizasyonu** | PuLP/CBC ile koltuk ve rezervasyon maliyeti minimizasyonu |
| ⚖️ **EU261 Uyumluluğu** | Mesafe ve gecikme sınıfına göre otomatik tazminat hesaplama |
| 📡 **Gerçek Zamanlı Bildirim** | SMS/WhatsApp üzerinden Türkçe/İngilizce yolcu iletişimi |
| 🖥️ **Komuta Merkezi Dashboard** | Next.js 15 tabanlı dark-mode HUD arayüzü |
| 🔒 **Güvenlik Katmanı** | AES-256 şifreleme, PII maskeleme, prompt injection koruması |
| 📈 **Sağlık İzleme** | Prometheus + Grafana ile canlı servis metrikleri |

---

## 🏗️ Sistem Mimarisi

```
                   ┌──────────────────────────────┐
                   │         Dış Sistemler         │
                   │  Amadeus · Sabre · OpenAI     │
                   └───────────┬──────────────────┘
                               │
         ┌─────────────────────┼────────────────────┐
         ▼                     ▼                    ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Ingestion      │  │  Decision        │  │  Notification    │
│  Service (Go)   │  │  Engine (FastAPI) │  │  Service (Python)│
│  Webhook · API  │  │  MILP · EU261    │  │  SMS · WhatsApp  │
└────────┬────────┘  └────────┬─────────┘  └──────────────────┘
         │                    │
         └──────────┬─────────┘
                    ▼
         ┌─────────────────────┐
         │     Apache Kafka    │
         └──────┬──────────────┘
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
┌─────────┐ ┌───────┐ ┌──────────┐
│Postgres │ │ Redis │ │ Next.js  │
│  (Core) │ │(Cache)│ │  Panel   │
└─────────┘ └───────┘ └──────────┘
```

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- 🐍 Python 3.12+
- 🟢 Node.js 20+
- 🐹 Go 1.22+
- 🐳 Docker & Docker Compose
- 🔑 OpenAI API Key *(veya yerel Ollama)*

### Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/themaden/Terminal.git
cd jetnexus-ai

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle: OPENAI_API_KEY, DB şifreleri vb.

# 3. Tüm servisleri Docker ile başlat
make dev

# 4. Örnek veri yükle
make seed

# 5. Kriz simülasyonu çalıştır
make simulate
```

> 🌐 **Dashboard:** `http://localhost:3000`
>
> 📡 **API Docs:** `http://localhost:8000/docs`

---

## 🔑 .env Kurulum Rehberi

> Projeyi çalıştırmadan önce proje klasöründe bir `.env` dosyası oluşturman gerekiyor.
> Bu dosya **asla GitHub'a yüklenmez** — tamamen gizlidir.

### Adım 1 — .env Dosyasını Oluştur

```bash
# Proje klasöründe bu komutu çalıştır:
copy NUL .env       # Windows
# veya
touch .env          # Mac/Linux
```

### Adım 2 — Aşağıdaki Değerleri Doldur

`.env` dosyasını bir metin editörüyle aç ve şu içeriği yapıştır:

```env
# ─────────────────────────────────────────────────
# JetNexus AI — .env (Bu dosyayı GitHub'a yükleme!)
# ─────────────────────────────────────────────────

# ── VERİTABANI (PostgreSQL) ───────────────────────
POSTGRES_DB=jetnexus
POSTGRES_USER=jetnexus
POSTGRES_PASSWORD=buraya_guclu_bir_sifre_yaz
DATABASE_URL=postgresql+asyncpg://jetnexus:buraya_guclu_bir_sifre_yaz@localhost:5432/jetnexus

# ── REDIS ────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0

# ── KAFKA ────────────────────────────────────────
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# ── OPENAI API (Zorunlu - AI kararları için) ─────
# 👉 https://platform.openai.com/api-keys adresinden al
OPENAI_API_KEY=sk-proj-...buraya_kendi_openai_keyini_yaz...
LLM_MODEL=gpt-4o

# ── TWILIO SMS/WhatsApp (İsteğe bağlı) ───────────
# 👉 https://console.twilio.com adresinden al
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ── GÜVENLİK ANAHTARLARI (Zorunlu) ──────────────
# Aşağıdaki komutlarla üret:
# python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=buraya_uret
# python -c "import secrets; print(secrets.token_hex(16))"
AES_ENCRYPTION_KEY=buraya_uret_16_byte_hex
# python -c "import secrets; print(secrets.token_urlsafe(32))"
API_KEY=buraya_uret

# ── UYGULAMA ─────────────────────────────────────
APP_ENV=development
APP_DEBUG=true
LOG_LEVEL=INFO
```

### Hangi Değerler Zorunlu?

| Değişken | Zorunlu mu? | Nereden Alınır? | Açıklama |
|---|:---:|---|---|
| `POSTGRES_PASSWORD` | ✅ **Evet** | Kendin belirle | En az 12 karakter, güçlü bir şifre |
| `OPENAI_API_KEY` | ✅ **Evet** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | AI karar motoru için gerekli |
| `SECRET_KEY` | ✅ **Evet** | `python -c "import secrets; print(secrets.token_hex(32))"` | JWT ve session güvenliği |
| `AES_ENCRYPTION_KEY` | ✅ **Evet** | `python -c "import secrets; print(secrets.token_hex(16))"` | Yolcu verisi şifreleme |
| `API_KEY` | ✅ **Evet** | `python -c "import secrets; print(secrets.token_urlsafe(32))"` | Servisler arası kimlik doğrulama |
| `TWILIO_ACCOUNT_SID` | ⚙️ İsteğe bağlı | [console.twilio.com](https://console.twilio.com) | SMS/WhatsApp bildirimi için |
| `TWILIO_AUTH_TOKEN` | ⚙️ İsteğe bağlı | [console.twilio.com](https://console.twilio.com) | SMS/WhatsApp bildirimi için |
| `REDIS_URL` | ✅ **Evet** | Docker otomatik başlatır | Cache servisi |
| `KAFKA_BOOTSTRAP_SERVERS` | ✅ **Evet** | Docker otomatik başlatır | Mesaj kuyruğu |

### Güvenlik Anahtarlarını Hızlıca Üret

```bash
# SECRET_KEY için:
python -c "import secrets; print(secrets.token_hex(32))"

# AES_ENCRYPTION_KEY için:
python -c "import secrets; print(secrets.token_hex(16))"

# API_KEY için:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

> ⚠️ **Önemli:** `.env` dosyasını **hiçbir zaman** GitHub, Discord, Slack veya başka bir yere paylaşma!

---

## 🔧 Bağımsız Servis Başlatma


**Decision Engine (FastAPI)**

```bash
cd services/decision-engine
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend Dashboard (Next.js)**

```bash
cd frontend
npm install
npm run dev
```

**Ingestion Service (Go)**

```bash
cd services/ingestion-service
go mod download
go run main.go
```

---

## 📁 Proje Yapısı

```
jetnexus-ai/
├── services/
│   ├── decision-engine/        # Python/FastAPI — Ana Karar Motoru
│   │   ├── app/agents/         # AI Agent koordinasyon katmanı
│   │   ├── app/optimization/   # MILP solver (PuLP/CBC)
│   │   ├── app/regulations/    # EU261 hesaplama motoru
│   │   └── app/guardrails/     # Güvenlik ve PII filtreleri
│   ├── ingestion-service/      # Go — Webhook & Dış API Alıcısı
│   └── notification-service/   # Python — SMS/WhatsApp Bildirim
├── frontend/                   # Next.js 15 — HUD Dashboard
│   └── src/
│       ├── app/                # App Router sayfaları
│       └── components/         # UI bileşenleri
├── infra/                      # Docker, K8s, Terraform
├── scripts/                    # Seed data & otomasyon
├── monitoring/                 # Prometheus & Grafana
├── proto/                      # gRPC tanımları
└── docs/                       # Mimari dokümantasyon
```

---

## 🤖 AI Agent Mimarisi

```
         ┌──────────────────────────────┐
         │       CoordinatorAgent        │
         │  Tüm ajanları orkestre eder   │
         └────┬──────────┬──────────────┘
              │          │
   ┌──────────┘          └──────────────────────┐
   ▼                     ▼                      ▼
┌───────────┐    ┌───────────────┐    ┌──────────────────┐
│ Rebooking │    │ Compensation  │    │  Communication   │
│  Agent    │    │    Agent      │    │     Agent        │
│ MILP ile  │    │ EU261 hesapla │    │ TR/EN bildirim   │
│ yeni uçuş │    │               │    │ mesajı oluştur   │
└───────────┘    └───────────────┘    └──────────────────┘
                                      ┌──────────────────┐
                                      │ Compliance Agent │
                                      │ Regülasyon denet │
                                      └──────────────────┘
```

| Agent | Sorumluluk |
|---|---|
| 🎯 **Coordinator** | Kriz akışını yönetir, ajan sırasını belirler |
| ✈️ **Rebooking** | MILP sonuçlarına göre en uygun uçuşa atar |
| 💰 **Compensation** | EU261 kurallarına göre tazminat hesaplar |
| 📢 **Communication** | TR/EN yolcu bildirim mesajları oluşturur |
| ⚖️ **Compliance** | Tüm kararların yasal uyumluluğunu denetler |

---

## ⚖️ EU261 Tazminat Tablosu

| Mesafe | Tazminat | Gecikme Koşulu |
|:---|:---:|:---|
| **< 1.500 km** | **€250** | ≥ 3 saat veya iptal |
| **1.500 – 3.500 km** | **€400** | ≥ 3 saat veya iptal |
| **> 3.500 km** | **€600** | ≥ 4 saat veya iptal |
| **> 3.500 km** | **€300** | 3–4 saat arası (%50 indirim) |

> AB üyesi ülkeden kalkan tüm uçuşlar EU261 kapsamındadır.

---

## ⌨️ Geliştirme Komutları

```bash
make dev          # Tüm servisleri başlat
make down         # Servisleri durdur
make test         # Test suite çalıştır
make seed         # Veritabanına örnek veri yükle
make simulate     # Kriz simülasyonu tetikle
make logs         # Tüm servis loglarını takip et
make clean        # Volume ve container temizliği
```

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında yayınlanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

*Built with ❤️ for Aviation Safety & Passenger Rights*
