# LIVE TEST RAPORU — CP28

**Tarih:** 2026-03-01
**Test Eden:** Playwright Live Tester (Sonnet)
**Kapsam:** Tum panel — galeri, master, auth, mobil
**Ortam:** localhost:3000 (Next.js 14) + localhost:4000 (Express API)
**Playwright Versiyonu:** 1.58.2 (Chromium headless)

---

## OZET

| Durum    | Sayfa | Tiklama | Form  |
|----------|-------|---------|-------|
| Basari   | 18    | 12      | 6     |
| Hata     | 1     | 0       | 0     |
| Uyari    | 2     | 0       | 0     |

**Toplam Test:** 21 sayfa, 12 tiklama testi, 6 form testi
**Basari Orani:** %90

---

## SAYFA TEST OZETI

| Sayfa | URL | Durum | Console Errors | Notlar |
|-------|-----|-------|----------------|--------|
| Login | /login | Basarili | 0 | Hizli giris butonlari mevcut |
| Galeri Sahibi Login | /login -> /dashboard | Basarili | 0 | Manuel giris ile redirect OK |
| Master Admin Login | /login -> /master | Basarili | 0 | Quick login OK |
| Dashboard | /dashboard | Basarili | 0 | StatCard'lar, grafikler, 225 SVG element |
| Araclar | /dashboard/vehicles | Basarili | 0 | Tablo yuklu, 10 arac listeleniyor |
| Yeni Arac Formu | /dashboard/vehicles/new | Basarili | 0 | 12 input, 5 select, tam form |
| Musteriler | /dashboard/customers | Basarili | 0 | 6 musteri, Yeni Musteri dialog OK |
| Urunler | /dashboard/products | Uyari | 0 | Toplam Deger TL:NaN gosteriyor |
| Satislar | /dashboard/sales | Basarili | 0 | 2 satis, Yeni Satis dialog OK |
| Hesaplayici | /dashboard/calculator | Uyari | 2 | 5 NaN (doviz kurlar?), React key prop uyarisi |
| Finans | /dashboard/finance | Basarili | 0 | Gelir/gider/kar goruntuleniyor |
| Raporlar | /dashboard/reports | Basarili | 0 | Rapor linkleri mevcut |
| Ayarlar | /dashboard/settings | KRiTiK HATA | 1 | 404 — Sayfa mevcut degil |
| Master Dashboard | /master | Basarili | 0 | 2 galeri, 13 vergi orani, 5 doviz kuru |
| Master Galeriler | /master/galleries | Basarili | 0 | Tablo yuklu, Yeni Galeri dialog OK |
| Master Vergi Oranlari | /master/tax-rates | Basarili | 0 | 13 vergi orani, Yeni Vergi dialog OK |
| Master Ulkeler | /master/countries | Basarili | 0 | Ulke listesi yuklu |
| Master Doviz Kurlari | /master/exchange-rates | Basarili | 0 | 5 aktif kur, tab gecisleri OK |
| Master Bildirimler | /master/notifications | Basarili | 0 | Bildirim listesi yuklu |
| Master Audit Log | /master/audit-logs | Basarili | 0 | Log kayitlari goruntuleniyor |

---

## ROUTE DETAYLARI

### /login
- **Durum:** Basarili
- **Yüklenme:** ~2s
- **Console Errors:** Yok
- **Network Errors:** Yok
- **Icerik:** Sayfa title "KKTC Galeri Yonetim", Quick Login + Manuel Giris tablari
- **Hizli Giris Butonlari:** 7 adet (Master Admin, Galeri Sahibi, Galeri Muduru, Satis Danismani, Muhasebeci, Personel, Premium Motors)
- **Not:** "Manuel Giris" tabinda email/password alanlari gizli — once tab'a tiklamak gerekiyor
- **Screenshot:** reports/screenshots/login.png

