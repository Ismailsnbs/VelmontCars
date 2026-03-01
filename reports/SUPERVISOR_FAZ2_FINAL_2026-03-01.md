# SUPERVISOR DENETİM RAPORU

**Tarih:** 2026-03-01 | **Saat:** 09:45
**Denetçi:** Supervisor (Opus 4.6)
**Kapsam:** CHECKPOINT-0 → CHECKPOINT-8 (T-001 ~ T-027)
**Mevcut Faz:** Faz 2 Tamamlandı (13/13 görev beyan) — Supervisor Onay Bekleniyor

---

## ÖZET SKOR TABLOSU

```
┌─────────────────────────┬────────┬────────┬────────┬────────┐
│ Kategori                │ KRİTİK │ UYARI  │ ÖNERİ  │ TOPLAM │
├─────────────────────────┼────────┼────────┼────────┼────────┤
│ Checkpoint Bütünlüğü    │   0    │   0    │   0    │   0    │
│ Görev Tablosu           │   1    │   0    │   0    │   1    │
│ Model Routing           │   0    │   0    │   0    │   0    │
│ Multi-Tenant Güvenlik   │   3    │   1    │   0    │   4    │
│ Vergi Hesaplama         │   0    │   0    │   0    │   0    │
│ Prisma Schema           │   2    │   2    │   2    │   6    │
│ API Güvenlik            │   3    │   5    │   1    │   9    │
│ PROJECT_TREE.md         │   1    │   0    │   0    │   1    │
│ Risk & Bottleneck       │   1    │   4    │   4    │   9    │
├─────────────────────────┼────────┼────────┼────────┼────────┤
│ TOPLAM                  │  11    │  12    │   7    │  30    │
└─────────────────────────┴────────┴────────┴────────┴────────┘
```

## KARAR: ⚠️ KOŞULLU ONAY

Faz 2 büyük ölçüde tamamlanmıştır. API ve UI modülleri çalışır durumdadır. Ancak **11 kritik bulgu** Faz 3'e geçmeden önce giderilmelidir.

---

## DENETİM AKIŞI

