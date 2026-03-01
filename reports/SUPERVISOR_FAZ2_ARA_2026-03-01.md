# SUPERVISOR DENETİM RAPORU — FAZ 2 (Ara Değerlendirme)

**Tarih:** 2026-03-01 | **Denetçi:** Supervisor (Opus 4.6)
**Kapsam:** CHECKPOINT-0 → CHECKPOINT-4 (T-001 ~ T-021)
**Mevcut Durum:** Faz 2 devam ediyor (API: 4/5, UI: 0/6)

---

## 1. Checkpoint Bütünlüğü — ✅ ONAY

| Checkpoint | Tarih | Kapsam | Durum |
|---|---|---|---|
| CP-0 | 28 Feb | Orkestrasyon | ✅ |
| CP-1 | 28 Feb 23:15 | T-001~T-008, T-010, T-011 | ✅ |
| CP-2 | 28 Feb 23:45 | T-009, T-012 | ✅ |
| CP-3 | 01 Mar 00:00 | T-013, T-014 — Faz 1 %100 | ✅ |
| CP-4 | 01 Mar 01:00 | T-015, T-017, T-019, T-021 | ✅ |

Checkpoint'ler ardışık, mantıklı ve atlama yok. Her checkpoint önceki görevlerin bağımlılıklarını doğru takip ediyor.

---

## 2. Görev Tablosu Tutarlılığı — ✅ ONAY (1 not)

