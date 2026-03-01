# TEST SENARYOLARI — KKTC Araç Galerisi Yönetim Sistemi

> **Son Güncelleme:** 2026-03-01
> **Test Ortamı:** Lokal (localhost:3000 / localhost:3001)

---

## 1. GENELBİLGİLER

### Test Kullanıcıları (Şifre: 123456)

| # | E-posta | Rol | Galeri | Notlar |
|----|---------|-----|--------|--------|
| 1 | admin@kktcgaleri.com | MASTER_ADMIN | — | Platform yönetimi |
| 2 | owner@demogaleri.com | GALLERY_OWNER | Demo Galeri | Tam yetki |
| 3 | manager@demogaleri.com | GALLERY_MANAGER | Demo Galeri | Sahip gibi yetki |
| 4 | sales@demogaleri.com | SALES | Demo Galeri | Araç/ürün/müşteri satış |
| 5 | accountant@demogaleri.com | ACCOUNTANT | Demo Galeri | Finans/rapor okuma |
| 6 | staff@demogaleri.com | STAFF | Demo Galeri | Sadece okuma |
| 7 | owner@premiummotors.com | GALLERY_OWNER | Premium Motors | 2. Galeri |

### Mock Veri Özeti

- **Galeriler:** Demo Galeri (6 kullanıcı), Premium Motors (1 kullanıcı)
- **Araçlar:** 12 toplam
  - Demo Galeri: 3 TRANSIT, 4 IN_STOCK, 1 RESERVED, 2 SOLD
  - Premium Motors: 2 araç
- **Müşteriler:** 7 (6 Demo, 1 Premium)
- **Satışlar:** 2 kayıt
- **Ürünler:** 8 (1 adet minimum stok altında)
- **Platform Bildirimleri:** 3
- **Denetim Logları:** 4
- **Vergi Oranları:** 13
- **Ülkeler:** 6
- **Döviz Kurları:** 5

### Frontend Rotaları

**Master Panel (MASTER_ADMIN):**
- `/master` — Ana sayfa
- `/master/tax-rates` — Vergi oranları
- `/master/exchange-rates` — Döviz kurları
- `/master/countries` — Ülkeler
- `/master/galleries` — Galeriler
- `/master/audit-logs` — Denetim logları
- `/master/notifications` — Bildirimler

**Galeri Paneli (GALLERY_OWNER, GALLERY_MANAGER, SALES, ACCOUNTANT, STAFF):**
- `/dashboard` — Ana sayfa
- `/dashboard/vehicles` — Araç listesi
- `/dashboard/vehicles/new` — Yeni araç
- `/dashboard/vehicles/[id]` — Araç detayı
- `/dashboard/calculator` — İthalat maliyeti hesaplama
- `/dashboard/products` — Ürün yönetimi
- `/dashboard/customers` — Müşteri yönetimi
- `/dashboard/sales` — Satış yönetimi
- `/dashboard/finance` — Finans raporları
- `/dashboard/reports` — Raporlama

---

## 2. TEST SENARYOLARI — ROL BAZLI

### 2.1 MASTER_ADMIN (admin@kktcgaleri.com)

#### 2.1.1 Giriş & Kimlik Doğrulama

- [ ] **MA-AUTH-01:** Doğru şifre (123456) ile giriş başarılı olur
  - Beklenen: Redirect → `/master`, token saklanır, session kalıcı

- [ ] **MA-AUTH-02:** Yanlış şifre ile giriş başarısız olur
  - Beklenen: Hata mesajı "Geçersiz kimlik bilgileri"

- [ ] **MA-AUTH-03:** E-posta doğrulama (geçerli format)
  - Beklenen: admin@kktcgaleri.com kabul edilir

- [ ] **MA-AUTH-04:** Boş alan validasyonu
  - Beklenen: "E-posta zorunlu" / "Şifre zorunlu" hataları

- [ ] **MA-AUTH-05:** Token süresi dolmadan sonraki isteklerde session kalıyor
  - Beklenen: Sayfalar yüklenir, logout'a kadar devam eder

- [ ] **MA-AUTH-06:** Logout işlemi token'ı temizler
  - Beklenen: Login sayfasına yönlenir, `/login` erişim mümkün

#### 2.1.2 Navigasyon & Erişim Kontrolü

- [ ] **MA-NAV-01:** Master Panel menüsü erişim
  - Beklenen: 7 sekmesi görülür (Tax Rates, Exchange Rates, Countries, Galleries, Audit Logs, Notifications, Dashboard)

- [ ] **MA-NAV-02:** `/master` erişim başarılı
  - Beklenen: Master panel ana sayfası yüklenir

- [ ] **MA-NAV-03:** `/master/tax-rates` erişim başarılı
  - Beklenen: Vergi oranları tablosu görülür (13 kayıt)

- [ ] **MA-NAV-04:** `/master/exchange-rates` erişim başarılı
  - Beklenen: Döviz kurları tablosu görülür (5 kayıt)

- [ ] **MA-NAV-05:** `/master/countries` erişim başarılı
  - Beklenen: Ülkeler tablosu görülür (6 kayıt)

- [ ] **MA-NAV-06:** `/master/galleries` erişim başarılı
  - Beklenen: Galeriler listesi görülür (2 galeri)

- [ ] **MA-NAV-07:** `/master/audit-logs` erişim başarılı
  - Beklenen: Denetim logları tablosu görülür (4+ kayıt)

- [ ] **MA-NAV-08:** `/master/notifications` erişim başarılı
  - Beklenen: Platform bildirimleri listesi görülür (3 kayıt)

- [ ] **MA-NAV-09:** `/dashboard` erişim engellenir
  - Beklenen: 403 Forbidden VEYA redirect `/master`

- [ ] **MA-NAV-10:** `/dashboard/vehicles` erişim engellenir
  - Beklenen: 403 Forbidden VEYA redirect `/master`

#### 2.1.3 CRUD İşlemleri — Vergi Oranları

- [ ] **MA-TAXRATE-01:** Vergi oranı listesini görüntüle
  - Beklenen: Minimum 13 kayıt, sütunlar: Ülke, Oranı (%), Tür

- [ ] **MA-TAXRATE-02:** Yeni vergi oranı oluştur
  - Beklenen: Form açılır, Ülke + Oranı + Tür (CUSTOMS/FIF/VAT) seçimi
  - Test: TR, %15, CUSTOMS → Kaydet → Listede görülür

- [ ] **MA-TAXRATE-03:** Vergi oranını güncelle
  - Beklenen: Mevcut oranı düzenleme açılır
  - Test: Oranı %16 → %17 → Kaydet → Listeyi yenile

- [ ] **MA-TAXRATE-04:** Vergi oranını sil
  - Beklenen: Silme onayı → Listeden kaldırılır
  - Test: Silme işlemi audit log'a kaydedilir

- [ ] **MA-TAXRATE-05:** Vergi oranında boş alan validasyonu
  - Beklenen: "Ülke zorunlu" / "Oranı zorunlu" hataları

- [ ] **MA-TAXRATE-06:** Oranında negatif değer engellenir
  - Beklenen: Hata "Oran 0-100 arasında olmalıdır"

#### 2.1.4 CRUD İşlemleri — Döviz Kurları

- [ ] **MA-EXCHRATE-01:** Döviz kurlarını listele
  - Beklenen: 5+ kayıt, sütunlar: Para Birimi, Kur, Güncelleme Tarihi

- [ ] **MA-EXCHRATE-02:** Yeni döviz kuru ekle
  - Beklenen: Form açılır, Para Birimi + Kur seçimi
  - Test: USD, 32.50 → Kaydet → Listede görülür

- [ ] **MA-EXCHRATE-03:** Döviz kurunu güncelle
  - Beklenen: Mevcut kuru düzenleme açılır
  - Test: 32.50 → 33.00 → Kaydet → Listeyi yenile

- [ ] **MA-EXCHRATE-04:** Döviz kurunu sil
  - Beklenen: Silme onayı → Listeden kaldırılır

- [ ] **MA-EXCHRATE-05:** Kurda hatalı format validasyonu
  - Beklenen: "Geçerli sayı girin" hataları

- [ ] **MA-EXCHRATE-06:** Kurda negatif değer engellenir
  - Beklenen: Hata "Kur 0'dan büyük olmalıdır"