```
📥 GİRDİ
 │
 ├── ORCHESTRATION.md
 ├── PROJECT_TREE.md
 ├── SPEC.md
 └── CLAUDE.md
 │
 ▼
┌──────────────────────────────────────────┐
│  1. CHECKPOINT BÜTÜNLÜĞÜ                │
│  ┌────────┬──────────────┬───────────────────────────────┬────────┐
│  │ CP     │ Tarih        │ Kapsam                        │ Durum  │
│  ├────────┼──────────────┼───────────────────────────────┼────────┤
│  │ CP-0   │ 28 Feb       │ Orkestrasyon                  │ ✅     │
│  │ CP-1   │ 28 Feb 23:15 │ T-001~T-008,T-010,T-011       │ ✅     │
│  │ CP-2   │ 28 Feb 23:45 │ T-009,T-012                   │ ✅     │
│  │ CP-3   │ 01 Mar 00:00 │ T-013,T-014 — Faz 1 %100      │ ✅     │
│  │ CP-4   │ 01 Mar 01:00 │ T-015,T-017,T-019,T-021       │ ✅     │
│  │ CP-5   │ 01 Mar 02:00 │ T-025 + Supervisor düzeltmeler│ ✅     │
│  │ CP-6   │ 01 Mar 03:00 │ Frontend UI altyapısı         │ ✅     │
│  │ CP-7   │ 01 Mar 04:00 │ T-016,T-018,T-020,T-022       │ ✅     │
│  │ CP-8   │ 01 Mar 05:00 │ T-023,T-024,T-026,T-027       │ ✅     │
│  └────────┴──────────────┴───────────────────────────────┴────────┘
│
│  Sonuç: Checkpoint'ler ardışık, mantıklı, atlama yok.
│  Karar: ✅ ONAY
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  2. GÖREV TABLOSU TUTARLILIĞI            │
│                                          │
│  Faz 1: 14/14 ✅                         │
│  ├── ✅ T-001~T-014 (tümü tamamlandı)   │
│                                          │
│  Faz 2: 13/13 ✅ (beyan)                 │
│  ├── ✅ API: T-015,T-017,T-019,T-021    │
│  ├── ✅ UI: T-016,T-018,T-020,T-022     │
│  ├── ✅ T-023,T-024 (Notification)       │
│  ├── ✅ T-025 (AuditLog API)             │
│  ├── ✅ T-026 (Dashboard)                │
│  ├── ✅ T-027 (Testler — 231 passed)     │
│  │                                       │
│  ├── ❌ T-025 TUTARSIZLIK:               │
│  │   ORCHESTRATION: "AuditLog API + UI"  │
│  │   Gerçek durum: API var, UI YOK       │
│  │   audit-logs/ dizini mevcut değil     │
│  └── Dashboard link → /audit-logs → 404  │
│                                          │
│  Faz 3-9: 39 görev ⬜ Bekliyor           │
│                                          │
│  Karar: ⚠️ UYARI (T-025 UI eksik)       │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  3. MODEL ROUTING                        │
│                                          │
│  ┌─────────┬──────────────┬──────────┐   │
│  │ Görev   │ Atanan Agent │ Doğru?   │   │
│  ├─────────┼──────────────┼──────────┤   │
│  │ T-015   │ @coder-heavy │ ✅       │   │
│  │ T-016   │ @coder-heavy │ ✅       │   │
│  │ T-017   │ @coder-light │ ✅       │   │
│  │ T-018   │ @coder-light │ ✅       │   │
│  │ T-019   │ @coder-heavy │ ✅       │   │
│  │ T-020   │ @coder-heavy │ ✅       │   │
│  │ T-021   │ @coder-light │ ✅       │   │
│  │ T-022   │ @coder-light │ ✅       │   │
│  │ T-023   │ @coder-heavy │ ✅       │   │
│  │ T-024   │ @coder-light │ ✅       │   │
│  │ T-025   │ @coder-heavy │ ✅       │   │
│  │ T-026   │ @coder-light │ ✅       │   │
│  │ T-027   │ @tester      │ ✅       │   │
│  └─────────┴──────────────┴──────────┘   │
│                                          │
│  Tüm atamalar CLAUDE.md kurallarına uygun│
│  Karar: ✅ ONAY                          │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  4. GÜVENLİK ANALİZİ                    │
│                                          │
│  Multi-Tenant:                           │
│  ├── galleryId filtresi: ⚠️              │
│  │   S-1: galleryTenant middleware       │
│  │   hiçbir route'ta kullanılmıyor.      │
│  │   Controller'lar req.user.galleryId   │
│  │   okuyor ama middleware set etmiyor.  │
│  │                                       │
│  ├── gallery middleware: ❌ KRİTİK       │
│  │   S-2: requireGalleryAccess           │
│  │   MASTER_ADMIN'i galleryId=null       │
│  │   olsa bile geçiriyor. Galeri-scoped  │
│  │   controller'larda crash veya         │
│  │   tutarsız davranış.                  │
│  │                                       │
│  ├── S-3: notification markAsRead        │
│  │   ❌ KRİTİK — Bildirim hedef          │
│  │   galeriyi doğrulamıyor. Herhangi     │
│  │   bir galeri, kendisini hedef almayan │
│  │   bildirimi "okundu" işaretleyebilir. │
│  │                                       │
│  └── S-4: gallery.service AuditLog yok   │
│      ⚠️ UYARI — CLAUDE.md "her Master   │
│      panel değişikliği loglanır" kuralını│
│      ihlal ediyor. create/update/delete  │
│      metodlarında auditService.log() yok.│
│                                          │
│  API Auth:                               │
│  ├── authenticate: ✅ (tüm route'larda)  │
│  │                                       │
│  ├── role guard: ⚠️                      │
│  │   S-5: JWT_SECRET fallback            │
│  │   ❌ KRİTİK — jwt.ts'de hardcoded    │
│  │   'fallback-secret' var. ENV yoksa    │
│  │   bilinen secret ile çalışır.         │
│  │                                       │
│  ├── S-6: POST /register korumasız       │
│  │   ❌ KRİTİK — Rate limit yok,         │
│  │   sınırsız hesap oluşturulabilir.     │
│  │                                       │
│  ├── S-7: Master layout auth guard yok   │
│  │   ❌ KRİTİK — Frontend tarafında      │
│  │   (master)/layout.tsx'te rol kontrolü │
│  │   yok. Her giriş yapmış kullanıcı     │
│  │   /master/ URL'lerine erişebilir.     │
│  │                                       │
│  ├── validate: ✅ (tüm mutation'larda)   │
│  │                                       │
│  └── S-8~S-12: Validation eksikleri      │
│      ⚠️ UYARI — password max yok,       │
│      email normalize değil, sortBy       │
│      whitelist yok, minCC>maxCC          │
│      kontrolü yok, buyRate≥sellRate      │
│      kontrolü yok.                       │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  5. VERGİ HESAPLAMA DOĞRULAMA            │
│                                          │
│  Toyota Corolla 2022, 1600cc, JP         │
│  FOB=$6000, Nakliye=$600, Sigorta=$100   │
│                                          │
│  CIF = FOB + Nakliye + Sigorta           │
│   └──► $6,700 ✅                         │
│  Gümrük = CIF × %10                     │
│   └──► $670 ✅                           │
│  FIF = CIF × %18 (1001-1600cc)           │
│   └──► $1,206 ✅                         │
│  KDV = (CIF+Gümrük+FIF) × %20           │
│   └──► $1,715.20 ✅                      │
│  GKK = CIF × %2.5                       │
│   └──► $167.50 ✅                        │
│  Rıhtım = CIF × %4.4                    │
│   └──► $294.80 ✅                        │
│  Genel FIF = 1600cc × 2.03 TL           │
│   └──► ~$100 ✅                          │
│  Bandrol = 33.5 TL sabit                 │
│   └──► ~$10 ✅                           │
│                                          │
│  Toplam: ~$10,864 ✅                     │
│                                          │
│  Seed verisi: FIF bantları, GKK, Rıhtım  │
│  CLAUDE.md/SPEC.md ile birebir eşleşiyor │
│                                          │
│  SPEC.md G2.2 wireframe: Düzeltildi ✅   │
│  (CP-5'te $1,474→$1,715)                │
│                                          │
│  Sonuç: ✅ Doğru                         │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  6. SCHEMA & TREE KONTROLÜ               │
│                                          │
│  Prisma: 20 model, 13 enum               │
│  ├── SPEC uyumu: ✅ Tüm modeller mevcut  │
│  ├── galleryId (Sale, ImportCalc): ✅     │
│  │   (CP-5'te düzeltildi)               │
│  ├── onDelete eksikleri: ❌ KRİTİK       │
│  │   - ImportCalculation.vehicle: yok    │
│  │   - Sale.vehicle: yok                 │
│  │   - NotificationRead.gallery: yok     │
│  ├── apiKey plaintext: ❌ KRİTİK         │
│  │   ExchangeRateSettings.apiKey         │
│  │   şifresiz DB'de saklanıyor           │
│  ├── Index eksikleri: ⚠️ UYARI           │
│  │   - ExchangeRate(currencyCode,isActive)│
│  │   - TaxRateHistory(taxRateId,changedAt)│
│  │   - Sale(saleDate)                    │
│  │   - TaxSnapshot(createdAt)            │
│  ├── AuditLog.performedBy: ÖNERİ        │
│  │   userId yerine string name saklıyor  │
│  └── Migration: ⬜ Henüz çalıştırılmamış │
│                                          │
│  PROJECT_TREE.md: ❌ GÜNCEL DEĞİL        │
│  ├── Beyan: 68 dosya, 101 test, 4 dosya  │
│  ├── Gerçek: 105 dosya, 231 test, 8 dosya│
│  ├── CP-6/7/8 dosyaları eksik:           │
│  │   - 15 master panel UI sayfası        │
│  │   - 4 servis test dosyası             │
│  │   - notification/audit API dosyaları  │
│  │   - 22 shadcn/ui bileşeni             │
│  │   - data-table, use-api, providers    │
│  └── /tree ile acil güncelleme gerekli   │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  7. RİSK & BOTTLENECK                   │
│                                          │
│  🔴 Kritik:                              │
│  ├── R-1: localStorage'da token — XSS    │
│  │   ile token çalınabilir. httpOnly      │
│  │   cookie tercih edilmeli.             │
│  │                                       │
│  ├── R-2: Frontend auth guard yok —       │
│  │   /master/ URL'leri herkese açık      │
│  │                                       │
│  ├── R-3: galleryTenant middleware        │
│  │   dead code — hiçbir route kullanmıyor│
│  │                                       │
│  └── R-4: audit-logs UI eksik ama        │
│      T-025 tamamlandı olarak işaretli    │
│                                          │
│  🟡 Uyarı:                               │
│  ├── auth.service testi yok — kritik     │
│  │   register/login logic test edilmemiş │
│  ├── notification.service testi yok      │
│  ├── Frontend test'i hiç yok (0 test)    │
│  └── data-table search debounce eksik    │
│                                          │
│  🟢 Öneri:                               │
│  ├── Seed'e ACCOUNTANT/STAFF rolleri ekle│
│  ├── Seed'e örnek Vehicle/Customer ekle  │
│  ├── bulkUpdate $transaction kullanmalı  │
│  └── getErrorMessage utility merkezi olsun│
│                                          │
│  Bottleneck:                             │
│  ├── T-025 audit-logs UI → tamamlanmadan │
│  │   Faz 2 kapatılamaz                   │
│  ├── T-037 Calculator → en kritik iş     │
│  │   mantığı, Faz 4'te                   │
│  └── Frontend güvenlik eksikleri →        │
│      Faz 3 UI'ları da aynı sorunla       │
│      başlar (auth guard, token storage)  │
└──────────────────────────────────────────┘

📤 ÇIKTI
 │
 ▼
┌──────────────────────────────────────────┐
│  KARAR: ⚠️ KOŞULLU ONAY                 │
│                                          │
│  Zorunlu Aksiyonlar (Faz 3 öncesi):      │
│  1. audit-logs UI sayfasını oluştur      │
│     (T-025'i gerçekten tamamla)          │
│  2. (master)/layout.tsx'e role guard ekle│
│     MASTER_ADMIN değilse redirect        │
│  3. jwt.ts'den fallback secret kaldır,   │
│     startup'ta env kontrolü ekle         │
│  4. gallery.service'e auditService.log() │
│     ekle (create/update/delete)          │
│  5. notification markAsRead'e targetIds  │
│     doğrulaması ekle                     │
│  6. PROJECT_TREE.md'yi güncelle (/tree)  │
│  7. onDelete davranışlarını tanımla      │
│     (ImportCalculation, Sale,            │
│     NotificationRead)                    │
│                                          │
│  Önerilen Aksiyonlar (Faz 3 süresince):  │
│  1. /register endpoint'ine rate limit    │
│     veya requireMasterAdmin ekle         │
│  2. auth.validation password max(128),   │
│     email toLowerCase() ekle            │
│  3. Eksik index'leri ekle (ExchangeRate, │
│     TaxRateHistory, Sale, TaxSnapshot)   │
│  4. apiKey'i env variable'a taşı veya    │
│     şifreli sakla                        │
│  5. auth.service testleri yaz            │
│  6. data-table search debounce ekle      │
│  7. galleryTenant middleware'i route'lara │
│     entegre et veya kaldır               │
│  8. Validation schema'larına cross-field │
│     kontrolleri ekle (superRefine)       │
└──────────────────────────────────────────┘
```