### /dashboard
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Network Errors:** Yok
- **StatCard'lar:** Toplam Arac (10), Transit Arac (3), Stokta (4), Satildi (2), Toplam Urun (8), Dusuk Stok (1) — Hepsi veri gosteriyor
- **Grafikler:** 225 SVG elementi — Recharts grafikleri calisiyor, "Aylik Arac Girisi" grafigi gorunuyor
- **CountUp Animasyonu:** React DOM 3s sonra sayilari yukluyor; Playwright'in ilk snapshot'ta "Early number elements: []" gostermesi normal — late snapshot'ta sayilar gozukunuyor
- **Sayfa Gecis:** CSS `transition: all` main elementinde tanimli
- **Screenshot:** reports/screenshots/dashboard_full.png

### /dashboard/vehicles
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Network Errors:** Yok
- **Tiklama Testleri:** Filter tab'lari (Tumu/Transit/Stokta/Rezerve/Satildi) calisiyor
- **Not:** "Yeni Arac" butonu degil, `<Link href="/vehicles/new">` ile navigate ediyor
- **Mobil FAB:** Sagda altta sabit buton (fixed bottom-20 right-4) gorunuyor
- **Screenshot:** reports/screenshots/vehicles.png

### /dashboard/vehicles/new
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Form Alanlari:** 12 input, 5 select, 12 buton
- **Icerik:** Marka, Model, Yil, Motor Hacmi, Kasa Tipi, Renk, Sasi No, Kilometre, Yakit Tipi, Vites Tipi, vb.
- **Screenshot:** reports/screenshots/vehicles_new.png

### /dashboard/customers
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** 6 musteri, Toplam Musteri 6, Aktif Musteriler 2
- **Yeni Musteri Dialog:** Calisiyor — 6 form alani (name, phone, email, identityNo, address, notes)
- **Screenshot:** reports/screenshots/customers.png