#### 2.1.5 CRUD İşlemleri — Ülkeler

- [ ] **MA-COUNTRY-01:** Ülkeleri listele
  - Beklenen: 6 kayıt, sütunlar: Ülke Adı, Kod, Gümrük Oranı

- [ ] **MA-COUNTRY-02:** Yeni ülke ekle
  - Beklenen: Form açılır, Ülke Adı + Kod (2 harf) + Gümrük Oranı (%)
  - Test: Bulgaria, BG, 10 → Kaydet → Listede görülür

- [ ] **MA-COUNTRY-03:** Ülkeyi güncelle
  - Beklenen: Mevcut ülke düzenleme açılır
  - Test: Gümrük oranını 10 → 12 → Kaydet

- [ ] **MA-COUNTRY-04:** Ülkeyi sil
  - Beklenen: Silme onayı → Listeden kaldırılır

- [ ] **MA-COUNTRY-05:** Ülke kodunda 2 harf validasyonu
  - Beklenen: Hata "Kod 2 karakterli olmalıdır"

- [ ] **MA-COUNTRY-06:** Duplikat ülke kodu engellenir
  - Beklenen: Hata "Bu kod zaten mevcut"

#### 2.1.6 CRUD İşlemleri — Galeriler

- [ ] **MA-GALLERY-01:** Galeriler listesini görüntüle
  - Beklenen: 2 galeri: Demo Galeri, Premium Motors

- [ ] **MA-GALLERY-02:** Galeri detayını görüntüle
  - Beklenen: Galeri adı, adres, telefon, sahip adı vb. görülür

- [ ] **MA-GALLERY-03:** Galeriyi düzenle
  - Beklenen: Form açılır, değerleri değiştirebilir
  - Test: Adres güncelleme → Kaydet → Listeyi yenile

- [ ] **MA-GALLERY-04:** Yeni galeri oluştur
  - Beklenen: Form açılır, Galeri Adı + Adres + Telefon + Sahip E-posta
  - Test: Test Galeri, İstanbul, 0212..., test@galeri.com → Kaydet

- [ ] **MA-GALLERY-05:** Galeriye ait kullanıcıları görüntüle
  - Beklenen: Galeri detayında kullanıcı listesi görülür

#### 2.1.7 CRUD İşlemleri — Bildirimler

- [ ] **MA-NOTIF-01:** Platform bildirimlerini listele
  - Beklenen: 3+ kayıt görülür

- [ ] **MA-NOTIF-02:** Bildirim detayını görüntüle
  - Beklenen: Başlık, İçerik, Tarih, Hedef Rol görülür

- [ ] **MA-NOTIF-03:** Yeni bildirim oluştur
  - Beklenen: Form açılır, Başlık + İçerik + Hedef Rol (All/Owners/Managers/etc.)
  - Test: "Sistem Bakım", "XX:XX'de bakım yapılacak", All → Kaydet

- [ ] **MA-NOTIF-04:** Bildirimi düzenle
  - Beklenen: Mevcut bildirim düzenleme açılır, değer değiştirebilir

- [ ] **MA-NOTIF-05:** Bildirimi sil
  - Beklenen: Silme onayı → Listeden kaldırılır

#### 2.1.8 CRUD İşlemleri — Denetim Logları

- [ ] **MA-AUDIT-01:** Denetim loglarını listele
  - Beklenen: 4+ kayıt, sütunlar: İşlem, Kullanıcı, Tarih, Detay

- [ ] **MA-AUDIT-02:** Denetim logunu filtrele (İşlem türü)
  - Beklenen: CREATE / UPDATE / DELETE filtrelemeleri çalışır

- [ ] **MA-AUDIT-03:** Denetim logunu tarih aralığında filtrele
  - Beklenen: Başlangıç + Bitiş tarihi seçilerek filtreleme yapılır

- [ ] **MA-AUDIT-04:** Denetim logunu görüntüle
  - Beklenen: Detay popup'ı açılır, tam işlem bilgisi görülür

- [ ] **MA-AUDIT-05:** Denetim logunu silme engellenir
  - Beklenen: Sil butonu aktif değildir VEYA hata döner

#### 2.1.9 İş Mantığı

- [ ] **MA-BIZ-01:** Yeni vergi oranı → Tüm galeriler otomatik görür
  - Beklenen: Galeri sahibi, hesaplama sayfasında yeni oranı kullanabilir

- [ ] **MA-BIZ-02:** Döviz kuru güncellemesi → TaxSnapshot oluşur
  - Beklenen: Veritabanında exchange_rate_id kaydedilir

- [ ] **MA-BIZ-03:** Vergi/döviz değişikliği → Denetim logu kaydedilir
  - Beklenen: Audit log'larda CREATE/UPDATE işlemi görülür

- [ ] **MA-BIZ-04:** Silinmiş veri → Soft delete (archive) uygulanır
  - Beklenen: Veritabanında deleted_at timestamp'ı saklanır

#### 2.1.10 Çok-Kiracı İzolasyonu

- [ ] **MA-MULTI-01:** Master admin Demo Galeri araçlarını görebilir
  - Beklenen: Galeri paneline erişebilir, Demo Galeri araçlarını listeler
  - Not: Master admin tüm galeri verilerine erişmeli (admin ayrıcalığı)

- [ ] **MA-MULTI-02:** Master admin Premium Motors araçlarını görebilir
  - Beklenen: Galeri paneline erişebilir, Premium Motors araçlarını listeler

- [ ] **MA-MULTI-03:** Başka galerinin verisi editlemesi engellenir
  - Beklenen: Yazma işleminde 403 hata

#### 2.1.11 Edge Case'ler

- [ ] **MA-EDGE-01:** Token süresinin dolmasından sonra yeni istek
  - Beklenen: 401 Unauthorized → Logout sayfasına yönlenir

- [ ] **MA-EDGE-02:** Sayfayı yenilemeden sonra session kalıcı
  - Beklenen: Token localStorage'da, sayfa yüklenir

- [ ] **MA-EDGE-03:** Birden fazla tab'ta eş zamanlı oturum
  - Beklenen: Token'lar eşleşir, her tab'ta erişim olur

- [ ] **MA-EDGE-04:** SQL injection testi: E-postaya `' OR '1'='1` giriş
  - Beklenen: Hata, giriş başarısız

- [ ] **MA-EDGE-05:** XSS testi: Ülke adına `<script>alert(1)</script>` giriş
  - Beklenen: Script çalışmaz, metin olarak kaydedilir

---

### 2.2 GALLERY_OWNER — Demo Galeri (owner@demogaleri.com)

#### 2.2.1 Giriş & Kimlik Doğrulama

- [ ] **GO-AUTH-01:** Doğru şifre (123456) ile giriş başarılı olur
  - Beklenen: Redirect → `/dashboard`, galeri panosunda açılır

- [ ] **GO-AUTH-02:** Yanlış şifre ile giriş başarısız olur
  - Beklenen: Hata mesajı "Geçersiz kimlik bilgileri"

- [ ] **GO-AUTH-03:** Token süresi dolmadan sonraki isteklerde session kalıyor
  - Beklenen: Sayfalar yüklenir, logout'a kadar devam eder

- [ ] **GO-AUTH-04:** Logout işlemi token'ı temizler
  - Beklenen: Login sayfasına yönlenir

#### 2.2.2 Navigasyon & Erişim Kontrolü

- [ ] **GO-NAV-01:** Galeri Panel menüsü erişim
  - Beklenen: 10 sekme görülür (Dashboard, Vehicles, Calculator, Products, Customers, Sales, Finance, Reports, Users, Settings)

- [ ] **GO-NAV-02:** `/dashboard` erişim başarılı
  - Beklenen: Pano açılır, araç sayıları (TRANSIT: 3, IN_STOCK: 4, RESERVED: 1, SOLD: 2)

- [ ] **GO-NAV-03:** `/dashboard/vehicles` erişim başarılı
  - Beklenen: Araç listesi görülür (Demo Galeri: 10 araç)

- [ ] **GO-NAV-04:** `/dashboard/calculator` erişim başarılı
  - Beklenen: İthalat hesaplama formu açılır