---

## KRİTİK BULGULARIN DETAYI

### S-1: galleryTenant middleware kullanılmıyor
**Dosya:** `apps/api/src/middleware/gallery.middleware.ts`
**Seviye:** KRİTİK
**Açıklama:** `galleryTenant()` ve `galleryQueryFilter()` fonksiyonları yazılmış ancak hiçbir route dosyasında `router.use()` ile bağlanmamış. Controller'lar doğrudan `req.user!.galleryId` okuyor; middleware katmanında `req.galleryId` hiçbir zaman set edilmiyor. İkili kaynak tutarsızlık yaratır.

### S-2: requireGalleryAccess MASTER_ADMIN bypass
**Dosya:** `apps/api/src/middleware/role.middleware.ts`
**Seviye:** KRİTİK
**Açıklama:** MASTER_ADMIN `galleryId=null` olsa bile `requireGalleryAccess`'ten geçiyor. Galeri-scoped controller'larda (notification getForGallery, markAsRead) `req.user!.galleryId` null olunca BadRequestError fırlatılıyor. Tutarsız davranış.

### S-3: Notification markAsRead hedef doğrulaması yok
**Dosya:** `apps/api/src/services/notification.service.ts`
**Seviye:** KRİTİK
**Açıklama:** `markAsRead()` bildirimin `targetIds`'inde çağıran galerinin ID'sinin olup olmadığını kontrol etmiyor. Herhangi bir galeri, kendisini hedef almayan bildirimi okundu işaretleyebilir.

