# 🛫 Aero-Agent Mimari ve Sistem Tasarımı Dokümantasyonu

Bu belge, Aero-Agent (Otonom Havacılık Kriz Yönetim Sistemi) platformunun mimarisini, veri akışlarını, veri katmanını ve optimizasyon prensiplerini açıklamaktadır.

---

## 1. Yüksek Düzey Mimari Tasarım (High-Level Architecture)

Aero-Agent, havacılık webhook'larından saniyede binlerce istek alabilecek şekilde **Event-Driven (Olay Güdümlü)** ve **Mikroservis** mimarisi ile tasarlanmıştır.

```
                  ┌──────────────────────────────┐
                  │   Amadeus/Sabre Webhook API  │
                  └──────────────┬───────────────┘
                                 │ HTTP POST
                                 ▼
                  ┌──────────────────────────────┐
                  │ Go Webhook Ingestion Service │
                  └──────────────┬───────────────┘
                                 │ High-Throughput Publish
                                 ▼
                        [ Apache Kafka ]
                      (Topic: flight-events)
                                 │
                                 ▼ Consumer
                  ┌──────────────────────────────┐
                  │  FastAPI Decision Engine     │
                  │                              │
                  │  - PuLP MILP Cost Optimizer  │
                  │  - CrewAI Multi-Agent Brain  │
                  └──────────────┬───────────────┘
                                 ├────────────────────────┐
                                 │ gRPC / REST            │ Notification Event
                                 ▼                        ▼
                        ┌────────┴────────┐      ┌─────────────────┐
                        │ Core Data Store │      │ Twilio SMS / WA │
                        │  (PostgreSQL)   │      │  Notif Service  │
                        └─────────────────┘      └─────────────────┘
```

---

## 2. Mikroservis Bileşenleri

### A. Go Ingestion Service (Port 8002)
- **Rolü**: Havayolu dış sistemlerinden (Amadeus, Sabre) veya uçuş kontrol sistemlerinden gelen anlık webhook isteklerini (uçuş iptal/rötar) karşılayan ilk kapıdır.
- **Teknoloji**: Go (Golang) + Gin Framework + segmentio/kafka-go.
- **Neden**: Kriz anlarında saniyede binlerce istek geldiğinde düşük CPU/Memory tüketimi, yüksek concurrency ve ultra düşük gecikme sağlamak için Go seçilmiştir.

### B. Decision Engine - Ana Beyin (Port 8000)
- **Rolü**: Uçuş iptal veya rötarlarını işleyip PuLP kullanarak matematiksel optimizasyonla koltuk atar ve CrewAI benzeri Multi-Agent yapısı ile kararları denetler.
- **Teknoloji**: Python 3.12 + FastAPI + PuLP (CBC Solver) + Async SQLAlchemy.

### C. Notification Service (Port 8001)
- **Rolü**: Karar onaylandığında yolcuların telefonlarına WhatsApp Business veya SMS formatında bildirim gönderilmesini sağlar. Twilio Throttling ve kuyruklama mekanizmasına sahiptir.
- **Teknoloji**: Python + FastAPI + Twilio SDK.

### D. Next.js Dashboard Frontend (Port 3000)
- **Rolü**: Havayolu operasyon direktörlerinin krizleri anlık izleyip tek tıkla onaylayabileceği (Human-in-the-Loop) havacılık kulesi estetiğine sahip koyu tema kontrol paneli.
- **Teknoloji**: Next.js 15 (TypeScript) + React Server Components.

---

## 3. Optimizasyon Motoru (MILP)

Kriz yönetiminin kalbi PuLP ile modellenen **Mixed Integer Linear Programming (MILP)** formülasyonudur.

### Karar Değişkenleri
- $x_{p, f} \in \{0, 1\}$: Yolcu $p$, alternatif uçuş $f$'ye atanırsa $1$, atanmazsa $0$.
- $x_{p, 0} \in \{0, 1\}$: Yolcuya uçuş atanmayıp bileti iade edilirse (Refund) $1$, aksi halde $0$.

### Amaç Fonksiyonu (Cost Minimization)
Amaç havayolunun operasyonel ve tazminat maliyetini minimize etmektir:

$$\min \sum_{p} \sum_{f} C_{p, f} \cdot x_{p, f}$$

Burada $C_{p, f}$ şu alt maliyetlerin toplamıdır:
- **Gecikme Süresi Maliyeti**: Yolcunun asıl kalkış saatinden ne kadar rötarlı gideceğiyle orantılı süre maliyeti.
- **EU261 Tazminatı**: Gecikme 3 saati aşarsa mesafe bazlı hesaplanan tazminat.
- **Konaklama / Otel Maliyeti**: Alternatif uçuş ertesi güne sarkıyorsa otel gideri.
- **VIP/Sadakat Cezası**: Platinum/Gold gibi VIP yolcuların kalitesiz bir uçuşa atlanmasını engelleyen yapay ceza maliyeti.

### Kısıtlamalar (Constraints)
1. **Tek Atama Kısıtlaması**: Her yolcuya tam olarak 1 aksiyon (uçuş veya iade) atanmalıdır.
   $$\sum_{f} x_{p, f} + x_{p, 0} = 1 \quad \forall p$$
2. **Kapasite Kısıtlaması**: Hiçbir alternatif uçuşun müsait koltuk limiti aşılamaz.
   $$\sum_{p} x_{p, f} \le \text{AvailableSeats}_f \quad \forall f$$

---

## 4. Multi-Agent AI Güvenliği (Guardrails)

MILP optimal koltuk atamasını yaptıktan sonra kararlar multi-agent AI ekibine gönderilir:
1. **Rebooking Agent**: Rezervasyon doğruluğunu kontrol eder.
2. **Compensation Agent**: EU261 tazminatını teyit eder.
3. **Communication Agent**: Yolcuya gönderilecek empatik ve net mesajı (TR/EN) üretir.
4. **Compliance Agent**: Kararın havacılık regülasyonlarına tam uygunluğunu denetleyip bir denetim raporu oluşturur.

**Prompt Injection & PII Koruma**: Tüm LLM girdileri prompt shield katmanıyla injection saldırılarına karşı taranırken, veritabanına kaydedilen PII (telefon, email, isim) verileri AES-256 ile şifrelenir.