- [ ] **GO-NAV-05:** `/dashboard/products` erişim başarılı
  - Beklenen: Ürün listesi görülür (8 ürün, 1 stok düşük uyarısı)

- [ ] **GO-NAV-06:** `/dashboard/customers` erişim başarılı
  - Beklenen: Müşteri listesi görülür (6 müşteri)

- [ ] **GO-NAV-07:** `/dashboard/sales` erişim başarılı
  - Beklenen: Satış listesi görülür (2 satış)

- [ ] **GO-NAV-08:** `/dashboard/finance` erişim başarılı
  - Beklenen: Finans raporları açılır

- [ ] **GO-NAV-09:** `/dashboard/reports` erişim başarılı
  - Beklenen: Raporlama ara yüzü açılır

- [ ] **GO-NAV-10:** `/master` erişim engellenir
  - Beklenen: 403 Forbidden VEYA redirect `/dashboard`

- [ ] **GO-NAV-11:** `/master/tax-rates` erişim engellenir
  - Beklenen: 403 Forbidden VEYA redirect `/dashboard`

#### 2.2.3 CRUD İşlemleri — Araçlar

- [ ] **GO-VEH-01:** Araç listesini görüntüle
  - Beklenen: 10 araç (Demo Galeri'ye ait), sütunlar: Marka, Model, Plaka, Durum

- [ ] **GO-VEH-02:** Araçları duruma göre filtrele
  - Beklenen: TRANSIT / IN_STOCK / RESERVED / SOLD filtrelemeleri çalışır

- [ ] **GO-VEH-03:** Araçları aramada filtrele
  - Beklenen: Plaka / marka / model arama çalışır

- [ ] **GO-VEH-04:** Araç detayını görüntüle
  - Beklenen: Detay sayfası açılır, tüm bilgiler görülür

- [ ] **GO-VEH-05:** Yeni araç oluştur
  - Beklenen: Form açılır, Marka + Model + Yıl + Motor Hacmi + CIF + Nakliye + Sigorta + Ülke
  - Test: Toyota, Corolla, 2022, 1600, $6000, $600, $100, JP → Kaydet → Listede TRANSIT durumda görülür

- [ ] **GO-VEH-06:** Araç bilgilerini güncelle
  - Beklenen: Detay sayfasından edit → değerleri değiştirebilir
  - Test: Model → Yaris → Kaydet

- [ ] **GO-VEH-07:** Aracı TRANSIT → IN_STOCK değiştir
  - Beklenen: Durum değişir, TaxSnapshot oluşur (vergi/döviz kaydedilir)

- [ ] **GO-VEH-08:** Aracı IN_STOCK → RESERVED değiştir
  - Beklenen: Durum değişir, müşteri seçimi ZORUNLU

- [ ] **GO-VEH-09:** Aracı RESERVED → SOLD değiştir
  - Beklenen: Durum değişir, Satış detayları (fiyat, müşteri) ZORUNLU

- [ ] **GO-VEH-10:** Aracı sil
  - Beklenen: Silme onayı → Listeden kaldırılır (soft delete)

- [ ] **GO-VEH-11:** Araç fotoğrafını yükle
  - Beklenen: Cloudinary'ye yüklenir, detay sayfasında görülür

- [ ] **GO-VEH-12:** Araç belgesi (kaydı, pasaportu) yükle
  - Beklenen: Cloudinary'ye yüklenir, detay sayfasında erişim linki görülür

#### 2.2.4 CRUD İşlemleri — Ürünler

- [ ] **GO-PRD-01:** Ürün listesini görüntüle
  - Beklenen: 8 ürün (Demo Galeri), sütunlar: Ürün Adı, Kategori, Stok, Min. Stok

- [ ] **GO-PRD-02:** Minimum stok altında ürün uyarısı
  - Beklenen: 1 ürün için "Stok Düşük" uyarısı görülür

- [ ] **GO-PRD-03:** Yeni ürün ekle
  - Beklenen: Form açılır, Ürün Adı + Kategori + Stok + Min. Stok
  - Test: Yağ Filtresi, Araç Bakım, 50, 20 → Kaydet → Listede görülür

- [ ] **GO-PRD-04:** Ürün bilgilerini güncelle
  - Beklenen: Detay sayfasında edit → stok, fiyat vb. değiştirebilir

- [ ] **GO-PRD-05:** Ürünü sil
  - Beklenen: Silme onayı → Listeden kaldırılır

- [ ] **GO-PRD-06:** Stok sayısında negatif değer engellenir
  - Beklenen: Hata "Stok 0 veya daha büyük olmalıdır"

#### 2.2.5 CRUD İşlemleri — Müşteriler

- [ ] **GO-CUST-01:** Müşteri listesini görüntüle
  - Beklenen: 6 müşteri (Demo Galeri), sütunlar: Adı, Soyadı, E-posta, Telefon

- [ ] **GO-CUST-02:** Müşteri detayını görüntüle
  - Beklenen: Kişisel bilgiler + satış geçmişi görülür

- [ ] **GO-CUST-03:** Yeni müşteri ekle
  - Beklenen: Form açılır, Ad + Soyad + E-posta + Telefon + Adres
  - Test: Ahmet, Yılmaz, ahmet@mail.com, 0532..., Ankara → Kaydet

- [ ] **GO-CUST-04:** Müşteri bilgilerini güncelle
  - Beklenen: Detay sayfasından edit → değerleri değiştirebilir

- [ ] **GO-CUST-05:** Müşteriye ait satışları görüntüle
  - Beklenen: Satış listesi müşterinin adıyla filtrelenir

- [ ] **GO-CUST-06:** Müşteriyi sil
  - Beklenen: Silme onayı → Listeden kaldırılır

- [ ] **GO-CUST-07:** E-posta formatı validasyonu
  - Beklenen: Hata "Geçerli e-posta girin"

#### 2.2.6 CRUD İşlemleri — Satışlar

- [ ] **GO-SALE-01:** Satış listesini görüntüle
  - Beklenen: 2 satış (Demo Galeri), sütunlar: Araç, Müşteri, Fiyat, Tarih

- [ ] **GO-SALE-02:** Satış detayını görüntüle
  - Beklenen: Araç, müşteri, fiyat, tarih, kar marjı görlür

- [ ] **GO-SALE-03:** Yeni satış oluştur (SOLD araç seçilir)
  - Beklenen: Form açılır, Araç + Müşteri + Satış Fiyatı
  - Test: IN_STOCK araç seçin → Satış Fiyatı: $8000 → Müşteri: Ahmet Yılmaz → Kaydet
  - Beklenen: Araç SOLD durumuna geçer, kar otomatik hesaplanır

- [ ] **GO-SALE-04:** Satış fiyatı < toplam maliyet ise uyarı
  - Beklenen: Uyarı "Satış fiyatı maliyetten düşük"

- [ ] **GO-SALE-05:** Kar marjı otomatik hesaplanması
  - Beklenen: Satış Fiyatı - Toplam Maliyet = Kar Marjı

- [ ] **GO-SALE-06:** Satışı düzenle
  - Beklenen: Fiyat, müşteri vb. değiştirebilir

- [ ] **GO-SALE-07:** Satışı sil
  - Beklenen: Silme onayı → Araç IN_STOCK'a geri döner

#### 2.2.7 CRUD İşlemleri — Ürün/Araçlar (VehicleExpense)

- [ ] **GO-VEXP-01:** Aracın masraflarını görüntüle
  - Beklenen: Detay sayfasında Masraflar sekmesi açılır

- [ ] **GO-VEXP-02:** Aracı masraf ekle
  - Beklenen: Masraf Türü + Tutar + Tarih formu açılır
  - Test: Bakım, 500 TL, Bugün → Kaydet

- [ ] **GO-VEXP-03:** Masraflar toplam maliyete eklenir
  - Beklenen: CIF + vergiler + masraflar = Toplam Maliyet

#### 2.2.8 İş Mantığı — İthalat Hesaplama

- [ ] **GO-CALC-01:** Hesaplama sayfasını aç
  - Beklenen: Form açılır, tüm giriş alanları görülür

- [ ] **GO-CALC-02:** CIF hesaplaması: FOB + Nakliye + Sigorta
  - Test: FOB: 6000, Nakliye: 600, Sigorta: 100 → CIF: 6700 ✓

- [ ] **GO-CALC-03:** Gümrük Vergisi = CIF × Ülke Oranı
  - Test: JP (%10) → 6700 × 0.10 = 670 ✓

- [ ] **GO-CALC-04:** FIF = CIF × Motor Hacmi Oranı
  - Test: 1600cc (%18) → 6700 × 0.18 = 1206 ✓

- [ ] **GO-CALC-05:** KDV = (CIF + Gümrük + FIF) × %20
  - Test: (6700 + 670 + 1206) × 0.20 = 1715.20 ✓

- [ ] **GO-CALC-06:** GKK = CIF × %2.5
  - Test: 6700 × 0.025 = 167.5 ✓

- [ ] **GO-CALC-07:** Rıhtım = CIF × %4.4
  - Test: 6700 × 0.044 = 294.8 ✓

- [ ] **GO-CALC-08:** Genel FIF = Motor CC × 2.03 TL (döviz çevirmeli)
  - Test: 1600 × 2.03 TL ÷ USD kuru ✓

- [ ] **GO-CALC-09:** Bandrol = ~33.5 TL (sabit)
  - Test: 33.5 TL ✓

- [ ] **GO-CALC-10:** Toplam Maliyet = CIF + tüm vergiler
  - Test: 6700 + 670 + 1206 + 1715.20 + 167.5 + 294.8 + Genel FIF + 33.5 ✓

- [ ] **GO-CALC-11:** Hesaplama sonrası TaxSnapshot kaydedilir
  - Beklenen: Veritabanında tax_snapshot_id ile kayıt oluşur

- [ ] **GO-CALC-12:** Hesaplama farklı ülkeler için doğru çalışır
  - Test: Japan (%10 gümrük) vs. AB Ülkesi (%0 gümrük) → Sonuçlar farklı

- [ ] **GO-CALC-13:** Hesaplama farklı motor hacmi oranları için doğru çalışır
  - Test: 800cc (%15) vs. 2200cc (%25) vs. 3000cc (%30) → FIF farklı

- [ ] **GO-CALC-14:** Hatalı giriş validasyonu
  - Test: Negatif FOB → Hata "FOB 0'dan büyük olmalıdır"

- [ ] **GO-CALC-15:** Eksik alan validasyonu
  - Test: FOB boş → Hata "FOB zorunlu"

#### 2.2.9 İş Mantığı — Araç Durumu & Transit Takip

- [ ] **GO-TRANSIT-01:** Yeni araç TRANSIT durumunda oluşur
  - Beklenen: Detay sayfasında durum = TRANSIT

- [ ] **GO-TRANSIT-02:** TRANSIT → IN_STOCK değişikliğini kaydet
  - Beklenen: Durum değişir, TaxSnapshot oluşur

- [ ] **GO-TRANSIT-03:** IN_STOCK → RESERVED (müşteri seçilir)
  - Beklenen: Müşteri atanır, durum değişir

- [ ] **GO-TRANSIT-04:** RESERVED → IN_STOCK (rezervasyonu iptal)
  - Beklenen: Müşteri kaldırılır, durum geri döner

- [ ] **GO-TRANSIT-05:** SOLD araç satış detaylarını göster
  - Beklenen: Satış fiyatı, müşteri, kar marjı görülür

#### 2.2.10 İş Mantığı — Finans & Raporlar

- [ ] **GO-FIN-01:** Finans panosunu aç
  - Beklenen: Grafikler + tablolar yüklenir

- [ ] **GO-FIN-02:** Araç stok değeri hesapla
  - Beklenen: IN_STOCK araçların toplam maliyeti görlür

- [ ] **GO-FIN-03:** Aylık satış raporunu indir (Excel)
  - Beklenen: .xlsx dosyası indirilir, veriler doğru

- [ ] **GO-FIN-04:** Raporu PDF olarak indir
  - Beklenen: .pdf dosyası indirilir, biçim doğru

- [ ] **GO-FIN-05:** Raporları tarih aralığında filtrele
  - Beklenen: Başlangıç + Bitiş tarihi seçilerek filtreleme yapılır

#### 2.2.11 İş Mantığı — Kullanıcı & Ayarlar

- [ ] **GO-USER-01:** Galeri kullanıcılarını listele
  - Beklenen: 6 kullanıcı (Demo Galeri: owner, manager, sales, accountant, staff, +1)

- [ ] **GO-USER-02:** Yeni kullanıcı ekle
  - Beklenen: Form açılır, E-posta + Rol (OWNER/MANAGER/SALES/ACCOUNTANT/STAFF)
  - Test: newstaff@demogaleri.com, STAFF → Kaydet → Listede görülür

- [ ] **GO-USER-03:** Kullanıcı rolünü değiştir
  - Beklenen: STAFF → SALES → Kaydet → Rol güncellenir

- [ ] **GO-USER-04:** Kullanıcıyı sil
  - Beklenen: Silme onayı → Listeden kaldırılır

- [ ] **GO-USER-05:** Galeri ayarlarını görüntüle
  - Beklenen: Galeri adı, adres, telefon vb. görlür

- [ ] **GO-USER-06:** Galeri ayarlarını güncelle
  - Beklenen: Adres, telefon vb. değiştirebilir → Kaydet

#### 2.2.12 Çok-Kiracı İzolasyonu

- [ ] **GO-MULTI-01:** Demo Galeri araçlarını görebilir
  - Beklenen: Araç listesi 10 araç görlür

- [ ] **GO-MULTI-02:** Premium Motors araçlarını GÖREMEZ
  - Beklenen: Araç listesinde sadece Demo Galeri araçları

- [ ] **GO-MULTI-03:** Premium Motors müşterilerini GÖREMEZ
  - Beklenen: Müşteri listesinde 6 müşteri (Premium 1 dışlanır)

- [ ] **GO-MULTI-04:** Premium Motors ürünlerini GÖREMEZ
  - Beklenen: Ürün listesinde sadece Demo Galeri ürünleri

- [ ] **GO-MULTI-05:** Premium Motors satışlarını GÖREMEZ
  - Beklenen: Satış listesinde sadece Demo Galeri satışları

- [ ] **GO-MULTI-06:** Premium Motors aracını editlemesi engellenir
  - Test: URL'ye Premium Motors araç ID gir → 403 Forbidden

- [ ] **GO-MULTI-07:** Premium Motors aracını sil intent'i engellenir
  - Test: Silme API'sine Premium Motors araç ID gönder → 403

#### 2.2.13 Edge Case'ler

- [ ] **GO-EDGE-01:** Eksik vergi oranı → Hesaplama başarısız
  - Test: Yeni ülke ekle fakat vergi oranı ekleme → Hesaplama hata

- [ ] **GO-EDGE-02:** Eksik döviz kuru → Hesaplama başarısız
  - Test: Döviz kurunu sil → Hesaplama hata

- [ ] **GO-EDGE-03:** 2 araç aynı plaka
  - Test: Yeni araç, mevcut plakalı araç → Hata VEYA uyarı

- [ ] **GO-EDGE-04:** İthalat hesaplama 0 FOB
  - Test: FOB = 0 → Hata "FOB 0'dan büyük olmalıdır"

- [ ] **GO-EDGE-05:** Silinmiş araç yine de API'de görülmez
  - Test: Araç sil → GET /vehicles → Listede yok (soft delete kontrol)

---

### 2.3 GALLERY_MANAGER — Demo Galeri (manager@demogaleri.com)

#### 2.3.1 Giriş & Kimlik Doğrulama

- [ ] **GM-AUTH-01:** Doğru şifre (123456) ile giriş başarılı olur
  - Beklenen: Redirect → `/dashboard`

- [ ] **GM-AUTH-02:** Yanlış şifre ile giriş başarısız olur
  - Beklenen: Hata "Geçersiz kimlik bilgileri"

#### 2.3.2 Navigasyon & Erişim Kontrolü

- [ ] **GM-NAV-01:** Tüm galeri paneli sayfalarına erişebilir
  - Beklenen: Vehicles, Calculator, Products, Customers, Sales, Finance, Reports, Users, Settings

- [ ] **GM-NAV-02:** Master Panel'e erişim engellenir
  - Beklenen: 403 Forbidden

#### 2.3.3 CRUD İşlemleri — Araçlar

- [ ] **GM-VEH-01:** Araçları listele (Demo Galeri: 10)
  - Beklenen: Listede 10 araç

- [ ] **GM-VEH-02:** Yeni araç oluştur
  - Beklenen: Form çalışır → Kaydet → Listede görülür

- [ ] **GM-VEH-03:** Araç güncelle
  - Beklenen: Detay sayfasında edit çalışır

- [ ] **GM-VEH-04:** Araç sil
  - Beklenen: Silme onayı → Soft delete

- [ ] **GM-VEH-05:** Araç durumu değiştir (TRANSIT → IN_STOCK → RESERVED → SOLD)
  - Beklenen: Tüm durumlar değişir, TaxSnapshot oluşur

#### 2.3.4 CRUD İşlemleri — Ürünler, Müşteriler, Satışlar

- [ ] **GM-PRD-01:** Ürün CRUD'u çalışır
  - Beklenen: Listele, Ekle, Güncelle, Sil

- [ ] **GM-CUST-01:** Müşteri CRUD'u çalışır
  - Beklenen: Listele, Ekle, Güncelle, Sil

- [ ] **GM-SALE-01:** Satış CRUD'u çalışır
  - Beklenen: Listele, Ekle, Güncelle, Sil

#### 2.3.5 İş Mantığı

- [ ] **GM-CALC-01:** İthalat hesaplama tüm kontroller çalışır
  - Beklenen: CIF, vergiler, kar marjı hesaplamaları doğru

- [ ] **GM-FIN-01:** Finans raporları tam erişim
  - Beklenen: Grafikler, tablolar, Excel/PDF export

- [ ] **GM-USER-01:** Kullanıcı yönetimi tam erişim
  - Beklenen: Ekle, düzenle, sil, rol değiştirme

#### 2.3.6 Çok-Kiracı İzolasyonu

- [ ] **GM-MULTI-01:** Demo Galeri verisini görebilir
  - Beklenen: Tüm Demo Galeri araçları/ürünleri/müşterileri

- [ ] **GM-MULTI-02:** Premium Motors verisini GÖREMEZ
  - Beklenen: 403 VEYA boş listeler

- [ ] **GM-MULTI-03:** Başka galeriye veri yazması engellenir
  - Test: Premium Motors araç ID ile DELETE → 403

#### 2.3.7 Owner vs. Manager Farkı

- [ ] **GM-DIFF-01:** Manager ile Owner aynı yetkileri mi var?
  - Beklenen: EVET — İkisi de tam CRUD + kullanıcı yönetimi + ayarlar

---

### 2.4 SALES — Demo Galeri (sales@demogaleri.com)

#### 2.4.1 Giriş & Kimlik Doğrulama

- [ ] **SALES-AUTH-01:** Doğru şifre (123456) ile giriş başarılı
  - Beklenen: `/dashboard` açılır

- [ ] **SALES-AUTH-02:** Yanlış şifre
  - Beklenen: Hata "Geçersiz kimlik bilgileri"

#### 2.4.2 Navigasyon & Erişim Kontrolü

- [ ] **SALES-NAV-01:** Vehicles erişimi OK
  - Beklenen: Araç listesi görülür

- [ ] **SALES-NAV-02:** Calculator erişimi OK
  - Beklenen: Hesaplama formu açılır

- [ ] **SALES-NAV-03:** Products erişimi OK
  - Beklenen: Ürün listesi görülür

- [ ] **SALES-NAV-04:** Customers erişimi OK
  - Beklenen: Müşteri listesi görülür

- [ ] **SALES-NAV-05:** Sales erişimi OK
  - Beklenen: Satış listesi görülür

- [ ] **SALES-NAV-06:** Finance erişimi ENGELLENIR
  - Beklenen: 403 Forbidden VEYA sayfa boş

- [ ] **SALES-NAV-07:** Reports erişimi OK (sadece görüntüleme)
  - Beklenen: Raporlar görülür ama indir/edit yok

- [ ] **SALES-NAV-08:** Users erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **SALES-NAV-09:** Settings erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **SALES-NAV-10:** Master Panel erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

#### 2.4.3 CRUD İşlemleri — Araçlar

- [ ] **SALES-VEH-01:** Araçları listele
  - Beklenen: 10 araç görülür

- [ ] **SALES-VEH-02:** Araç detayını görüntüle
  - Beklenen: Tüm bilgiler açılır

- [ ] **SALES-VEH-03:** Araç oluştur ENGELLENIR
  - Beklenen: "Yeni Araç" butonu yok VEYA tıklanmaz

- [ ] **SALES-VEH-04:** Araç düzenleme ENGELLENIR
  - Beklenen: Edit butonu yok/disabled VEYA API 403

- [ ] **SALES-VEH-05:** Araç silme ENGELLENIR
  - Beklenen: Sil butonu yok/disabled

- [ ] **SALES-VEH-06:** Araç durumu değiştirme (TRANSIT → IN_STOCK) ENGELLENIR
  - Beklenen: Durum dropdown'u disabled VEYA API 403

#### 2.4.4 CRUD İşlemleri — Ürünler

- [ ] **SALES-PRD-01:** Ürünleri listele
  - Beklenen: 8 ürün görülür

- [ ] **SALES-PRD-02:** Ürün detayını görüntüle
  - Beklenen: Tüm bilgiler açılır

- [ ] **SALES-PRD-03:** Ürün oluştur ENGELLENIR
  - Beklenen: "Yeni Ürün" butonu yok

- [ ] **SALES-PRD-04:** Ürün düzenleme ENGELLENIR
  - Beklenen: Edit butonu yok/disabled

- [ ] **SALES-PRD-05:** Ürün silme ENGELLENIR
  - Beklenen: Sil butonu yok

#### 2.4.5 CRUD İşlemleri — Müşteriler

- [ ] **SALES-CUST-01:** Müşterileri listele
  - Beklenen: 6 müşteri görülür

- [ ] **SALES-CUST-02:** Müşteri detayını görüntüle
  - Beklenen: Tüm bilgiler + satış geçmişi açılır

- [ ] **SALES-CUST-03:** Müşteri oluştur
  - Beklenen: Form açılır, Ad + Soyad + E-posta + Telefon + Adres
  - Test: Yeni müşteri → Kaydet → Listede görülür ✓

- [ ] **SALES-CUST-04:** Müşteri düzenleme
  - Beklenen: Detay sayfasında edit çalışır

- [ ] **SALES-CUST-05:** Müşteri silme ENGELLENIR
  - Beklenen: Sil butonu yok

#### 2.4.6 CRUD İşlemleri — Satışlar

- [ ] **SALES-SALE-01:** Satışları listele
  - Beklenen: 2 satış görülür

- [ ] **SALES-SALE-02:** Satış detayını görüntüle
  - Beklenen: Araç, müşteri, fiyat, kar marjı açılır

- [ ] **SALES-SALE-03:** Satış oluştur
  - Beklenen: Form açılır, Araç (IN_STOCK) + Müşteri + Fiyat
  - Test: Corolla seç → Ahmet Yılmaz → $8000 → Kaydet → Listede görülür ✓

- [ ] **SALES-SALE-04:** Satış fiyatında uyarı
  - Test: Fiyat < toplam maliyet → Uyarı "Kar negatif"

- [ ] **SALES-SALE-05:** Satış düzenleme
  - Beklenen: Detay sayfasında edit çalışır

- [ ] **SALES-SALE-06:** Satış silme ENGELLENIR
  - Beklenen: Sil butonu yok VEYA API 403

#### 2.4.7 İş Mantığı

- [ ] **SALES-CALC-01:** İthalat hesaplama OK
  - Test: CIF, vergiler, kar marjı hesaplamaları çalışır

- [ ] **SALES-REPORT-01:** Raporları görüntüle
  - Beklenen: Raporlar açılır

- [ ] **SALES-REPORT-02:** Raporları indir/export ENGELLENIR
  - Beklenen: İndir butonu yok VEYA disabled

#### 2.4.8 Çok-Kiracı İzolasyonu

- [ ] **SALES-MULTI-01:** Demo Galeri verisini görebilir
  - Beklenen: Tüm Demo Galeri araçları/ürünleri/müşterileri

- [ ] **SALES-MULTI-02:** Premium Motors verisini GÖREMEZ
  - Beklenen: 403 VEYA boş listeler

#### 2.4.9 Edge Case'ler

- [ ] **SALES-EDGE-01:** Silindi araç satışa girmesi engellenir
  - Test: Araç sil → Satış oluştur → Araç listesinde yok → Hata

- [ ] **SALES-EDGE-02:** Satışta müşteri seçimi ZORUNLU
  - Test: Müşteri seçmeden Kaydet → Hata "Müşteri zorunlu"

---

### 2.5 ACCOUNTANT — Demo Galeri (accountant@demogaleri.com)

#### 2.5.1 Giriş & Kimlik Doğrulama

- [ ] **ACC-AUTH-01:** Doğru şifre (123456) ile giriş başarılı
  - Beklenen: `/dashboard` açılır

#### 2.5.2 Navigasyon & Erişim Kontrolü

- [ ] **ACC-NAV-01:** Vehicles erişimi SADECE OKUMA
  - Beklenen: Araç listesi görülür ama edit/delete yok

- [ ] **ACC-NAV-02:** Calculator erişimi ENGELLENIR
  - Beklenen: 403 Forbidden VEYA sayfa yok

- [ ] **ACC-NAV-03:** Products erişimi SADECE OKUMA
  - Beklenen: Ürün listesi görülür ama edit/delete yok

- [ ] **ACC-NAV-04:** Customers erişimi SADECE OKUMA
  - Beklenen: Müşteri listesi görülür ama edit/delete yok

- [ ] **ACC-NAV-05:** Sales erişimi SADECE OKUMA
  - Beklenen: Satış listesi görülür ama edit/delete yok

- [ ] **ACC-NAV-06:** Finance erişimi OK (TAM)
  - Beklenen: Finans paneli, raporlar, grafikler

- [ ] **ACC-NAV-07:** Reports erişimi OK (TAM)
  - Beklenen: Raporlar, indir (Excel/PDF), filtrele

- [ ] **ACC-NAV-08:** Users erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **ACC-NAV-09:** Settings erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **ACC-NAV-10:** Master Panel erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

#### 2.5.3 CRUD İşlemleri — Okuma

- [ ] **ACC-READ-01:** Araçları listele
  - Beklenen: 10 araç görülür

- [ ] **ACC-READ-02:** Ürünleri listele
  - Beklenen: 8 ürün görülür

- [ ] **ACC-READ-03:** Müşterileri listele
  - Beklenen: 6 müşteri görülür

- [ ] **ACC-READ-04:** Satışları listele
  - Beklenen: 2 satış görülür

- [ ] **ACC-READ-05:** Detay sayfalarına erişim
  - Beklenen: Araç/ürün/müşteri/satış detayları açılır

#### 2.5.4 CRUD İşlemleri — Yazma ENGELLENIR

- [ ] **ACC-WRITE-01:** Araç oluştur ENGELLENIR
  - Beklenen: "Yeni Araç" butonu yok

- [ ] **ACC-WRITE-02:** Araç düzenleme ENGELLENIR
  - Beklenen: Edit butonu disabled/yok

- [ ] **ACC-WRITE-03:** Ürün oluştur ENGELLENIR
  - Beklenen: "Yeni Ürün" butonu yok

- [ ] **ACC-WRITE-04:** Müşteri oluştur ENGELLENIR
  - Beklenen: "Yeni Müşteri" butonu yok

- [ ] **ACC-WRITE-05:** Satış oluştur ENGELLENIR
  - Beklenen: "Yeni Satış" butonu yok

#### 2.5.5 İş Mantığı — Finans & Raporlar

- [ ] **ACC-FIN-01:** Finans panosunu açabılır
  - Beklenen: Grafikler (stok değeri, aylık satış, kar marjı vb.)

- [ ] **ACC-FIN-02:** Satış raporunu indir (Excel)
  - Beklenen: .xlsx dosyası indirilir

- [ ] **ACC-FIN-03:** Satış raporunu indir (PDF)
  - Beklenen: .pdf dosyası indirilir

- [ ] **ACC-FIN-04:** Raporları tarih aralığında filtrele
  - Test: 01/01/2026 - 28/02/2026 → Filtreli veriler indirilir

- [ ] **ACC-FIN-05:** Stok değeri hesaplaması
  - Beklenen: IN_STOCK araçların toplam CIF + masrafları

- [ ] **ACC-FIN-06:** Aylık kar marjı grafik
  - Beklenen: Grafik (bar/line) aylık karı gösterir

#### 2.5.6 Çok-Kiracı İzolasyonu

- [ ] **ACC-MULTI-01:** Demo Galeri verisini görebilir
  - Beklenen: Tüm Demo Galeri raporları

- [ ] **ACC-MULTI-02:** Premium Motors verisini GÖREMEZ
  - Beklenen: 403 VEYA boş listeler

---

### 2.6 STAFF — Demo Galeri (staff@demogaleri.com)

#### 2.6.1 Giriş & Kimlik Doğrulama

- [ ] **STAFF-AUTH-01:** Doğru şifre (123456) ile giriş başarılı
  - Beklenen: `/dashboard` açılır

#### 2.6.2 Navigasyon & Erişim Kontrolü

- [ ] **STAFF-NAV-01:** Vehicles erişimi SADECE OKUMA
  - Beklenen: Araç listesi görülür

- [ ] **STAFF-NAV-02:** Calculator erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **STAFF-NAV-03:** Products erişimi SADECE OKUMA
  - Beklenen: Ürün listesi görülür

- [ ] **STAFF-NAV-04:** Customers erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **STAFF-NAV-05:** Sales erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **STAFF-NAV-06:** Finance erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **STAFF-NAV-07:** Reports erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **STAFF-NAV-08:** Users erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **STAFF-NAV-09:** Settings erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

- [ ] **STAFF-NAV-10:** Master Panel erişimi ENGELLENIR
  - Beklenen: 403 Forbidden

#### 2.6.3 CRUD İşlemleri — Okuma

- [ ] **STAFF-READ-01:** Araçları listele
  - Beklenen: 10 araç görülür

- [ ] **STAFF-READ-02:** Ürünleri listele
  - Beklenen: 8 ürün görülür

- [ ] **STAFF-READ-03:** Araç detayını görüntüle
  - Beklenen: Detay sayfası açılır

- [ ] **STAFF-READ-04:** Ürün detayını görüntüle
  - Beklenen: Detay sayfası açılır

#### 2.6.4 CRUD İşlemleri — Yazma ENGELLENIR

- [ ] **STAFF-WRITE-01:** Araç oluştur ENGELLENIR
  - Beklenen: "Yeni Araç" butonu yok

- [ ] **STAFF-WRITE-02:** Araç düzenle ENGELLENIR
  - Beklenen: Edit butonu disabled

- [ ] **STAFF-WRITE-03:** Ürün oluştur ENGELLENIR
  - Beklenen: "Yeni Ürün" butonu yok

- [ ] **STAFF-WRITE-04:** Ürün düzenle ENGELLENIR
  - Beklenen: Edit butonu disabled

#### 2.6.5 Çok-Kiracı İzolasyonu

- [ ] **STAFF-MULTI-01:** Demo Galeri verisini görebilir
  - Beklenen: Tüm Demo Galeri araçları/ürünleri

- [ ] **STAFF-MULTI-02:** Premium Motors verisini GÖREMEZ
  - Beklenen: 403 VEYA boş listeler

---

### 2.7 GALLERY_OWNER (2. Galeri) — Premium Motors (owner@premiummotors.com)

#### 2.7.1 Giriş & Kimlik Doğrulama

- [ ] **GO2-AUTH-01:** Doğru şifre (123456) ile giriş başarılı
  - Beklenen: `/dashboard` açılır, Premium Motors context

- [ ] **GO2-AUTH-02:** Yanlış şifre
  - Beklenen: Hata "Geçersiz kimlik bilgileri"

#### 2.7.2 Navigasyon & Erişim Kontrolü

- [ ] **GO2-NAV-01:** `/dashboard` erişim
  - Beklenen: Pano açılır, Premium Motors araçları (2)

- [ ] **GO2-NAV-02:** `/dashboard/vehicles`
  - Beklenen: 2 araç (Premium Motors)

- [ ] **GO2-NAV-03:** Tüm galeri paneli sayfaları erişim
  - Beklenen: Vehicles, Calculator, Products, Customers, Sales, Finance, Reports, Users, Settings

- [ ] **GO2-NAV-04:** Master Panel erişim ENGELLENIR
  - Beklenen: 403 Forbidden

#### 2.7.3 CRUD İşlemleri — Premium Motors Araçları

- [ ] **GO2-VEH-01:** Araçları listele (Premium Motors: 2)
  - Beklenen: 2 araç görülür

- [ ] **GO2-VEH-02:** Yeni araç ekle
  - Test: BMW, X5, 2023, 3000cc, $20000, $2000, $500, Germany → Kaydet
  - Beklenen: Listede görülür (Premium Motors'a ait)

- [ ] **GO2-VEH-03:** Araç detayını görüntüle
  - Beklenen: Detay açılır

- [ ] **GO2-VEH-04:** Araç düzenle
  - Beklenen: Edit çalışır

- [ ] **GO2-VEH-05:** Araç sil
  - Beklenen: Soft delete

#### 2.7.4 Çok-Kiracı İzolasyonu — KRİTİK

- [ ] **GO2-MULTI-01:** Premium Motors araçlarını görebilir
  - Beklenen: 2 araç

- [ ] **GO2-MULTI-02:** Demo Galeri araçlarını GÖREMEZ
  - Test: `/dashboard/vehicles` → Listede 10 değil 2 araç
  - Beklenen: Demo Galeri araçları görünmez

- [ ] **GO2-MULTI-03:** Demo Galeri araç detayına erişim ENGELLENIR
  - Test: Demo Galeri araç ID'sini URL'ye gir → 403 Forbidden

- [ ] **GO2-MULTI-04:** Demo Galeri aracını silme tüm ENGELLENIR
  - Test: API'ye Demo Galeri araç DELETE request → 403

- [ ] **GO2-MULTI-05:** Demo Galeri müşterilerini GÖREMEZ
  - Beklenen: Müşteri listesinde sadece Premium Motors müşterisi (1)

- [ ] **GO2-MULTI-06:** Demo Galeri ürünlerini GÖREMEZ
  - Beklenen: Ürün listesinde sadece Premium Motors ürünleri

#### 2.7.5 Çok-Kiracı İzolasyonu — Demo Galeri Sahibi Perspektifi

- [ ] **GO2-MULTI-07:** Demo Galeri sahibi Premium Motors verisini GÖREMEZ
  - Test: Demo Galeri sahibi olarak login → Vehicles → 2 değil 10 araç
  - Beklenen: Premium Motors araçları görünmez

---

## 3. ÇAPRAZ TEST SENARYOLARI

### 3.1 Çok-Kiracı İzolasyonu

#### 3.1.1 Veri Görünürlüğü

- [ ] **CROSS-TENANT-01:** Demo Galeri OWNER, Premium Motors verisini listede göremez
  - Test: Demo OWNER login → `/dashboard/vehicles` → 10 araç (Premium 2 hariç)
  - Beklenen: Veri ayrılması kesin

- [ ] **CROSS-TENANT-02:** Demo Galeri MANAGER, Premium Motors aracını detayda açamaz
  - Test: Demo MANAGER login → URL'ye Premium araç ID gir → 403
  - Beklenen: Erişim reddi

- [ ] **CROSS-TENANT-03:** Premium OWNER, Demo Galeri aracını silmesi engellenir
  - Test: Premium OWNER → DELETE /vehicles/[demoVehicleId] → 403
  - Beklenen: Silme başarısız

- [ ] **CROSS-TENANT-04:** API query'de galleryId filtresi ZORUNLU
  - Test: Backend: SELECT * FROM vehicles WHERE userId = ? → Hata VEYA empty
  - Beklenen: WHERE galleryId = ? ZORUNLU

#### 3.1.2 Rol Eskalasyonu Engelleme

- [ ] **CROSS-ROLE-01:** STAFF, kendisini OWNER'a yükseltemeye çalışır
  - Test: STAFF → PUT /users/[id] {role: OWNER} → 403
  - Beklenen: Rol değişmez

- [ ] **CROSS-ROLE-02:** SALES, başka kullanıcının rolünü değiştirmeye çalışır
  - Test: SALES → PUT /users/[staffId] {role: MANAGER} → 403
  - Beklenen: Değişmez (yetki yok)

- [ ] **CROSS-ROLE-03:** ACCOUNTANT, vergi oranlarını değiştirmeye çalışır
  - Test: ACCOUNTANT login → Vergi oranı sayfasına git → 403
  - Beklenen: Sayfa engellenir

- [ ] **CROSS-ROLE-04:** Premium OWNER, Demo Galeri kullanıcılarını yönetemez
  - Test: Premium OWNER → Demo kullanıcıya erişim → 403
  - Beklenen: Erişim reddi

#### 3.1.3 İzin Kontrolü Matrisi

- [ ] **CROSS-PERMS-01:** MASTER_ADMIN → Master panel TAM, Gallery panel KISMEN
  - Beklenen: Master panel tam, gallery panel okuma-yazma kısıtlı

- [ ] **CROSS-PERMS-02:** GALLERY_OWNER → Gallery panel TAM, Master panel YASAK
  - Beklenen: Gallery panel tam, master panel 403

- [ ] **CROSS-PERMS-03:** SALES → CRUD kısıtlı (Customers/Products/Vehicles okuma, Sales yazma)
  - Beklenen: İzin matrisi kesin uygulanır

- [ ] **CROSS-PERMS-04:** ACCOUNTANT → Finance TAM, diğer OKUMA-ONLY
  - Beklenen: Finance raporlar/indir, diğer sayfalar okuma

- [ ] **CROSS-PERMS-05:** STAFF → Araç/Ürün OKUMA, diğer YASAK
  - Beklenen: Vehicles + Products okuma, Customers/Sales/Finance yasak

### 3.2 Eş Zamanlı Erişim

#### 3.2.1 Aynı Veriyi İki Kullanıcı Düzenleme

- [ ] **CONCURRENT-01:** Demo OWNER + Demo MANAGER aynı anda araç düzenler
  - Test: Tab 1: OWNER, araç formunda; Tab 2: MANAGER aynı araç formunda
  - Adım 1: OWNER → Model: Corolla → Kaydet
  - Adım 2: MANAGER → Model: Yaris → Kaydet
  - Beklenen: Son kayıt kazanır (Yaris) VEYA uyarı "Başka biri değiştirdi"

- [ ] **CONCURRENT-02:** Demo OWNER araç sil, Demo MANAGER aynı araç düzenle
  - Test: Tab 1: OWNER sil; Tab 2: MANAGER edit form'u açık → Form'da Kaydet tıkla
  - Beklenen: Hata "Araç bulunamadı" VEYA 404

- [ ] **CONCURRENT-03:** ACCOUNTANT rapor indirir, SALES satış ekler
  - Test: Tab 1: ACCOUNTANT rapor indir; Tab 2: SALES yeni satış ekle
  - Beklenen: İndirildi rapor, yeni satış eklenir, rapor güncelleştirilebilir

#### 3.2.2 Oturum Mekanizması

- [ ] **SESSION-01:** Aynı kullanıcı, 2 tarayıcı tab'ından login
  - Test: Tab 1: OWNER login; Tab 2: Aynı OWNER login → 2 token
  - Beklenen: Her ikisi de oturum açık

- [ ] **SESSION-02:** Aynı kullanıcı, 1 tab logout → diğer tab etkilenir mi?
  - Test: Tab 1: OWNER logout; Tab 2: OWNER sayfayı yenile → token hala var mı?
  - Beklenen: Token localStorage'de kalır, diğer tab'ı etkilemez (aynı cihaz)

- [ ] **SESSION-03:** Token süresi dolu, istekte 401 döner
  - Test: Token'ı manuel olarak geçmişe ayarla; sayfa yenile
  - Beklenen: 401 Unauthorized → Login sayfasına yönlenir

### 3.3 Veri Bütünlüğü

#### 3.3.1 TaxSnapshot Kayıt Kontrolü

- [ ] **INTEGRITY-01:** Araç durumu TRANSIT → IN_STOCK → TaxSnapshot oluştur
  - Test: OWNER araç ekle (CIF: 6700, Ülke: Japan, Motor: 1600)
  - Durum değiştir → IN_STOCK
  - Beklenen: Veritabanında tax_snapshot kaydı, exchange_rate_id + tax_rates JSON saklanır

- [ ] **INTEGRITY-02:** 2 hafta sonra döviz kuru değişirse, eski hesaplama hala doğru
  - Test: Araç TaxSnapshot (USD: 32), döviz kurunu 33 yap
  - Beklenen: Araç detayında eski snapshot'ı (32) gösterir, yeni araçlar 33 ile hesaplarsa

- [ ] **INTEGRITY-03:** Satış oluşturulduğunda kar otomatik hesaplanır
  - Test: OWNER satış ekle (Araç maliyeti: 10000, Satış: 12000)
  - Beklenen: Kar = 2000 otomatik doldurulur

- [ ] **INTEGRITY-04:** Satış fiyatı < maliyet = uyarı (ama kaydedilir)
  - Test: Satış fiyatı: 9000 (maliyet: 10000) → Uyarı + Kaydet
  - Beklenen: "Kar negatif" uyarısı, ama satış kaydedilir (kar = -1000)

#### 3.3.2 Denetim Logu Kayıt Kontrolü

- [ ] **AUDIT-01:** Vergi oranı oluşturulduğunda AUDIT_LOG kaydı
  - Test: MASTER_ADMIN → Yeni vergi oranı (TR, %15, CUSTOMS) → Kaydet
  - Beklenen: Veritabanında AUDIT_LOG, action=CREATE, entity_type=TAX_RATE

- [ ] **AUDIT-02:** Vergi oranı güncellendiğinde AUDIT_LOG kaydı
  - Test: MASTER_ADMIN → Oranı değiştir (%15 → %16) → Kaydet
  - Beklenen: AUDIT_LOG, action=UPDATE, old_value={%15}, new_value={%16}

- [ ] **AUDIT-03:** Vergi oranı silindiğinde AUDIT_LOG kaydı
  - Test: MASTER_ADMIN → Oranı sil → Onay
  - Beklenen: AUDIT_LOG, action=DELETE

- [ ] **AUDIT-04:** Denetim logu sorgulanabilir (filtreleme)
  - Test: MASTER_ADMIN → Audit Logs → İşlem: UPDATE filtrele
  - Beklenen: Sadece UPDATE işlemleri görlür

### 3.4 Hata Yönetimi

#### 3.4.1 Validasyon

- [ ] **VALIDATION-01:** CIF < 0
  - Test: Calculator → FOB: -100 → Hata "FOB 0'dan büyük olmalıdır"

- [ ] **VALIDATION-02:** Motor Hacmi < 0
  - Test: Araç oluştur → Motor: -1000 → Hata "Motor Hacmi 0'dan büyük olmalıdır"

- [ ] **VALIDATION-03:** Vergi Oranı < 0 veya > 100
  - Test: MASTER_ADMIN → Yeni oranı -5 → Hata "Oran 0-100 arasında olmalıdır"

- [ ] **VALIDATION-04:** E-posta formatı geçersiz
  - Test: Müşteri ekle → E-posta: "invalid" → Hata "Geçerli e-posta girin"

- [ ] **VALIDATION-05:** Telefon formatı geçersiz
  - Test: Müşteri ekle → Telefon: "abc" → Hata "Geçerli telefon girin"

#### 3.4.2 Hata Kurtarma

- [ ] **RECOVERY-01:** API timeout → Kullanıcı uyarısı
  - Test: Yavaş ağ + Yeni araç kaydet → 30 saniye sonra timeout
  - Beklenen: Hata "İşlem zaman aşımına uğradı" + Retry butonu

- [ ] **RECOVERY-02:** Veritabanı hatası → Graceful error
  - Test: Veritabanı kapalı + Araç listesi sor
  - Beklenen: Hata "Veri kaynağına bağlanılamıyor" (user-friendly)

- [ ] **RECOVERY-03:** Cloudinary upload hatası → Uyarı
  - Test: Dosya yükle (Cloudinary key hatalı) → Hata "Dosya yükleme başarısız"

#### 3.4.3 Güvenlik Hataları

- [ ] **SECURITY-01:** CSRF token eksik → 403
  - Test: Formdan CSRF token'ı sil → POST gönder → 403

- [ ] **SECURITY-02:** XSS testi: <script> tag'i giriş
  - Test: Araç marka: `<script>alert(1)</script>` → Kaydet → Script çalışmaz

- [ ] **SECURITY-03:** SQL injection: ' OR '1'='1
  - Test: Araç marka: `' OR '1'='1` → Kaydet → Hata (escaped)

- [ ] **SECURITY-04:** JWT token tampering
  - Test: Token payload'ını manuel değiştir → API çağrısı → 401

---

## 4. TEST ÇALIŞMA LİSTESİ

### Günlük Test Planı (1. Gün)

**Bölüm:** Giriş & Kimlik Doğrulama + Navigasyon (Tüm 7 kullanıcı)

- MA-AUTH-01 → MA-AUTH-06
- GO-AUTH-01 → GO-AUTH-03
- GM-AUTH-01 → GM-AUTH-02
- SALES-AUTH-01 → SALES-AUTH-02
- ACC-AUTH-01
- STAFF-AUTH-01
- GO2-AUTH-01 → GO2-AUTH-02

**Tahmini Zaman:** 2-3 saat

---

### Haftalık Test Planı

**Gün 1:** Giriş, Auth, Navigasyon (Tüm roller)
**Gün 2:** MASTER_ADMIN CRUD (Vergi, Döviz, Ülke, Galeri)
**Gün 3:** GALLERY_OWNER CRUD (Araçlar, Ürünler, Müşteriler, Satışlar)
**Gün 4:** İthalat Hesaplama (GALLERY_OWNER + SALES)
**Gün 5:** Diğer Roller (MANAGER, SALES, ACCOUNTANT, STAFF) Navigasyon + Kısıtlamalar
**Gün 6:** Çok-Kiracı İzolasyonu (Demo vs. Premium)
**Gün 7:** Edge Case'ler, Hata Yönetimi, Eş Zamanlı Erişim

**Toplam Tahmini Zaman:** 35-40 saat

---

## 5. NOTLAR & İPUÇLARI

### Hızlı Test Kontrol Listesi

- [ ] Tüm login'ler çalışıyor
- [ ] Tüm nav'lar açılıyor
- [ ] CRUD'lar tam çalışıyor
- [ ] İthalat hesaplama doğru
- [ ] Çok-kiracı izolasyonu kesin
- [ ] Hata mesajları temiz
- [ ] Token süresi yönetilmiş

### Sorun Bulursan

1. **Detay Kayıt Yap:** "Kullanıcı: GO", "Senaryo: GO-VEH-02", "Hata: Araç detayında CIF yok", "Tekrar Adımlar: 1) Login, 2) Vehicles, 3) Araç seç"
2. **Screenshot Çek:** Hata mesajı / expected vs. actual
3. **Veritabanı Kontrol:** Verinin gerçekten DB'ye kaydedilip kaydedilmediğini kontrol et
4. **Token Kontrol:** DevTools → Application → localStorage → token var mı?
5. **Browser Console:** Network tab'ında API request'leri kontrol et

### İspanya Ülkesi Düşmesi İçin Vergi Oranı Kullan

| Ülke | Gümrük % | FIF % | Kod |
|------|---------|-------|-----|
| Japonya | 10 | 18 | JP |
| Almanya | 0 | 20 | DE |
| İngiltere | 10 | 18 | GB |
| İspanya | 0 | 18 | ES |
| Amerika | 15 | 25 | US |
| Katar | 5 | 15 | QA |

### Motor Hacmi Oranları

| Hacim | FIF % |
|-------|-------|
| 0-1000cc | 15 |
| 1001-1600cc | 18 |
| 1601-2000cc | 22 |
| 2001-2500cc | 25 |
| 2500+cc | 30 |

---

**Son Güncelleme:** 2026-03-01
**Hazırlanmış:** QA Test Ekibi
**Revizyonlar:** Tüm checkpoint'ler beraber test edilir