### S-4: gallery.service AuditLog eksik
**Dosya:** `apps/api/src/services/gallery.service.ts`
**Seviye:** UYARI (CLAUDE.md kural ihlali)
**Açıklama:** `create()`, `update()`, `delete()` metodlarında `auditService.log()` çağrısı yok. Diğer tüm master panel servisleri (taxRate, country, exchangeRate, notification) audit logging yapıyor.

### S-5: JWT_SECRET hardcoded fallback
**Dosya:** `apps/api/src/utils/jwt.ts`
**Seviye:** KRİTİK
**Açıklama:** `process.env.JWT_SECRET || 'fallback-secret'` — ENV set edilmezse bilinen bir secret ile token üretilir. Uygulama başlangıcında env kontrolü zorunlu.

### S-6: POST /register korumasız
**Dosya:** `apps/api/src/routes/auth.routes.ts`
**Seviye:** KRİTİK
**Açıklama:** Rate limit yok, CAPTCHA yok. Sınırsız hesap oluşturulabilir. Ya `requireMasterAdmin` eklenmeli ya da rate limiter kullanılmalı.

### S-7: Frontend master layout auth guard yok
**Dosya:** `apps/web/app/(master)/layout.tsx`
**Seviye:** KRİTİK
**Açıklama:** `useAuthStore` ile rol kontrolü yapılmıyor. Herhangi bir giriş yapmış kullanıcı `/master/*` URL'lerine erişebilir. `MASTER_ADMIN` değilse redirect eklenmeli.

