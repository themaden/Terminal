<![CDATA[<div align="center">

# 🛫 Aero-Agent

### Otonom Havacılık Kriz Yönetim Sistemi

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Multi-Agent AI · MILP Optimization · EU261 Compliance · Real-time Notifications**

*Uçuş iptalleri veya rötar gibi operasyonel aksaklık anlarında devreye giren, saniyeler içinde karar veren ve yolcularla anında iletişim kuran tam kapsamlı bir kriz yönetim platformu.*

</div>

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                    ☁️  External Systems                         │
│     Amadeus/Sabre API    Twilio API     OpenAI GPT-4o          │
└──────┬──────────────────────┬─────────────────┬────────────────┘
       │                      │                 │
┌──────▼──────┐         ┌─────▼─────┐    ┌─────▼─────┐
│  📡 Go      │         │  📱 Notif  │    │  🧠 AI    │
│  Ingestion  │────────▶│  Service   │    │  Agents   │
│  Service    │  Kafka   │  (Python)  │    │  (CrewAI) │
└──────┬──────┘         └───────────┘    └─────┬─────┘
       │                                       │
       │         ┌────────────────────┐        │
       └────────▶│  🧠 Decision       │◀───────┘
                 │  Engine (FastAPI)   │
                 │  ┌──────────────┐  │
                 │  │ MILP Solver  │  │
                 │  │ (PuLP/CBC)   │  │
                 │  └──────────────┘  │
                 │  ┌──────────────┐  │
                 │  │ EU261 Engine │  │
                 │  └──────────────┘  │
                 └─────────┬──────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │ PostgreSQL │ │ Redis │ │  Kafka    │
        │    (Core)  │ │(Cache)│ │  (Queue)  │
        └───────────┘ └───────┘ └───────────┘
                           │
                    ┌──────▼──────┐
                    │  🎨 Next.js  │
                    │  Dashboard   │
                    │  (TypeScript) │
                    └──────────────┘
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Python 3.12+
- Node.js 20+
- Go 1.22+
- Docker & Docker Compose
- OpenAI API Key (veya Ollama)

### Kurulum

```bash
# 1. Repo'yu klonla
git clone https://github.com/your-org/aero-agent.git
cd aero-agent

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle (API anahtarları vb.)

# 3. Tüm servisleri başlat
make dev

# 4. Örnek veri yükle
make seed

# 5. Kriz simülasyonu çalıştır
make simulate
```

### Bağımsız Servisler

```bash
# Sadece Decision Engine
cd services/decision-engine
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Sadece Frontend
cd frontend
npm install
npm run dev
```

## 📂 Proje Yapısı

```
aero-agent/
├── services/
│   ├── decision-engine/     # 🧠 Python/FastAPI - Ana Beyin
│   ├── ingestion-service/   # 📡 Go - Webhook Alıcı
│   └── notification-service/# 📱 Python - SMS/WhatsApp
├── frontend/                # 🎨 Next.js Dashboard
├── infra/                   # 🐳 Docker, K8s, Terraform
├── scripts/                 # 🔧 Seed data, Simülasyon
├── docs/                    # 📚 Dokümantasyon
├── monitoring/              # 📊 Prometheus, Grafana
└── proto/                   # 📡 gRPC tanımları
```

## 🤖 AI Agent Mimarisi

| Agent | Rol | Sorumluluk |
|-------|-----|------------|
| **Coordinator** | 🎯 Orkestratör | Tüm ajanları koordine eder, iş akışını yönetir |
| **Rebooking** | ✈️ Yeniden Rezervasyon | MILP sonuçlarına göre yolcuları yeni uçuşlara atar |
| **Compensation** | 💰 Tazminat | EU261 kurallarına göre tazminat hesaplar |
| **Communication** | 💬 İletişim | Yolculara gönderilecek mesajları oluşturur |
| **Compliance** | ⚖️ Uyumluluk | Tüm kararların regülasyona uygunluğunu denetler |

## ⚖️ EU261 Tazminat Tablosu

| Mesafe | Tazminat | Gecikme Şartı |
|--------|----------|---------------|
| < 1.500 km | €250 | ≥ 3 saat |
| 1.500 - 3.500 km | €400 | ≥ 3 saat |
| > 3.500 km | €600 | ≥ 4 saat |
| > 3.500 km | €300 | 3-4 saat (%50 indirim) |

## 🔧 Geliştirme Komutları

```bash
make dev        # Docker Compose ile başlat
make down       # Durdur
make test       # Tüm testleri çalıştır
make seed       # Örnek veri yükle
make simulate   # Kriz simülasyonu
make logs       # Log izle
```

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

<div align="center">
  <sub>Built with ❤️ for Aviation Safety</sub>
</div>
]]>