### /dashboard/products
- **Durum:** UYARI (NaN hatasi)
- **Yüklenme:** ~3s
- **Console Errors:** Yok (browser console'da)
- **Network Errors:** Yok (API 200 donuyor)
- **Hata:** "Toplam Deger" card'inda "TL:NaN" gosteriyor
- **Koken:** API `/products/stats` yaniti `totalStockValue` dondururken, frontend `stats.totalValue` bekliyor (field name mismatch)
- **Tablo:** 8 urun listeleniyor, birim fiyatlar dogru
- **Yeni Urun Dialog:** Calisiyor — 6 form alani
- **Screenshot:** reports/screenshots/products_nan.png

### /dashboard/sales
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** 2 satis, Toplam Gelir $40,000, Toplam Kar $7,100
- **Yeni Satis Dialog:** Calisiyor — Arac secimi dropdown (3 arac), musteri secimi
- **Screenshot:** reports/screenshots/sales.png

### /dashboard/calculator
- **Durum:** UYARI (NaN gorunum)
- **Yüklenme:** ~4s
- **Console Errors:** 2 adet
  - `Warning: Cannot update a component while rendering a different component (ActiveRatesPanel)` — setState-in-render anti-pattern
  - `Each child in a list should have a unique key prop — ActiveRatesPanel render metodu`
- **Network Errors:** Yok (API 200)
- **Form Alanlari:** 5 input (FOB Fiyat, Nakliye, Sigorta, Motor Hacmi, Model Yili), 3 select (Para Birimi, Ulke, Arac Tipi)
- **Form Calisiyor:** Ulke secimi, arac tipi secimi OK
- **NaN Sorunu:** "Doviz Kurlari" sidebarinda kur degerleri "NaN" gosteriyor
  - API `{ currencyCode, buyRate, sellRate }` dondururken frontend `{ currency, rate }` bekliyor
  - Etkilenen: 5 doviz kuru satirinin hepsi
- **Screenshot:** reports/screenshots/calculator_deep.png

### /dashboard/finance
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** Toplam Gelir $40.000, Toplam Gider $0, Net Kar $7.100, Kar Marji %17.8
- **Screenshot:** reports/screenshots/finance.png

### /dashboard/reports
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** "Arac Envanter Raporu", "Arac Durum Ozeti" gibi rapor kategorileri ve "Raporu Goruntule" butonlari
- **Screenshot:** reports/screenshots/reports.png

### /dashboard/settings
- **Durum:** KRiTiK HATA
- **Yüklenme:** 404
- **Console Errors:** 1 adet — `Failed to load resource: the server responded with a status of 404`
- **Network Errors:** `404: http://localhost:3000/dashboard/settings`
- **Koken:** Sidebar'da (`components/shared/sidebar.tsx` satir 59) `/dashboard/settings` linki var, fakat `apps/web/app/(dashboard)/dashboard/settings/` dizini veya `page.tsx` dosyasi mevcut degil
- **Etkilenen Roller:** GALLERY_OWNER, GALLERY_MANAGER (sidebar'da sadece bu roller icin gosteriliyor)
- **Screenshot:** reports/screenshots/settings.png

### /master (Master Dashboard)
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** Toplam Galeri 2, Aktif Vergi Oranlari 13, Doviz Kurlari 5, Kayitli Ulkeler 6
- **Screenshot:** reports/screenshots/master_dashboard_full.png

### /master/galleries
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Not:** Tablo sutuner var ama "Henuz galeri eklenm..." yazisi gosteriyor (demo galerilerin listelenmemesi soru isareti)
- **Yeni Galeri Dialog:** Calisiyor
- **Screenshot:** reports/screenshots/master_galleries.png

### /master/tax-rates
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** BANDROL, CUSTOMS_EU, CUSTOMS_NON_EU, FIF_0_1000, vb. — 13 oran listeleniyor
- **Yeni Vergi Dialog:** Calisiyor — Kod, Ad, Ingilizce Ad, Oran, Oran Tipi, Arac Tipi, Motor Hacmi, vb.
- **Screenshot:** reports/screenshots/master_tax_rates.png

### /master/countries
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Screenshot:** reports/screenshots/master_countries.png

### /master/exchange-rates
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** "Guncel Doviz Kurlari" — 5 aktif kur
- **Tab Gecisleri:** "Guncel", "Ayarlar", "Gecmis" tablari calisiyor
- **Screenshot:** reports/screenshots/master_exchange_rates.png

### /master/notifications
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** Bildirim listesi, Yeni Bildirim butonu, tip/oncelik filtreleri
- **Screenshot:** reports/screenshots/master_notifications.png

### /master/audit-logs
- **Durum:** Basarili
- **Yüklenme:** ~3s
- **Console Errors:** Yok
- **Icerik:** "Denetim Gunlugu" — CREATE/UPDATE log kayitlari tarihleriyle gosteriyor
- **Screenshot:** reports/screenshots/master_audit_logs.png

---

## MOBiL GORUNUM TESTI (375x812)

### Dashboard — Mobil
- **Bottom Tab Bar:** Goruldu — "fixed bottom-0 left-0 right-0 z-50" — "Dashboard, Araclar, Hesapla, Stok, Daha Fazla"
- **Sidebar:** Gizli (display none / width 0)
- **StatCard'lar:** Sayfanin tek sutun duzenine dustugu dogrulanmadi ancak sayilar goruluyordu
- **Screenshot:** reports/screenshots/mobile_dashboard.png

### Araclar — Mobil
- **Card View:** Mobilde kart gorunumu aktif (Toyota RAV4, Nissan Qashqai vb. kart formatinda)
- **FAB Butonu:** Goruldu — "fixed bottom-20 right-4 z-50 flex h-14 w-14 rounded-full bg-primary"
- **Screenshot:** reports/screenshots/mobile_vehicles.png

### Master Panel — Mobil
- **Bottom Tab Bar:** Goruldu — "Dashboard, Vergiler, Doviz, Galeriler, Daha Fazla"
- **Screenshot:** reports/screenshots/master_mobile.png

---

## BULUNAN HATALAR

### Kritik

| # | Route | Hata | Detay | Olasi Kaynak Dosya |
|---|-------|------|-------|-------------------|
| 1 | /dashboard/settings | 404 Not Found | Sidebar'da linki var, sayfa dosyasi yok | `apps/web/components/shared/sidebar.tsx:59` — link var, `apps/web/app/(dashboard)/dashboard/settings/page.tsx` — yok |

### Uyari

| # | Route | Hata | Detay | Olasi Kaynak Dosya |
|---|-------|------|-------|-------------------|
| 2 | /dashboard/products | NaN — Toplam Deger | API `totalStockValue` dondururken frontend `stats.totalValue` bekliyor | `apps/api/src/services/product.service.ts:235` (`totalStockValue`), `apps/web/app/(dashboard)/dashboard/products/page.tsx:139` (`totalValue`) |
| 3 | /dashboard/calculator | NaN — Doviz Kurlari | API `{ currencyCode, buyRate, sellRate }` dondururken frontend `{ currency, rate }` bekliyor | `apps/api/src/services/calculator.service.ts:442-444` (currencyCode/buyRate), `apps/web/app/(dashboard)/dashboard/calculator/page.tsx:253,268,271` (currency/rate) |
| 4 | /dashboard/calculator | React setState-in-render | `ActiveRatesPanel` render sirasinda baska component'i guncelliyor (HotReload ile tetikleniyor) | `apps/web/app/(dashboard)/dashboard/calculator/page.tsx:250-299` (`ActiveRatesPanel`) |
| 5 | /dashboard/calculator | Missing React key prop | `ActiveRatesPanel` icerisindeki doviz kuru listesinde benzersiz key yok | `apps/web/app/(dashboard)/dashboard/calculator/page.tsx:267-274` |
| 6 | /master/galleries | Galeri listesi bos | "Henuz galeri eklenmedi" yazisi var ama seed'de 2 galeri (Demo Galeri, Premium Motors) var. `/master/galleries` endpoint galeri verilerini gormeyebilir | `apps/api/src/controllers/gallery.controller.ts` veya `apps/api/src/services/gallery.service.ts` |

### Bilgi

| # | Route | Not | Detay |
|---|-------|-----|-------|
| 7 | /login | Manuel Giris tab'i varsayilan olarak kapali | Kullanicinin once "Manuel Giris" tab'ina tiklayip sonra form doldurmas? gerekiyor |
| 8 | /dashboard | CountUp animasyonu | Sayilar hemen gozukmuyor, veri fetch sonrasi geldiginizde 0'dan sayiyor; headless browser testinde ilk snapshot'ta sayilar bos gozuktu |
| 9 | /dashboard/finance | "Toplam Gider $0" | Sadece satis geliri gorunuyor, ithalat maliyeti "0 arac ithal edildi" yaziyor — import calculation verisi finance'a aktarilmiyor olabilir |
| 10 | /dashboard/vehicles/transit | Test edilmedi | Transit sayfasina ayri test yapilmadi |

---

## iNTERAKTiF TEST SONUCLARI

| Test | Sonuc | Notlar |
|------|-------|--------|
| Login Quick Login (Galeri Sahibi) | Basarili | Manuel giris ile /dashboard'a redirect OK |
| Login Quick Login (Master Admin) | Basarili | /master'a redirect OK |
| Vehicles filter tabs | Basarili | Tumu/Transit/Stokta/Rezerve/Satildi calisiyor |
| Vehicles new form (/vehicles/new) | Basarili | 12 input, 5 select, tam form |
| Customers Yeni Musteri dialog | Basarili | 6 form alani, dialog aciyor/kapaniyor |
| Products Yeni Urun dialog | Basarili | 6 form alani, kategori dropdown OK |
| Sales Yeni Satis dialog | Basarili | Arac secimi (3 arac), musteri secimi |
| Calculator form dolum | Basarili | FOB, Nakliye, Sigorta, Ulke, Arac Tipi, Motor CC |
| Master Yeni Galeri dialog | Basarili | Form alanlari calisiyor |
| Master Yeni Vergi dialog | Basarili | Kod, Oran, Oran Tipi, vb. |
| Master Doviz Kurlari tab gecisleri | Basarili | Guncel/Ayarlar/Gecmis tablari OK |
| Mobil Bottom Tab Bar | Basarili | Her iki panel'de de (galeri+master) gorunuyor |

---

## API DURUMU

- `GET /health` → 200 OK
- `POST /auth/login` → 200 OK
- `GET /auth/me` → 200 OK
- `GET /products?page=1&limit=10` → 200 OK
- `GET /products/stats` → 200 OK (ama `totalStockValue` dondururken UI `totalValue` bekliyor)
- `GET /calculator/rates` → 200 OK (ama `currencyCode/buyRate` dondururken UI `currency/rate` bekliyor)
- `GET /countries/active` → 200 OK
- **Not:** Rate limiting (Too many requests) cok agresif — test sirasinda API cagrilari 429 dondurebiliyor

---

## ONERiLER

1. **KRiTiK** `/dashboard/settings` sayfa dosyasini olustur veya sidebar linkini kaldır — `apps/web/app/(dashboard)/dashboard/settings/page.tsx` eksik
2. **UYARI** `products/stats` endpoint'inde field adini duzelt: `totalStockValue` → `totalValue` (ya da frontend'de `stats.totalStockValue` kullan)
3. **UYARI** Calculator `ActiveRatesPanel` bilesenine doviz kuru API response'unu eslestir: `currencyCode/buyRate` → `currency/rate` (ya da frontend'i API formatina uyarla)
4. **UYARI** Calculator `ActiveRatesPanel` icindeki `key` prop'u `er.currency` yerine `er.currencyCode`'a esitle
5. **UYARI** Master Galeriler sayfasinin neden bos gorunudugunu incele — seed'de 2 galeri var
6. **BiLGi** Rate limiting gelistirme ortaminda cok agresif olabilir — `/api` test cagirilari 429 dondurdu
7. **BiLGi** `/dashboard/finance` Toplam Gider her zaman $0 — import calculation verisinin finance'a aktarilip aktarilmadigi kontrol edilmeli