### S-8: apiKey plaintext
**Dosya:** `apps/api/prisma/schema.prisma` (ExchangeRateSettings)
**Seviye:** KRİTİK
**Açıklama:** API anahtarı veritabanında şifresiz saklanıyor. ENV variable'a taşınmalı veya AES-256 ile şifrelenmelidir.

### S-9: onDelete davranışları tanımsız
**Dosya:** `apps/api/prisma/schema.prisma`
**Seviye:** KRİTİK
**Açıklama:** `ImportCalculation.vehicle`, `Sale.vehicle`, `NotificationRead.gallery` ilişkilerinde `onDelete` direktifi yok. Prisma default `Restrict` uygular — Vehicle veya Gallery silinmek istendiğinde beklenmedik bloklamalar oluşur.

### S-10: T-025 audit-logs UI eksik
**Dosya:** `apps/web/app/(master)/master/` (audit-logs dizini yok)
**Seviye:** KRİTİK
**Açıklama:** ORCHESTRATION.md'de T-025 "AuditLog API + UI" olarak ✅ işaretli, ancak `audit-logs/` sayfası mevcut değil. Dashboard'daki "Tüm aktiviteleri görüntüle" linki 404 döner.

### S-11: Token'lar localStorage'da
**Dosya:** `apps/web/stores/authStore.ts`
**Seviye:** KRİTİK
**Açıklama:** Access ve refresh token'lar `localStorage`'da saklanıyor. XSS saldırısında her iki token ele geçirilebilir. `httpOnly` cookie + memory token pattern'ine geçilmeli.

---

## TEST DURUMU

```
┌────────────────────────────────────┬────────┬────────────┐
│ Test Dosyası                       │ Sayı   │ Durum      │
├────────────────────────────────────┼────────┼────────────┤
│ auth.middleware.test.ts            │ 14     │ ✅ Passed   │
│ role.middleware.test.ts            │ 36     │ ✅ Passed   │
│ jwt.test.ts                       │ 18     │ ✅ Passed   │
│ hash.test.ts                      │ 15     │ ✅ Passed   │
│ taxRate.service.test.ts            │ 38     │ ✅ Passed   │
│ country.service.test.ts           │ 36     │ ✅ Passed   │
│ exchangeRate.service.test.ts      │ 32     │ ✅ Passed   │
│ gallery.service.test.ts           │ 43     │ ✅ Passed   │
├────────────────────────────────────┼────────┼────────────┤
│ TOPLAM                            │ 231    │ ✅ Tümü OK  │
├────────────────────────────────────┼────────┼────────────┤
│ ❌ EKSİK: auth.service.test.ts    │ —      │ Yok        │
│ ❌ EKSİK: notification.service    │ —      │ Yok        │
│ ❌ EKSİK: audit.service.test.ts   │ —      │ Yok        │
│ ❌ EKSİK: Frontend testleri       │ 0      │ Yok        │
└────────────────────────────────────┴────────┴────────────┘
```

