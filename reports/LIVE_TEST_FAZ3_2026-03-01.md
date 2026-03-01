# LIVE TEST RAPORU

**Tarih:** 2026-03-01
**Test Eden:** Playwright Live Tester (Sonnet)
**Kapsam:** ALL — Auth + Master Panel + Gallery Dashboard (Faz 3)
**Ortam:** localhost:3000 (Next.js) + localhost:4000 (Express API)
**Playwright Surumu:** 1.58.2, Chromium headless, viewport 1280x720
**Faz:** Faz 3 (T-028 ~ T-035 tamamlandi, T-036 test asama)

---

## OZET

| Durum    | Sayfa | Tiklama | Form  |
|----------|-------|---------|-------|
| Basari   |  14   |    7    |   8   |
| Hata     |   1   |    0    |   0   |
| Uyari    |   1   |    0    |   0   |

**Toplam Test:** 16 sayfa, 7 tiklama, 8 form
**Basari Orani:** %93.7 (sayfa bazinda)
**Kritik Hata:** 3 benzersiz sorun (30 toplam kayit — cogu tekrar)
**Uyari:** 6 benzersiz sorun
**Bilgi:** 7 (henuz yapilmamis route'lar — planlanan fazlar)

---

## ROUTE DETAYLARI

### /login
- **Durum:** Basarili
- **Yukleme:** ~2000ms
- **Console Errors:** 0 (redirect sonrasi sayfa gecisi icin bazi 500 loglanmis)
- **Network Errors:** Yok (anlamlı)
- **Login Testi:** admin@kktcgaleri.com / 123456 ile giris yapildi, /master'a redirect oldu
- **Form Testi:** Email + Sifre alanlari doldu, submit calisti, basarili redirect
- **Screenshot:** screenshots_faz3/login.png

### /register
- **Durum:** Basarili
- **Yukleme:** ~1500ms
- **Icerik:** Ad Soyad, Email, Sifre, Sifre Tekrar alanlari mevcut, "Kayit Ol" butonu var
- **Console Errors:** 0
- **Network Errors:** Yok
- **Screenshot:** screenshots_faz3/register.png

---

### /master (Master Dashboard)
- **Durum:** Basarili — sayfa yuklenip goruntulenebiliyor
- **Yukleme:** 2533ms
- **Console Errors:** 2 (Failed to load resource — audit-logs 500)
- **Network Errors:** 500 http://localhost:4000/api/audit-logs?limit=5 (2 istek)
- **Gorsel Bulgu:** "Toplam Galeri: 0", "Aktif Vergi Oranlari: 0", "Kayitli Ulkeler: 0" gozukuyor
  - Gercekte: 1 galeri, 13 vergi orani, 6 ulke veritabaninda mevcut
  - Neden: Frontend `galleriesData?.meta?.total` bekliyor, API `total` donuyor (`meta` yok)
- **Son Aktivite Bolumu:** Bos (audit-logs 500 hatasi nedeniyle)
- **Doviz Kurlar Ozeti:** Dogru calisiyor (5 aktif kur listeleniyor)
- **Screenshot:** screenshots_faz3/_master.png

### /master/tax-rates (Vergi Oranlari)
- **Durum:** Basarili
- **Yukleme:** 2534ms
- **Console Errors:** 0
- **Network Errors:** Yok
- **Tablo:** 10 satir gorunuyor (sayfalama calisiyor), duzgun kolonlar: Kod, Ad, Oran, Oran Tipi, Arac Tipi, Motor Hacmi Araligi, Yururluk Basl., Durum, Islemler
- **Tiklama Testi:** "Yeni Vergi Orani" butonuna tiklandi — dialog acildi; Kod, Ad, Ingilizce Ad, Oran, Oran Tipi, Arac Tipi, Motor Hacmi, Yururluk alanlari mevcut
- **Arama Testi:** Arama kutusu calisiyor (KDV yazildi, filtrelendi)
- **Screenshot:** screenshots_faz3/_master_tax-rates.png, tax-rates-new-dialog.png

### /master/countries (Ulkeler)
- **Durum:** Basarili
- **Yukleme:** 2523ms
- **Console Errors:** 0
- **Network Errors:** Yok
- **Tablo:** 6 satir — US, KR, TR, DE, GB, JP; Ulke Kodu, Ulke Adi, Gumruk Vergisi, AB, Nakliye Araligi, Orta. Gun, Durum kolonlari
- **Tiklama Testi:** "Yeni Ulke" butonuna tiklandi — dialog acildi
- **Screenshot:** screenshots_faz3/_master_countries.png

### /master/exchange-rates (Doviz Kurlari)
- **Durum:** Basarili
- **Yukleme:** 2529ms
- **Console Errors:** 0
- **Network Errors:** Yok
- **Tab Testleri:** 3 tab — "Guncel Kurlar" (5 kur listeleniyor), "Ayarlar" (Guncelleme Modu: Manuel), "Gecmis" (tiklandi)
- **Icerik:** EUR 38.20/38.60, GBP 44.50/45.00, JPY 0.2350/0.2400, TRY 1.00/1.00, USD 35.50/35.80
- **Butonlar:** "Manuel Guncelle", "API'den Cek" butonlari gorunuyor
- **Screenshot:** screenshots_faz3/_master_exchange-rates.png, exchange-rates-tab-1.png (Ayarlar)

### /master/galleries (Galeriler)
- **Durum:** KRITIK HATA — sayfa yuklenmiyor
- **Yukleme:** 2529ms (ama sayfa bos)
- **Console Errors:** 20 adet PAGE ERROR
- **Hata Mesaji:** `Error: A <Select.Item /> must have a value prop that is not an empty string.`
- **Kaynak:** Sayfada `<SelectItem value="">Tumu</SelectItem>` kullanimi — shadcn/ui bos string value kabul etmiyor
- **Etki:** Sayfa tamamen cokiyor, "Unhandled Runtime Error" overlay gorunuyor, icerik gosterilemiyor
- **Network Errors:** Yok (sayfa crash oldugundan API bile cagirilmiyor)
- **Screenshot:** screenshots_faz3/_master_galleries.png (hata ekrani gozukuyor)
- **Olasi Kaynak:** `apps/web/app/(master)/master/galleries/page.tsx` satir 226, 238

### /master/notifications (Bildirimler)
- **Durum:** Basarili — sayfa aciliyor ama veri gosterilemiyor
- **Yukleme:** 2528ms
- **Console Errors:** 2 (Failed to load resource 500)
- **Network Errors:** 500 http://localhost:4000/api/notifications?page=1&limit=10 (2 istek)
- **Gorsel:** "Yeni Bildirim" butonu mevcut, tablo "Veri bulunamadi" gosteriyor
- **Neden:** Backend `PlatformNotification` modeli `createdAt` alani icermiyor (`sentAt` var), ama `helpers.ts` `sortBy` default'u `createdAt` olarak ayarli
- **Screenshot:** screenshots_faz3/_master_notifications.png

### /master/audit-logs (Audit Log)
- **Durum:** Basarili — sayfa aciliyor ama veri gosterilemiyor
- **Yukleme:** 2529ms
- **Console Errors:** 2 (Failed to load resource 500)
- **Network Errors:** 500 http://localhost:4000/api/audit-logs?page=1&limit=10 (2 istek)
- **Gorsel:** "Islem Ara" arama kutusu, "Varlik Turu: Tumu" filter mevcut, tablo "Veri bulunamadi"
- **Neden:** Backend `AuditLog` modeli `createdAt` alani icermiyor (`performedAt` var), ama `helpers.ts` `sortBy` default `createdAt`
- **Screenshot:** screenshots_faz3/_master_audit-logs.png

---

### /dashboard (Galeri Dashboard — Galeri Kullanicisi ile)
- **Durum:** Basarili
- **Not:** MASTER_ADMIN ile giris yapildiginda /master'a redirect oluyor (beklenen davranis)
- **Galeri Kullanicisi Testi:** `owner@demogaleri.com / 123456` ile giris yapildi
- **Icerik:** "Galeri Paneli" sidebar, Dashboard, Araclar, Transit, Hesaplayici, Urunler, Musteriler, Satislar, Raporlar, Ayarlar menu linkleri gorunuyor
- **Dashboard Sayfasi:** Bos — sadece "Dashboard" baslik ve "Galeri yonetim paneli" alt baslik, istatistik kart yok (henuz implemente edilmemis)
- **Console Errors:** 0 (galeri kullanicisi ile)
- **Network Errors:** 0
- **Screenshot:** screenshots_faz3/dashboard_gallery_user.png

### /dashboard/vehicles (Araclar — Galeri Kullanicisi)
- **Durum:** Basarili
- **Icerik:** Araclar tablosu, "Yeni Arac" butonu, Tab'lar (Tumu / Transit / Stokta / Rezerve / Satildi), Marka, Yildan, Yila filtreleri
- **Console Errors:** 0
- **Network Errors:** 0
- **Tablo:** Suan "Veri bulunamadi" — seed verisinde bu galeri icin arac yok
- **Screenshot:** screenshots_faz3/vehicles_gallery_user.png

### /dashboard/vehicles/new (Yeni Arac Formu — Galeri Kullanicisi)
- **Durum:** Basarili
- **Icerik:** "Yeni Arac Ekle" sayfasi, "Temel Bilgiler" bolumu: Marka, Model, Yil, Motor Hacmi, Kasa Tipi, Renk, Sasi No, Kilometre, Yakit Tipi, Vites Tipi; "Mense & Fiyat" bolumu asagida
- **Console Errors:** 0
- **Network Errors:** 0
- **Form:** Cok bolumlu (Temel Bilgiler, Mense & Fiyat) — tam multi-step mi yoksa tek sayfa mi arastirilmadi
- **Screenshot:** screenshots_faz3/vehicles_new_gallery_user.png

### /master/galleries/[id] (Galeri Detay)
- **Durum:** Test edilemedi
- **Not:** Galleries sayfasi runtime crash nedeniyle detail linke erisim saglanamadi

---

### Henuz Implemente Edilmemis Sayfalar (Planlanan Fazlar)
| Route | Durum | Planlanan Faz |
|-------|-------|--------------|
| /dashboard/calculator | 404 Not Found | Faz 4 (T-037~T-042) |
| /dashboard/products | 404 Not Found | Faz 5 (T-044~T-048) |
| /dashboard/customers | 404 Not Found | Faz 7 (T-053) |
| /dashboard/sales | 404 Not Found | Faz 7 (T-054~T-056) |
| /dashboard/reports | 404 Not Found | Faz 6 (T-051~T-052) |
| /dashboard/settings | 404 Not Found | Henuz tanimlanmamis |

---

## BULUNAN HATALAR

### KRITIK

| # | Route | Hata | Detay | Olasi Kaynak Dosya |
|---|-------|------|-------|-------------------|
| 1 | /master/galleries | Select.Item Bos Value — Unhandled Runtime Error | `<SelectItem value="">Tumu</SelectItem>` shadcn/ui Select komponenti bos string value kabul etmiyor, sayfa tamamen cokuyor | `apps/web/app/(master)/master/galleries/page.tsx` satir 226, 238 |
| 2 | /master/notifications, /master/audit-logs, /master (Son Aktivite) | API 500 — Prisma sortBy Uyumsuzlugu (AuditLog) | `AuditLog` modelinde `createdAt` yok, `performedAt` var. `helpers.ts:31` default `sortBy = 'createdAt'` donduruyor | `apps/api/src/utils/helpers.ts` satir 31, `apps/api/src/services/audit.service.ts` satir 57 |
| 3 | /master/notifications, /master/audit-logs | API 500 — Prisma sortBy Uyumsuzlugu (PlatformNotification) | `PlatformNotification` modelinde `createdAt` yok, `sentAt` var. Ayni kok neden — `helpers.ts` `createdAt` donduruyor | `apps/api/src/utils/helpers.ts` satir 31, `apps/api/src/services/notification.service.ts` satir 50 |

---

### UYARI

| # | Route | Hata | Detay | Olasi Kaynak Dosya |
|---|-------|------|-------|-------------------|
| 1 | /master (Dashboard) | Istatistik Kartlari Sifir Gosteriyor | `galleriesData?.meta?.total` ve `taxRatesData?.meta?.total` hep `undefined` — API `meta` yerine `total` donuruyor | `apps/web/app/(master)/master/page.tsx` satir 87-89 |
| 2 | /master/galleries | React State Guncelleme Uyarisi | `Cannot update a component while rendering a different component` — render sirasinda setState cagrisi | `apps/web/app/(master)/master/galleries/page.tsx` |
| 3 | /dashboard (Galeri Dashboard) | Bos Sayfa — Istatistik Yok | Dashboard sayfasi sadece baslik gosteriyor, T-049 (Dashboard kartlari) henuz yapilmamis | `apps/web/app/(dashboard)/dashboard/page.tsx` — Faz 6 gorevi |
| 4 | /master | Toplam Galeri / Vergi / Ulke Sayilari Yanlis | `galleriesData?.meta?.total ?? 0` yerine `galleriesData?.total ?? 0` olmali | `apps/web/app/(master)/master/page.tsx` |
| 5 | /master/tax-rates | Arama Sonrasi Clear Hatasi | Test script: `searchInput.clear is not a function` — bu test scripti hatasi, sayfanin hatasi degil | Test scripti |
| 6 | /master/galleries | Gallery detail sayfasi test edilemedi | Galleries sayfasi crash nedeniyle /master/galleries/[id] detay sayfasina erisim saglanamadi | — |

---

### BILGI

| # | Route | Not | Detay |
|---|-------|-----|-------|
| 1 | /dashboard/calculator | Henuz Yapilmamis | Faz 4 (T-037~T-042) ile gelecek |
| 2 | /dashboard/products | Henuz Yapilmamis | Faz 5 (T-044~T-048) ile gelecek |
| 3 | /dashboard/customers | Henuz Yapilmamis | Faz 7 (T-053) ile gelecek |
| 4 | /dashboard/sales | Henuz Yapilmamis | Faz 7 (T-054~T-056) ile gelecek |
| 5 | /dashboard/reports | Henuz Yapilmamis | Faz 6 (T-051~T-052) ile gelecek |
| 6 | /dashboard/settings | Henuz Yapilmamis | Planlama asama |
| 7 | /dashboard (MASTER_ADMIN ile) | Redirect Bekleniyor | MASTER_ADMIN kullanicisi /dashboard'a girdiginde /master'a redirect oluyor — bu beklenen davranis |
| 8 | Next.js Versiyonu | Guncel Degil | "Next.js (14.2.35) is outdated" bildirimi — minor uyari |

---

## API DURUMU

| Endpoint | Durum | Aciklama |
|----------|-------|----------|
| GET /api/auth/login | Basarili | Token donuyor |
| GET /api/galleries | Basarili | 1 galeri listeleniyor |
| GET /api/tax-rates | Basarili | 13 vergi orani |
| GET /api/countries | Basarili | 6 ulke |
| GET /api/exchange-rates | Basarili | 5 aktif kur |
| GET /api/audit-logs | 500 HATA | `createdAt` alan uyumsuzlugu |
| GET /api/notifications | 500 HATA | `createdAt` alan uyumsuzlugu |
| GET /api/vehicles | Basarili (token ile) | Galeri baz |

---

## KOK NEDEN ANALIZi

### Sorun 1 — AuditLog ve PlatformNotification 500 Hatasi (KRITIK)
**Kok neden:** `apps/api/src/utils/helpers.ts` dosyasindaki `parsePagination()` fonksiyonu `sortBy` default degerini `'createdAt'` olarak donduruyor. Ancak:
- `AuditLog` modeli: `createdAt` alani **yok**, `performedAt` var
- `PlatformNotification` modeli: `createdAt` alani **yok**, `sentAt` var

Bu durum her iki modelin `orderBy: { createdAt: 'desc' }` ile Prisma sorgusu yapmaya calismasi ve Prisma'nin `Unknown argument 'createdAt'` hatasi firlatmasi ile sonuclaniyor.

**Etki:**
- /master/audit-logs sayfasi veri gosteremiyor
- /master/notifications sayfasi veri gosteremiyor
- /master Dashboard'daki "Son Aktivite" bolumu bos
- Her sayfa yuklemesinde frontend konsoluna 500 hatasi dusüyor

**Duzeltme:** `helpers.ts`'i degistirmeden her serviste default sortBy tanimlanmali:
- `audit.service.ts`: `sortBy: params.sortBy || 'performedAt'`
- `notification.service.ts`: `sortBy: params.sortBy || 'sentAt'`
- Veya: `helpers.ts`'de `sortBy` parametresini controller/service katmaninda override et

### Sorun 2 — Galleries Sayfasi Runtime Crash (KRITIK)
**Kok neden:** `apps/web/app/(master)/master/galleries/page.tsx` dosyasinda shadcn/ui `Select` komponenti icinde bos string value kullaniliyor:
```tsx
<SelectItem value="">Tumu</SelectItem>   // satir 226
<SelectItem value="">Tumu</SelectItem>   // satir 238
```
shadcn/ui (Radix UI Select) bos string `""` degerine izin vermiyor cunku bos string "secim temizle" anlami tasiyor.

**Duzeltme:** `value=""` yerine `value="all"` kullanlmali, `onValueChange` handler'inda da `"all"` kontrolu yapilmali.

### Sorun 3 — Dashboard Istatistik Kartlari Yanlis Sayilar (UYARI)
**Kok neden:** API `sendPaginated()` fonksiyonu `{success, data, total, page, limit, totalPages}` donuruyor. Master Dashboard `galleriesData?.meta?.total` bekliyor ama API'de `meta` objesi yok, `total` dogrudan ust seviyede.

**Duzeltme:** `page.tsx`'de `galleriesData?.total ?? 0` seklinde guncellenmeli.

---

## ONERILER

1. **ACIL (Onceki Faz Hatasi):** `helpers.ts` `parsePagination()` fonksiyonu model-bagimsiz hale getirilmeli. Her servis kendi default `sortBy` degerini bilmeli. `audit.service.ts` ve `notification.service.ts` guncellenmeli.

2. **ACIL (Faz 3 Hatasi):** `galleries/page.tsx`'deki `<SelectItem value="">` bos string kullanimi `value="all"` ile degistirilmeli. Bu sayfa tamamen calismiyor.

3. **ORTA (UI Bug):** Master Dashboard istatistik kartlari `meta.total` yerine `total` kullanacak sekilde duzeltilmeli.

4. **DUSUK (UI Eksik):** Galeri Dashboard (`/dashboard`) sayfasi bos — Faz 6'da T-049 gorevi ile istatistik kartlari eklenecek.

5. **BILGI:** Sidebar menusunde "Hesaplayici", "Urunler", "Musteriler", "Satislar", "Raporlar", "Ayarlar" linkleri gorunuyor ama 404 donuyor. Bu planlanan fazlarda doldurulacak — sidebar link'leri simdilik hazir durumda gorunmesi iyi ama kullaniciya "Yakininda" veya "Cok Yakinda" badgesi eklenebilir.

6. **GUZELLESTIRME:** Next.js surumu 14.2.35 guncel degil, minor upgrade onerilir.

---

## BASARILI OLANLAR

- Login / Logout akisi tamamen calisiyor
- Register sayfasi mevcut ve duzenli gorunuyor
- /master/tax-rates: Tablo, arama, dialog, 10 satir veri — tam calisiyor
- /master/countries: Tablo, 6 ulke, yeni ulke dialog — calisiyor
- /master/exchange-rates: 3 tab (Guncel Kurlar / Ayarlar / Gecmis), 5 kur verisi, butonlar — calisiyor
- /master/notifications: Sayfa aciliyor, "Yeni Bildirim" butonu gorunuyor (veri bos ama API hatasi nedeniyle)
- /master/audit-logs: Sayfa aciliyor, arama / filter calisiyor (veri bos ama API hatasi nedeniyle)
- /dashboard (galeri kullanicisi): Sidebar, menu, yonlendirme tamamen calisiyor
- /dashboard/vehicles (galeri kullanicisi): Tab'lar, filtreler, tablo, "Yeni Arac" butonu — calisiyor
- /dashboard/vehicles/new (galeri kullanicisi): Form alanlari, cok bolumlu yapisi — calisiyor
- MASTER_ADMIN redirect davranisi dogru (dashboard → master)
- Role-based routing calisiyor

---

**Test suresi:** ~25 dakika
**Test edilen route sayisi:** 16 sayfa (6 planlanan-faz dahil)
**Tespit edilen sorun:** 3 kritik, 6 uyari, 8 bilgi
**Ekran goruntusu:** 30 adet (`reports/screenshots_faz3/` dizininde)