- Faz 1 (T-001~T-014): 14/14 ✅ — doğru
- Faz 2 API (T-015, T-017, T-019, T-021): 4 ✅ — doğru
- T-025 (AuditLog): 🔄 olarak işaretli — `audit.service.ts` mevcut ama controller/routes/validation eksik. **Doğru işaretlenmiş.**
- T-016, T-018, T-020, T-022 (UI'lar): ⬜ — doğru, henüz başlanmadı

**Not:** T-025'in `audit.service.ts` dosyası T-015 tarafından oluşturulmuş (yan ürün). Bu belgelenmiş.

---

## 3. Model Routing — ✅ ONAY

| Görev | Atanan Agent | Doğru mu? | Gerekçe |
|---|---|---|---|
| T-015 (TaxRate + History + Audit) | @coder-heavy | ✅ | Karmaşık ilişkiler + AuditLog |
| T-017 (OriginCountry CRUD) | @coder-light | ✅ | Basit CRUD |
| T-019 (ExchangeRate + cron) | @coder-heavy | ✅ | API fetch + cron job |
| T-021 (Gallery CRUD) | @coder-light | ✅ | Basit CRUD + slug |

Routing CLAUDE.md kurallarına uygun.

---

## 4. Multi-Tenant Güvenlik — ⚠️ UYARI

### İyi Yapılanlar:
- `gallery.middleware.ts` **tam uygulanmış** (PROJECT_TREE.md'de "STUB" yazıyor — güncel değil)
- `galleryTenant()` ve `galleryQueryFilter()` iki fonksiyon mevcut
- Master panel tabloları (TaxRate, ExchangeRate, OriginCountry) global veri — galleryId filtresi gereksiz, doğru tasarım
- Vehicle, Product, Customer tabloları `@@index([galleryId])` ile optimize

### Kritik Sorunlar:

**S-1: `ImportCalculation` modelinde `galleryId` eksik**
`vehicleId` nullable olduğu için (`String?`), araçsız hesaplamalar hangi galeriye ait olduğu bilinemez. SPEC'te de bu eksik. Schema + SPEC güncellenmelidir.

**S-2: `Sale` modelinde `galleryId` eksik**
Satış sorguları `vehicle.galleryId` üzerinden JOIN gerektirir. N+1 riski ve karmaşıklık oluşturur.

**S-3: `galleryTenant` middleware'inde MASTER_ADMIN `req.galleryId` belirsizliği**
`MASTER_ADMIN` galleryId göndermezse `req.galleryId = undefined` kalır. Downstream servisler buna güvenirse tüm kayıtlar döner.

**S-4: `routes/index.ts` global middleware yok**
Her route dosyası kendi `authenticate` çağrısını yapıyor. Yeni route eklenirken middleware unutulabilir. Master/Gallery router grupları ayrılmalı.

---

## 5. Vergi Hesaplama — ⚠️ UYARI

### Formüller — ✅ Doğru (CLAUDE.md):
```
CIF = FOB + Nakliye + Sigorta
Gümrük = CIF × %rate
FIF = CIF × %rate (cc'ye göre)
KDV = (CIF + Gümrük + FIF) × %rate
GKK = CIF × %2.5
Rıhtım = CIF × %4.4
```

### Doğrulama (Toyota Corolla 1600cc, JP, FOB $6000):

| Kalem | Beklenen | CLAUDE.md | Sonuç |
|---|---|---|---|
| CIF | $6,700 | $6,700 | ✅ |
| Gümrük %10 | $670 | $670 | ✅ |
| FIF %18 | $1,206 | $1,206 | ✅ |
| KDV %20 | $1,715.20 | $1,715 | ✅ |
| GKK %2.5 | $167.50 | $168 | ✅ |
| Rıhtım %4.4 | $294.80 | $295 | ✅ |
| Toplam | ~$10,864 | ~$10,864 | ✅ |

### SPEC.md İç Tutarsızlık:

**G2.2 wireframe'inde (SPEC satır ~364) KDV = $1,474** — bu YANLIŞ.

- Wireframe formülü: `(CIF + Gümrük) × %20 = (6700+670) × 0.20 = $1,474`
- Doğru formül: `(CIF + Gümrük + FIF) × %20 = (6700+670+1206) × 0.20 = $1,715`
- Wireframe toplamı $10,623 iken doğru toplam $10,864

**SPEC.md G2.2 bölümü düzeltilmeli.** Formül tanımı doğru, wireframe örneği yanlış.

### Seed Verisi — ✅ Uyumlu:
FIF oranları seed'de CLAUDE.md/SPEC.md ile birebir eşleşiyor (0-1000cc=%15, 1001-1600cc=%18 vb.)

---

## 6. Prisma Schema — ✅ ONAY (iyileştirmelerle)

### SPEC ile Uyum:
- **17/17 model** mevcut ✅
- **13/13 enum** mevcut ✅
- Tüm alanlar ve ilişkiler doğru ✅

### SPEC'e göre Pozitif Sapmalar (iyi):

| Ekleme | Dosya | Gerekçe |
|---|---|---|
| `@@map()` direktifleri | Tüm modeller | PostgreSQL snake_case |
| `@@index()` | Vehicle, User, Product, Customer, Sale, AuditLog | Performans |
| `onDelete: Cascade` | TaxRateHistory, NotificationRead, VehicleImage/Doc/Expense | Referential integrity |
| `@@unique([notificationId, galleryId])` | NotificationRead | Çift okuma engeli |
| `publicId` | VehicleImage | Cloudinary silme desteği |

### Eksik İndeksler:
- `VehicleImage`, `VehicleDocument`, `VehicleExpense`, `StockMovement` → `@@index([vehicleId])` eksik
- `AuditLog` → `@@index([performedAt])` eksik

### Migration Durumu:
`apps/api/prisma/migrations/` klasöründe sadece `.gitkeep` var. Henüz `prisma migrate dev` çalıştırılmamış. Bu blocker değil (geliştirme aşamasında) ama production öncesi zorunlu.

---

## 7. API Güvenlik — ⚠️ UYARI

### Endpoint Middleware Tablosu:

| Route Grubu | authenticate | Role Guard | validate | Skor |
|---|---|---|---|---|
| auth.routes | ✅ (public doğru) | ✅ (me: auth only) | ✅ | 5/5 |
| taxRate.routes | ✅ (router.use) | ✅ (requireMasterAdmin) | ✅ | 5/5 |
| gallery.routes | ✅ (per-route) | ✅ (requireMasterAdmin) | ✅ | 5/5 |
| country.routes | ✅ (per-route) | ⚠️ (/active açık) | ✅ | 4/5 |
| exchangeRate.routes | ✅ (per-route) | ⚠️ (/:code açık) | ✅ | 4/5 |

### Güvenlik Bulguları:

**S-5: `GET /countries/active` ve `GET /exchange-rates/:code`**
Sadece `authenticate` var, rol kontrolü yok. Calculator için kasıtlı ise belgelenmeli, değilse `requireGalleryAccess` eklenmeli.

**S-6: Hiçbir route'da `:id` params validation yok**
UUID format doğrulaması yapılmıyor. Geçersiz ID Prisma'da yakalanıyor ama kontrolsüz hata yolu oluşuyor.

**S-7: Route middleware stratejisi tutarsız**
`taxRate.routes.ts` → `router.use()` (temiz). Diğerleri → per-route injection (hata-prone). Standartlaştırılmalı.

**S-8: `auth.service.ts` register metodu — defense-in-depth eksik**
`registerSchema` Zod validasyonu `MASTER_ADMIN`'i enum dışında bırakıyor (doğru). Ancak servis katmanında ikinci savunma hattı yok. Zod bypass edilirse `role: 'MASTER_ADMIN'` ile kayıt yapılabilir.

**S-9: `ExchangeRateSettings.apiKey` plain text**
API anahtarı veritabanında şifresiz saklanıyor. Environment variable veya AES-256 şifreleme kullanılmalı.

**S-10: `ExchangeRateSettings` singleton race condition**
`findFirst + create` pattern'i iki eşzamanlı istekte iki kayıt oluşturabilir. `upsert` veya unique constraint kullanılmalı.

---

## 8. PROJECT_TREE.md Güncelliği — ❌ GÜNCEL DEĞİL

PROJECT_TREE.md **son güncelleme: 28 Şubat 2026** (Checkpoint-3). Aşağıdaki bilgiler yanlış:

| Bilgi | PROJECT_TREE'deki | Gerçek Durum |
|---|---|---|
| gallery.middleware.ts | "STUB — NOT YET IMPLEMENTED" | Tam uygulanmış |
| seed.ts | "NOT YET IMPLEMENTED" | T-007'de tamamlandı |
| Test coverage | "0% — CRITICAL" | 82 test (vitest) |
| Toplam dosya | 44 | 60+ (Faz 2 dosyaları eksik) |
| TaxRate/Exchange/Country/Gallery API | "TODO" | ✅ IMPLEMENTED |
| Servisler | 1 (AuthService) | 6 servis mevcut |
| jobs/ | "STUB empty" | exchangeRate.job.ts mevcut |

**`/tree` komutu ile acil güncelleme gerekiyor.**

---

## 9. Risk ve Bottleneck

### Kritik Riskler:

| # | Risk | Etki | Öncelik |
|---|---|---|---|
| R-1 | ImportCalculation + Sale'de galleryId eksik | Multi-tenant veri sızıntısı | ACİL |
| R-2 | SPEC.md G2.2 wireframe KDV hatası | Calculator yanlış implemente edilebilir | YÜKSEK |
| R-3 | Auth service'de register rol kontrolü zayıf | Defense-in-depth eksik | ORTA |
| R-4 | PROJECT_TREE.md güncel değil | Yanıltıcı referans | ORTA |
| R-5 | ExchangeRateSettings singleton race condition | İkili ayar kaydı | ORTA |

### Bottleneck'ler:

| Bottleneck | Neden | Çözüm |
|---|---|---|
| T-025 (AuditLog) | Faz 2 supervisor onayını blokluyor | Hemen tamamlanmalı |
| T-037 (Calculator) | En kritik iş mantığı, Faz 4'te | SPEC.md düzeltmesi öncesinde yazılmamalı |
| UI görevleri (T-016~T-022) | 0/6 başlanmadı | Paralel olarak @coder-light ile başlatılabilir |

---

## KARAR

## ⚠️ KOŞULLU ONAY

**Faz 2'ye devam edilebilir** ancak aşağıdaki koşulların en geç Faz 2 tamamlanmadan karşılanması zorunludur:

### Zorunlu (Faz 2 kapanış öncesi):

1. **SPEC.md G2.2 wireframe KDV değeri düzeltilmeli** ($1,474 → $1,715, toplam $10,623 → $10,864)
2. **Schema'ya `ImportCalculation.galleryId` ve `Sale.galleryId` eklenmeli** + migration
3. **PROJECT_TREE.md güncellenmelidir** (`/tree`)
4. **T-025 (AuditLog API) tamamlanmalıdır**

### Önerilen (Faz 3 öncesi):

5. `auth.service.ts`'de register servis katmanında rol whitelist ekle
6. `routes/index.ts`'i master/gallery router gruplarına ayır
7. Tüm route'lara `:id` params UUID validation ekle
8. `VehicleImage/Document/Expense` için `@@index([vehicleId])` ekle
9. `ExchangeRateSettings` singleton garantisi (upsert veya unique constraint)

---

## Sorun Özeti

| Kategori | Kritik | Uyarı | Öneri | Toplam |
|---|---|---|---|---|
| Multi-Tenant | 2 | 2 | 0 | 4 |
| Vergi Hesaplama | 1 | 0 | 0 | 1 |
| API Güvenlik | 0 | 3 | 3 | 6 |
| Schema | 0 | 1 | 2 | 3 |
| Dokümantasyon | 1 | 0 | 0 | 1 |
| **TOPLAM** | **4** | **6** | **5** | **15** |

---

**Supervisor imzası:** Opus 4.6
**Denetim süresi:** ~5 dakika
**Denetlenen dosya sayısı:** 22
**Tespit edilen sorun:** 4 kritik, 6 uyarı, 5 öneri