**Test Eksikleri:**
- Token expiration testi yok (jwt.test.ts, auth.middleware.test.ts)
- bcrypt 72+ byte truncation testi yok
- auth.service (register/login) — en kritik iş mantığı test edilmemiş
- notification.service (markAsRead, getUnreadCount) — karmaşık mantık test edilmemiş

---

## DENETLENEN DOSYALAR

```
Core Documents (4):
  ORCHESTRATION.md
  PROJECT_TREE.md
  SPEC.md
  CLAUDE.md

Schema & Seed (2):
  apps/api/prisma/schema.prisma
  apps/api/prisma/seed.ts

Routes (8):
  apps/api/src/routes/index.ts
  apps/api/src/routes/auth.routes.ts
  apps/api/src/routes/taxRate.routes.ts
  apps/api/src/routes/country.routes.ts
  apps/api/src/routes/exchangeRate.routes.ts
  apps/api/src/routes/gallery.routes.ts
  apps/api/src/routes/notification.routes.ts
  apps/api/src/routes/audit.routes.ts

Middleware (4):
  apps/api/src/middleware/auth.middleware.ts
  apps/api/src/middleware/role.middleware.ts
  apps/api/src/middleware/gallery.middleware.ts
  apps/api/src/middleware/validate.middleware.ts

Services (6):
  apps/api/src/services/auth.service.ts
  apps/api/src/services/taxRate.service.ts
  apps/api/src/services/country.service.ts
  apps/api/src/services/exchangeRate.service.ts
  apps/api/src/services/gallery.service.ts
  apps/api/src/services/notification.service.ts
  apps/api/src/services/audit.service.ts

Validations (8):
  apps/api/src/validations/auth.validation.ts
  apps/api/src/validations/taxRate.validation.ts
  apps/api/src/validations/country.validation.ts
  apps/api/src/validations/exchangeRate.validation.ts
  apps/api/src/validations/gallery.validation.ts
  apps/api/src/validations/notification.validation.ts
  apps/api/src/validations/audit.validation.ts
  apps/api/src/validations/common.validation.ts

Tests (8):
  apps/api/src/middleware/__tests__/auth.middleware.test.ts
  apps/api/src/middleware/__tests__/role.middleware.test.ts
  apps/api/src/utils/__tests__/jwt.test.ts
  apps/api/src/utils/__tests__/hash.test.ts
  apps/api/src/services/__tests__/taxRate.service.test.ts
  apps/api/src/services/__tests__/country.service.test.ts
  apps/api/src/services/__tests__/exchangeRate.service.test.ts
  apps/api/src/services/__tests__/gallery.service.test.ts

Frontend (20+):
  apps/web/app/(master)/layout.tsx
  apps/web/app/(master)/master/page.tsx
  apps/web/app/(master)/master/tax-rates/page.tsx
  apps/web/app/(master)/master/tax-rates/components/tax-rate-form.tsx
  apps/web/app/(master)/master/countries/page.tsx
  apps/web/app/(master)/master/countries/components/country-form.tsx
  apps/web/app/(master)/master/exchange-rates/page.tsx
  apps/web/app/(master)/master/exchange-rates/components/bulk-update-dialog.tsx
  apps/web/app/(master)/master/galleries/page.tsx
  apps/web/app/(master)/master/galleries/components/gallery-form.tsx
  apps/web/app/(master)/master/galleries/[id]/page.tsx
  apps/web/app/(master)/master/notifications/page.tsx
  apps/web/app/(master)/master/notifications/components/notification-form.tsx
  apps/web/app/(master)/master/notifications/[id]/page.tsx
  apps/web/stores/authStore.ts
  apps/web/lib/api.ts
  apps/web/hooks/use-api.ts
  apps/web/app/providers.tsx
  apps/web/components/shared/data-table.tsx
  apps/web/components/shared/sidebar.tsx
```

---

**Supervisor imzası:** Opus 4.6
**Denetim süresi:** ~8 dakika
**Denetlenen dosya sayısı:** 60+
**Tespit edilen sorun:** 11 kritik, 12 uyarı, 7 öneri