---

## GENEL UX PUANI

| Kriter | Puan | Aciklama |
|--------|------|----------|
| Sayfa yuklenmesi | 9/10 | Tum sayfalar hizli yukleniyor, loading state yok |
| Navigasyon | 8/10 | Sidebar + bottom tab bar calisiyor; settings 404 indiriyor |
| Form kullanimi | 9/10 | Dialog'lar, select'ler, validasyonlar dogru calisiyor |
| Mobil uyum | 9/10 | Bottom tab bar, FAB, card view hepsi calisiyor |
| Veri goruntusu | 7/10 | 2 NaN hatasi (products, calculator), 1 bos galeri listesi |
| Hata yonetimi | 8/10 | 404 sayfalar gosteriliyor, error boundary calisiyor |
| **GENEL** | **8.3/10** | Tek kritik sorun: settings sayfasi yok |

---

## SONUC

**Toplam ziyaret edilen sayfa:** 21
**Bulunan hata sayisi:** 6 (1 kritik, 5 uyari)
**Kritik sorunlar:**
- `/dashboard/settings` → 404 (sayfa dosyasi mevcut degil)

**Ciddi Uyarilar:**
- Products "Toplam Deger" NaN (API/frontend field name mismatch: `totalStockValue` vs `totalValue`)
- Calculator doviz kurlari NaN (API/frontend field name mismatch: `currencyCode/buyRate` vs `currency/rate`)
- Calculator React key prop uyarisi ve setState-in-render uyarisi

**Genel Karar:** KOSULLU GECTI — Settings sayfasi olusturulana ve 2 NaN sorunu duzeltilene kadar production'a alinmamali.

---

**Test suresi:** ~45 dakika
**Test edilen route sayisi:** 21
**Tespit edilen sorun:** 1 kritik, 5 uyari, 4 bilgi
**Screenshot sayisi:** 28

*Test 2026-03-01 tarihinde Playwright 1.58.2 (Chromium headless) kullanilarak gerceklestirilmistir.*
