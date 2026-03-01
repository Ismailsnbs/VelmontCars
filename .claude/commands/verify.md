# /verify — Kod Kalite Doğrulama

Projedeki tüm kodu tara ve kontrol et:

## 1. Multi-Tenant Güvenlik (KRİTİK)
apps/api/src/ altındaki TÜM controller ve service dosyalarını tara:
- Her veritabanı sorgusunda `galleryId` filtresi var mı?
- `where` clause'larında galleryId eksik olan sorgu var mı?
- Gallery middleware uygulanmamış route var mı?
Eksikleri listele: `[dosya:satır] galleryId filtresi eksik`

## 2. Auth & Role Middleware
apps/api/src/routes/ altındaki TÜM route dosyalarını tara:
- Her route'ta `authMiddleware` var mı?
- Master panel route'larında `roleMiddleware(MASTER_ADMIN)` var mı?
- SPEC.md G7.2 yetki matrisi ile uyumlu mu?
Eksikleri listele: `[route] middleware eksik`

## 3. Zod Validation
- Her POST/PUT endpoint'inde Zod validation var mı?
- Validation schema'lar SPEC.md ile uyumlu mu?

## 4. UI State'ler
apps/web/components/ altındaki bileşenleri tara:
- Loading state (skeleton) var mı?
- Empty state var mı?
- Error state var mı?
Eksikleri listele: `[component] loading/empty/error state eksik`

## 5. TypeScript
- `any` tipi kullanılmış mı? (kaçınılmalı)
- Eksik tip tanımları var mı?

## Çıktı
```
🔍 KOD KALİTE RAPORU
═══════════════════════
🔐 Multi-Tenant:    X sorgu kontrol — Y eksik
🛡️ Auth/Role:       X route kontrol — Y eksik
✅ Zod Validation:   X endpoint — Y eksik
🎨 UI States:       X component — Y eksik
📝 TypeScript:      X dosya — Y sorun
```
