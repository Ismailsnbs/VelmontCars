# 📋 KKTC Araç Galerisi — Hazır Prompt'lar

## 🟢 LEAD AGENT BAŞLATMA (Tab 1)

### İlk Kez

```
Sen KKTC Araç Galerisi Yönetim Sistemi projesinin Lead Agent'ısın (Opus 4.6).

Bu proje KKTC'deki araç galerileri için multi-tenant bir yönetim paneli.
İki ana panel var: Master Panel (vergi, döviz, ülke, galeri yönetimi) ve Galeri Paneli (araç stok, ithalat maliyet hesaplama, ürün stok, müşteri, satış).

Detaylı proje spec'i SPEC.md dosyasında.

Görevlerin:
1. ORCHESTRATION.md ile checkpoint/hafıza yönetimi
2. Sub-agent'lara görev dağıtımı (model routing ile)
3. Kalite kontrolü
4. PROJECT_TREE.md ile proje ağacı takibi

Model routing:
- Basit görevler → Haiku (@coder-light, @test-runner, @docs, @tree-mapper)
- Karmaşık görevler → Sonnet (@coder-heavy, @tester, @reviewer)

Şimdi:
1. CLAUDE.md oku (proje beyni)
2. ORCHESTRATION.md oku (görev tablosu)
3. SPEC.md oku (detaylı proje tanımı — enum'lar, modeller, API endpoint'leri, vergi yapısı)
4. Durumu raporla
5. Faz 1 (Temel Altyapı) ile başla — T-001'den itibaren sırasıyla ata
```

### Devam Etme (Her Session Başı)
```
/resume
```

---

## 🔵 FAZ BAZLI GÖREV PROMPT'LARI

### Faz 1: Temel Altyapı

```
/delegate coder-light "T-001: Monorepo kurulumu. pnpm workspace oluştur: apps/web (Next.js 14), apps/api (Express+TS), packages/shared (types). Root package.json scripts: dev (concurrently), build. pnpm-workspace.yaml. Root tsconfig.json."
```

```
/delegate coder-light "T-005: Docker Compose oluştur: postgresql:15 (port 5432, db: kktc_galeri, user: postgres, pass: postgres), redis:7 (port 6379). Volumes ile data persistence. .env.example dosyası (DATABASE_URL, REDIS_URL, JWT_SECRET, CLOUDINARY_*, EXCHANGE_RATE_API_KEY)."
```

```
/delegate coder-heavy "T-006: Prisma schema yaz — SPEC.md'deki veritabanı şemasını BİREBİR uygula. 12 enum: UserRole, RateType, VehicleCategory, VehicleStatus, FuelType, Transmission, DocumentType, ExpenseType, MovementType, ProductCategory, NotificationType, NotificationPriority, SubscriptionType. 20 model: TaxRate, TaxRateHistory, OriginCountry, ExchangeRate, ExchangeRateSettings, PlatformNotification, NotificationRead, AuditLog, Gallery, User, TaxSnapshot, Vehicle, VehicleImage, VehicleDocument, VehicleExpense, ImportCalculation, Product, StockMovement, Customer, Sale. Tüm ilişkileri, @unique, @default, onDelete: Cascade kurallarını SPEC.md'den al."
```

```
/delegate coder-light "T-007: Prisma seed data oluştur. Vergi oranları: KDV binek %20, KDV ticari %16, Gümrük AB %0 / diğer %10, FIF kademeli (0-1000cc:%15, 1001-1600cc:%18, 1601-2000cc:%22, 2001-2500cc:%25, 2500+cc:%30), GKK %2.5, Rıhtım %4.4, Genel FIF cc×2.03, Bandrol 33.5TL. Ülkeler: JP(gümrük:%10,nakliye:550-650), GB(%10,400-500), DE(%0,350-450), TR(%0,200-300), KR(%10,600-700), US(%10,800-1000). Döviz: USD, EUR, GBP, TL. Örnek galeri + MASTER_ADMIN kullanıcı."
```

```
/delegate coder-heavy "T-008 + T-009: JWT Auth sistemi. Register (email+password+name+role), Login (email+password → access+refresh token), Refresh, Me endpoint. bcrypt hash. Access token 15dk, Refresh 7gün. auth.middleware.ts (JWT verify), role.middleware.ts (UserRole enum kontrol — 6 rol: MASTER_ADMIN, GALLERY_OWNER, GALLERY_MANAGER, SALES, ACCOUNTANT, STAFF), gallery.middleware.ts (galleryId'yi token'dan alıp req'e ekle, tüm query'lerde filtre)."
```

### Faz 4: Maliyet Hesaplama (KRİTİK)

```
/delegate coder-heavy "T-037: ImportCalculation service — TAM vergi hesaplama motoru. SPEC.md'deki vergi yapısını BİREBİR uygula. Giriş: FOB, currency, originCountry, engineCC, vehicleType (PASSENGER/COMMERCIAL), modelYear, shippingCost, insuranceCost. Hesaplama: CIF=FOB+nakliye+sigorta. Gümrük=CIF×rate (ülkeye göre). FIF=CIF×rate (cc'ye göre kademeli: 0-1000:%15, 1001-1600:%18, 1601-2000:%22, 2001-2500:%25, 2500+:%30). KDV=(CIF+Gümrük+FIF)×rate (binek:%20, ticari:%16). GKK=CIF×%2.5. Rıhtım=CIF×%4.4. GenelFIF=cc×2.03TL÷dövizKuru. Bandrol=33.5TL÷dövizKuru. Doğrulama: Toyota Corolla 1600cc JP FOB $6000 → toplam ~$10,864."
```

---

## 🔴 SUPERVISOR (Tab 2)

```
Sen KKTC Araç Galerisi projesinin Supervisor'ısın (Opus 4.6).

ORCHESTRATION.md, PROJECT_TREE.md ve SPEC.md oku. Kontrol et:

1. Checkpoint bütünlüğü — atlama var mı?
2. Görev tablosu tutarlılığı — durum doğru mu?
3. Model routing — basit iş Haiku'da, karmaşık Sonnet'te mi?
4. Multi-tenant güvenlik — her query'de galleryId filtresi var mı?
5. Vergi hesaplama — SPEC.md'deki formüller doğru mu? Örnek hesaplama tutuyor mu?
6. Prisma schema — SPEC.md ile birebir mi? İlişkiler doğru mu?
7. API güvenlik — tüm endpoint'lerde auth+role middleware var mı?
8. Yetki matrisi — SPEC.md G7.2 ile uyumlu mu?
9. PROJECT_TREE.md güncel mi? Uyarı var mı?
10. Risk ve bottleneck

Karar: ✅ ONAY / ⚠️ UYARI / ❌ RED
Her bulgu için spesifik dosya ve satır referansı ver.
```

---

## ⚡ SIK KULLANILAN KOMUTLAR

```
/resume
```
```
/status
```
```
/checkpoint "Faz 1 tamamlandı: monorepo, Prisma, auth, layout hazır"
```
```
/tree full
```
```
/impact apps/api/src/services/calculator.service.ts
```
```
/do Vehicle listesi grid görünümünü responsive yap
```
```
Bağlam doluyor. Detaylı checkpoint yaz.
```
