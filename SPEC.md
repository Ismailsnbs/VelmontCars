# KKTC Araç Galerisi Yönetim Sistemi
## Proje Prompt Dosyası v2.0

**Proje Sahibi:** [İsim]  
**Oluşturulma Tarihi:** 28 Şubat 2026  
**Son Güncelleme:** 28 Şubat 2026  

---

## 📋 İÇİNDEKİLER

1. [Proje Tanımı](#-proje-tanımı)
2. [Sistem Mimarisi](#-sistem-mimarisi)
3. [Master Panel Modülleri](#-master-panel-modülleri)
4. [Galeri Panel Modülleri](#-galeri-panel-modülleri)
5. [KKTC Araç İthalat Vergi Yapısı](#-kktc-araç-i̇thalat-vergi-yapısı)
6. [Veritabanı Şeması](#-veritabanı-şeması)
7. [Teknoloji Stack](#-teknoloji-stacki)
8. [Proje Yapısı](#-proje-yapısı)
9. [Geliştirme Yol Haritası](#-geliştirme-yol-haritası)
10. [API Endpoint Listesi](#-api-endpoint-listesi)
11. [Ekranlar ve UI/UX](#-ekranlar-ve-uiux)
12. [Notlar ve Gereksinimler](#-notlar-ve-gereksinimler)

---

## 🎯 PROJE TANIMI

### Amaç
KKTC'deki araç galerileri için kapsamlı bir yönetim paneli geliştirmek. Bu sistem galeri sahiplerinin:
- Araç stoklarını (yolda gelen + mevcut)
- Ürün stoklarını (oto yıkama malzemeleri)
- Araç ithalat maliyetlerini otomatik hesaplama
- Evrak yönetimi
- Satışlarını ve kar/zarar analizlerini
- Tüm işletme operasyonlarını

tek bir panel üzerinden yönetmelerini sağlayacak.

### Hedef Kitle
- KKTC'deki araç galerileri
- Galeri sahipleri ve çalışanları
- Muhasebe personeli

### Temel Özellikler
- Multi-tenant mimari (çoklu galeri desteği)
- Master panel ile merkezi yönetim
- Dinamik vergi ve döviz kuru yönetimi
- Real-time senkronizasyon
- Responsive tasarım (mobil uyumlu)

---

## 🏗️ SİSTEM MİMARİSİ

### Genel Yapı

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MASTER PANEL (Super Admin)                       │
│                    Sistem Yöneticisi / Platform Sahibi                   │
├─────────────────────────────────────────────────────────────────────────┤
│  • Tüm vergi oranlarını yönetir                                         │
│  • Döviz kurlarını günceller (manuel veya API)                          │
│  • Menşe ülke ayarlarını yönetir                                        │
│  • Tüm galerileri görüntüler ve yönetir                                 │
│  • Platform geneli istatistikler                                        │
│  • Değişiklik bildirimleri gönderir                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Real-time Sync (WebSocket)
                                    ▼
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   GALERİ A    │           │   GALERİ B    │           │   GALERİ C    │
│    PANELİ     │           │    PANELİ     │           │    PANELİ     │
├───────────────┤           ├───────────────┤           ├───────────────┤
│ Kendi araçları│           │ Kendi araçları│           │ Kendi araçları│
│ Kendi stoku   │           │ Kendi stoku   │           │ Kendi stoku   │
│ Kendi müşteri │           │ Kendi müşteri │           │ Kendi müşteri │
│ Güncel vergiler│          │ Güncel vergiler│          │ Güncel vergiler│
│ (Master'dan)  │           │ (Master'dan)  │           │ (Master'dan)  │
└───────────────┘           └───────────────┘           └───────────────┘
```

### Teknik Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │  Tailwind   │  │  Zustand / React    │  │
│  │   (SSR/SSG) │  │     CSS     │  │      Query          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Express   │  │   Prisma    │  │    JWT Auth         │  │
│  │   veya      │  │    ORM      │  │    + Refresh        │  │
│  │   Fastify   │  │             │  │      Tokens         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │  Socket.io  │  │  Node-cron  │                           │
│  │ (Real-time) │  │  (Scheduled)│                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL  │  │    Redis    │  │   Cloudinary /      │  │
│  │  (Ana DB)   │  │  (Cache)    │  │   AWS S3 (Dosyalar) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 MASTER PANEL MODÜLLERİ

### M1: Vergi & Harç Yönetimi

**Amaç:** KKTC'deki tüm vergi oranlarını merkezi olarak yönetmek ve galerilere anında yansıtmak.

**Özellikler:**
- KDV oranları yönetimi (binek: %20, ticari: %16)
- Gümrük vergileri (menşe ülkeye göre: %0-10)
- Fiyat İstikrar Fonu (FIF) oranları (motor hacmine göre kademeli)
- Güvenlik Kuvvetleri Katkısı (GKK): %2.5
- Rıhtım Harcı: %4.4
- Genel FIF: Motor hacmi × katsayı (örn: 2.03 TL/cc)
- Bandrol: Sabit tutar
- Yürürlük tarihi belirleme
- Değişiklik geçmişi

**Veri Yapısı:**
```
TaxRate {
  id, code, name, rate, rateType, vehicleType,
  minEngineCC, maxEngineCC, effectiveFrom, effectiveTo,
  isActive, createdBy, history[]
}
```

### M2: Döviz Kuru Yönetimi

**Amaç:** Döviz kurlarını manuel veya otomatik olarak güncellemek.

**Özellikler:**
- Desteklenen para birimleri: USD, EUR, GBP, JPY, TL
- Güncelleme modları:
  - Manuel güncelleme
  - Otomatik API (TCMB, exchangerate-api.com)
- Güncelleme aralığı ayarı (dakika cinsinden)
- Kur geçmişi ve trend grafiği
- Alış/satış kuru ayrımı

**Veri Yapısı:**
```
ExchangeRate {
  id, currencyCode, currencyName, buyRate, sellRate,
  source, fetchedAt, isActive
}

ExchangeRateSettings {
  id, updateMode, apiProvider, apiKey, updateInterval,
  lastAutoUpdate
}
```

### M3: Menşe Ülke Yönetimi

**Amaç:** Araçların geldiği ülkelere göre gümrük ve nakliye ayarlarını yönetmek.

**Özellikler:**
- Ülke listesi (Japonya, İngiltere, Almanya, Türkiye, vb.)
- Gümrük vergisi oranları (ülkeye göre)
- AB üyelik durumu (AB ülkelerinden %0 gümrük)
- Tahmini nakliye ücretleri (min-max USD)
- Ortalama teslim süreleri (gün)

**Varsayılan Ülke Ayarları:**
| Ülke | Kod | Gümrük % | Nakliye (USD) | AB |
|------|-----|----------|---------------|-----|
| Japonya | JP | 10 | 550-650 | Hayır |
| İngiltere | GB | 10 | 400-500 | Hayır |
| Almanya | DE | 0 | 350-450 | Evet |
| Türkiye | TR | 0 | 200-300 | Hayır |
| Güney Kore | KR | 10 | 600-700 | Hayır |
| ABD | US | 10 | 800-1000 | Hayır |

### M4: Galeri Yönetimi

**Amaç:** Platform üzerindeki tüm galerileri yönetmek.

**Özellikler:**
- Galeri ekleme/düzenleme/silme
- Galeri bilgileri (ad, adres, telefon, logo)
- Abonelik yönetimi (Basic, Professional, Enterprise)
- Kullanıcı limitleri
- Galeri istatistikleri (araç sayısı, satış, kullanıcı)
- Aktif/Pasif durumu

### M5: Bildirim & Duyuru Sistemi

**Amaç:** Galerilere önemli değişiklikleri anında bildirmek.

**Bildirim Türleri:**
- TAX_CHANGE: Vergi değişikliği
- CURRENCY_ALERT: Döviz kuru uyarısı
- GENERAL_ANNOUNCEMENT: Genel duyuru
- SYSTEM_MAINTENANCE: Sistem bakımı

**Özellikler:**
- Öncelik seviyeleri (düşük, normal, yüksek, acil)
- Hedef seçimi (tüm galeriler, sadece adminler, belirli galeriler)
- Okunma takibi
- Zamanlanmış bildirimler

### M6: Audit Log (Değişiklik Geçmişi)

**Amaç:** Tüm sistem değişikliklerini kayıt altına almak.

**Kaydedilen Bilgiler:**
- Yapılan işlem (CREATE, UPDATE, DELETE)
- Etkilenen varlık (TaxRate, ExchangeRate, vb.)
- Eski ve yeni değerler
- İşlemi yapan kullanıcı
- Tarih/saat
- IP adresi

---

## 🏪 GALERİ PANEL MODÜLLERİ

### G1: Araç Stok Yönetimi

#### G1.1: Yolda Gelen Araçlar (Transit Listesi)
- Henüz galeriye ulaşmamış araçların listesi
- Tahmini varış tarihi
- Lojistik/kargo durumu takibi
- Araç ön bilgileri (marka, model, yıl)
- Menşe ülke bilgisi
- Tahmini maliyet hesabı (önizleme)
- Transit'ten stoğa geçiş işlemi

#### G1.2: Galeride Mevcut Araçlar (Stok Listesi)
- Galeride fiziksel olarak bulunan araçlar
- Görünüm modları: Grid (kart) / Liste
- Filtreleme: marka, model, yıl, fiyat aralığı, durum, menşe ülke
- Arama: plaka, VIN, marka, model
- Sıralama: fiyat, tarih, marka, kar marjı, stokta kalma süresi
- Toplu işlemler (çoklu seçim)

#### G1.3: Araç Kartı Detayları

**Temel Bilgiler:**
- Marka, Model, Yıl
- VIN / Şasi numarası
- Renk
- Kilometre
- Yakıt tipi (Benzin, Dizel, Elektrik, Hibrit, LPG)
- Vites tipi (Manuel, Otomatik, Yarı otomatik)
- Motor hacmi (cc) - maliyet hesabı için kritik
- Kasa tipi (Sedan, Hatchback, SUV, Pickup, vb.)

**Finansal Bilgiler:**
- Menşe ülke
- FOB fiyatı (alış fiyatı)
- Otomatik hesaplanan toplam maliyet
- Ek giderler
- Satış fiyatı
- Kar/Zarar gösterimi (renk kodlu)
- Kar marjı (%)

**Durum Bilgileri:**
- Status: transit, stokta, rezerve, satıldı
- Tahmini varış tarihi (transit için)
- Stokta kalma süresi
- Araç açıklaması / notlar

**Medya:**
- Çoklu fotoğraf yükleme
- Ana görsel seçimi
- Fotoğraf sıralama

#### G1.4: Araç Evrak Yönetimi

**Desteklenen Evrak Türleri:**
- Ruhsat
- Alış faturası
- Gümrük beyannamesi
- Muayene belgesi
- Sigorta poliçesi
- Nakliye belgeleri
- Diğer belgeler

**Özellikler:**
- PDF ve görsel dosya desteği (jpg, png, pdf)
- Dosya boyutu limiti: 10MB
- Evrak görüntüleme (lightbox)
- Evrak indirme
- Evrak silme

---

### G2: Araç İthalat Maliyet Hesaplama

**Amaç:** KKTC'ye araç ithal ederken oluşacak tüm maliyetleri otomatik hesaplamak.

#### G2.1: Maliyet Hesaplama Motoru

**Giriş Verileri:**
- FOB fiyatı (alış fiyatı)
- Para birimi (USD, EUR, GBP)
- Menşe ülke seçimi
- Motor hacmi (cc)
- Araç tipi (binek/ticari)
- Model yılı
- Nakliye ücreti (manuel veya tahmini)
- Sigorta ücreti

**Otomatik Hesaplanan Değerler:**
- CIF değeri = FOB + Nakliye + Sigorta
- Gümrük vergisi (menşe ülkeye göre)
- KDV (araç tipine göre)
- Fiyat İstikrar Fonu (FIF)
- Genel FIF (motor hacmi × katsayı)
- Güvenlik Kuvvetleri Katkısı (GKK)
- Rıhtım harcı
- Bandrol
- Diğer harçlar

**Çıktılar:**
- Toplam vergiler
- Toplam maliyet (USD ve TL)
- Vergi detay dökümü
- Önerilen minimum satış fiyatı (hedef kar marjına göre)

#### G2.2: Hesaplama Sonuç Ekranı

```
┌─────────────────────────────────────────────────────────────┐
│  📊 MALİYET HESAPLAMA SONUCU                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Araç: Toyota Corolla 2022 | 1600cc | Japonya               │
│                                                              │
│  ┌─ GİRİŞ DEĞERLERİ ─────────────────────────────────────┐  │
│  │  FOB Fiyatı:           $6,000                          │  │
│  │  Nakliye:              $600                            │  │
│  │  Sigorta:              $100                            │  │
│  │  CIF Değeri:           $6,700                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ VERGİ DÖKÜMÜ ────────────────────────────────────────┐  │
│  │  Gümrük Vergisi (%10):           $670                  │  │
│  │  KDV (%20):                      $1,715                │  │
│  │  Fiyat İstikrar Fonu (%18):      $1,206                │  │
│  │  Güvenlik Kuvvetleri (%2.5):     $168                  │  │
│  │  Rıhtım (%4.4):                  $295                  │  │
│  │  Genel FIF (1600cc × 2.03):      $100                  │  │
│  │  Bandrol:                        $10                   │  │
│  │  ─────────────────────────────────────────────────     │  │
│  │  TOPLAM VERGİLER:                $4,164                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ SONUÇ ───────────────────────────────────────────────┐  │
│  │  📦 TOPLAM MALİYET:              $10,864               │  │
│  │  💵 TL Karşılığı:                ₺388,931              │  │
│  │  ─────────────────────────────────────────────────     │  │
│  │  💡 Önerilen Satış (%15 kar):    $12,494               │  │
│  │  💡 Önerilen Satış (%20 kar):    $13,037               │  │
│  │  💡 Önerilen Satış (%25 kar):    $13,580               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [📄 PDF İndir] [💾 Araca Kaydet] [🔄 Yeni Hesaplama]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### G2.3: Snapshot Mekanizması

Her hesaplama yapıldığında, o anki vergi oranları ve döviz kurları kaydedilir. Bu sayede:
- Geçmiş hesaplamalar korunur
- Vergi değişikliklerinden etkilenmez
- Karşılaştırma yapılabilir

---

### G3: Ürün Stok Yönetimi (Oto Yıkama & Sarf Malzemeleri)

#### G3.1: Ürün Tanımlama

**Ürün Bilgileri:**
- Ürün adı
- Kategori
- Birim (Adet, Litre, Kg, Kutu, Paket)
- Alış fiyatı (birim)
- Minimum stok seviyesi
- Barkod (opsiyonel)
- Açıklama

**Kategoriler:**
- Temizlik ürünleri (şampuan, cila, vb.)
- Spreyler
- Bezler / Havlular
- Fırçalar
- Kimyasallar
- Diğer sarf malzemeleri

#### G3.2: Stok Takibi

**Stok Hareketleri:**
- Giriş (alım): Tedarikçiden alınan ürünler
- Çıkış (kullanım): Kullanılan ürünler
- Düzeltme (sayım farkı): Sayım sonrası düzeltmeler

**Her hareket için:**
- Hareket tipi
- Miktar
- Tarih
- Not
- İşlemi yapan kullanıcı

#### G3.3: Stok Sayımı

**Özellikler:**
- Periyodik sayım başlatma
- Ürün bazlı sayım girişi
- Otomatik fark hesaplama
- Düzeltme kayıtları oluşturma
- Sayım raporu

#### G3.4: Stok Uyarıları

- Minimum stok seviyesi altına düşen ürünler
- Dashboard'da uyarı kartı
- E-posta/SMS bildirimi (opsiyonel)

---

### G4: Maliyet & Finansal Yönetim

#### G4.1: Araç Maliyetleri

**Maliyet Kalemleri:**
- Otomatik hesaplanan ithalat maliyeti
- Ek giderler:
  - Tamir / Bakım
  - Boya / Kaporta
  - Parça değişimi
  - Ek sigorta
  - Reklam / İlan
  - Diğer giderler

**Formül:**
```
Toplam Maliyet = İthalat Maliyeti + Ek Giderler
```

#### G4.2: Satış & Kar Hesaplama

**Hesaplamalar:**
```
Net Kar = Satış Fiyatı - Toplam Maliyet
Kar Marjı (%) = (Net Kar / Satış Fiyatı) × 100
```

**Görselleştirme:**
- Yeşil: Kar (pozitif)
- Kırmızı: Zarar (negatif)
- Sarı: Düşük kar marjı (%5 altı)

#### G4.3: Ürün Maliyetleri

- Toplam ürün alım harcaması
- Aylık tüketim maliyeti
- Kategori bazlı harcama dağılımı (pasta grafik)

#### G4.4: Finansal Özet

- Toplam yatırım (araçlar + ürünler)
- Toplam satış geliri
- Toplam kar
- Dönemsel karşılaştırma (bu ay / geçen ay / bu yıl)
- Trend grafikleri

---

### G5: Dashboard & Raporlama

#### G5.1: Ana Dashboard Kartları

| Kart | Açıklama |
|------|----------|
| Toplam Araç (Stokta) | Galerideki araç sayısı |
| Yolda Gelen Araç | Transit durumdaki araç sayısı |
| Bu Ay Satılan | Ay içinde satılan araç sayısı |
| Toplam Kar (Bu Ay) | Aylık toplam kar |
| Düşük Stoklu Ürünler | Uyarı gerektiren ürün sayısı |
| Yaklaşan Teslimler | 7 gün içinde gelecek araçlar |

#### G5.2: Grafikler

- Aylık satış grafiği (bar chart)
- Kar trendi (line chart)
- Marka dağılımı (pie chart)
- Menşe ülke dağılımı (pie chart)
- Stok durumu özeti (bar chart)

#### G5.3: Raporlar

| Rapor | Açıklama |
|-------|----------|
| Stok Yaşlandırma | Kaç gündür stokta |
| En Karlı Araçlar | Kar sıralaması |
| Ortalama Satış Süresi | Model/marka bazında |
| Menşe Ülke Analizi | Ülkeye göre kar analizi |
| Ürün Tüketim | Aylık ürün kullanımı |
| Finansal Özet | Aylık/yıllık finansal |

**Export Formatları:**
- Excel (.xlsx)
- PDF

---

### G6: Müşteri Yönetimi

#### G6.1: Müşteri Kartı

**Bilgiler:**
- Ad Soyad
- Telefon numarası
- E-posta
- Kimlik numarası
- Adres
- Notlar

#### G6.2: Müşteri Geçmişi

- Satın aldığı araçlar
- Ödeme bilgileri
- İletişim geçmişi

---

### G7: Kullanıcı & Yetki Yönetimi

#### G7.1: Kullanıcı Rolleri

| Rol | Kod | Açıklama | Yetkiler |
|-----|-----|----------|----------|
| Master Admin | MASTER_ADMIN | Platform yöneticisi | Tüm sistem |
| Galeri Sahibi | GALLERY_OWNER | Galeri sahibi | Kendi galerisi (tüm modüller) |
| Galeri Müdürü | GALLERY_MANAGER | Galeri müdürü | Kendi galerisi (tüm modüller) |
| Satış Danışmanı | SALES | Satış personeli | Araç, müşteri, satış |
| Muhasebe | ACCOUNTANT | Muhasebe personeli | Finansal veriler, raporlar |
| Personel | STAFF | Genel personel | Sınırlı görüntüleme |

#### G7.2: Yetki Matrisi

| Modül | Owner | Manager | Sales | Accountant | Staff |
|-------|-------|---------|-------|------------|-------|
| Araç Yönetimi | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Maliyet Hesaplama | ✅ | ✅ | ✅ | 👁️ | ❌ |
| Ürün Stok | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Finansal | ✅ | ✅ | ❌ | ✅ | ❌ |
| Müşteriler | ✅ | ✅ | ✅ | 👁️ | ❌ |
| Raporlar | ✅ | ✅ | 👁️ | ✅ | ❌ |
| Kullanıcılar | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ayarlar | ✅ | ✅ | ❌ | ❌ | ❌ |

✅ = Tam yetki | 👁️ = Sadece görüntüleme | ❌ = Erişim yok

---

## 💰 KKTC ARAÇ İTHALAT VERGİ YAPISI

### Vergi Oranları Tablosu

| Vergi/Harç | Oran/Tutar | Hesaplama Bazı | Açıklama |
|------------|------------|----------------|----------|
| Gümrük Vergisi | %0 - %10 | CIF | AB: %0, Diğer: %10 |
| KDV (Binek) | %20 | CIF + Gümrük + FIF | Salon tipi araçlar |
| KDV (Ticari) | %16 | CIF + Gümrük + FIF | Ticari araçlar |
| Fiyat İstikrar Fonu | %15 - %30 | CIF | Motor hacmine göre |
| Genel FIF | cc × 2.03 TL | Motor hacmi | Sabit katsayı |
| GKK | %2.5 | CIF | Güvenlik Kuvvetleri |
| Rıhtım Harcı | %4.4 | CIF | Liman harcı |
| Bandrol | ~33.5 TL | Sabit | Sabit ücret |

### FIF Oranları (Motor Hacmine Göre)

| Motor Hacmi | FIF Oranı |
|-------------|-----------|
| 0 - 1000 cc | %15 |
| 1001 - 1600 cc | %18 |
| 1601 - 2000 cc | %22 |
| 2001 - 2500 cc | %25 |
| 2500+ cc | %30 |

### Örnek Hesaplama

```
Araç: Toyota Corolla 2022, 1600cc, Japonya'dan

FOB Fiyatı:                 $6,000
Nakliye:                    $600
Sigorta:                    $100
────────────────────────────────────
CIF Değeri:                 $6,700

Gümrük (%10):               $670
FIF (%18):                  $1,206
KDV (%20):                  $1,715 (CIF+Gümrük+FIF üzerinden)
GKK (%2.5):                 $168
Rıhtım (%4.4):              $295
Genel FIF (1600×2.03):      $100
Bandrol:                    $10
────────────────────────────────────
Toplam Vergiler:            $4,164
════════════════════════════════════
TOPLAM MALİYET:             $10,864

Önerilen Satış (%20 kar):   $13,580
```

**Not:** Toplam vergi yükü araç değerinin yaklaşık %60-70'i kadardır.

---

## 📊 VERİTABANI ŞEMASI

### Prisma Schema

```prisma
// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

enum UserRole {
  MASTER_ADMIN
  GALLERY_OWNER
  GALLERY_MANAGER
  SALES
  ACCOUNTANT
  STAFF
}

enum RateType {
  PERCENTAGE
  FIXED
  PER_CC
}

enum VehicleCategory {
  PASSENGER
  COMMERCIAL
  ALL
}

enum VehicleStatus {
  TRANSIT
  IN_STOCK
  RESERVED
  SOLD
}

enum FuelType {
  PETROL
  DIESEL
  ELECTRIC
  HYBRID
  LPG
}

enum Transmission {
  MANUAL
  AUTOMATIC
  SEMI_AUTO
}

enum DocumentType {
  REGISTRATION
  INVOICE
  CUSTOMS
  INSPECTION
  INSURANCE
  SHIPPING
  OTHER
}

enum ExpenseType {
  REPAIR
  PAINT
  PARTS
  INSURANCE
  ADVERTISING
  OTHER
}

enum MovementType {
  IN
  OUT
  ADJUSTMENT
}

enum ProductCategory {
  CLEANING
  SPRAY
  CLOTH
  BRUSH
  CHEMICAL
  OTHER
}

enum NotificationType {
  TAX_CHANGE
  CURRENCY_ALERT
  GENERAL_ANNOUNCEMENT
  SYSTEM_MAINTENANCE
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum SubscriptionType {
  BASIC
  PROFESSIONAL
  ENTERPRISE
}

// ═══════════════════════════════════════════════════════════
// MASTER PANEL TABLES
// ═══════════════════════════════════════════════════════════

model TaxRate {
  id              String           @id @default(cuid())
  code            String           @unique
  name            String
  nameEn          String?
  rate            Decimal
  rateType        RateType
  vehicleType     VehicleCategory?
  minEngineCC     Int?
  maxEngineCC     Int?
  description     String?
  isActive        Boolean          @default(true)
  effectiveFrom   DateTime         @default(now())
  effectiveTo     DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  createdBy       String
  history         TaxRateHistory[]
}

model TaxRateHistory {
  id          String   @id @default(cuid())
  taxRateId   String
  taxRate     TaxRate  @relation(fields: [taxRateId], references: [id])
  oldValue    Decimal
  newValue    Decimal
  changedBy   String
  changedAt   DateTime @default(now())
  reason      String?
}

model OriginCountry {
  id                String    @id @default(cuid())
  code              String    @unique
  name              String
  flag              String?
  customsDutyRate   Decimal
  isEU              Boolean   @default(false)
  minShippingCost   Decimal
  maxShippingCost   Decimal
  avgShippingDays   Int?
  notes             String?
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  vehicles          Vehicle[]
}

model ExchangeRate {
  id            String   @id @default(cuid())
  currencyCode  String
  currencyName  String
  buyRate       Decimal
  sellRate      Decimal
  source        String
  fetchedAt     DateTime @default(now())
  isActive      Boolean  @default(true)
}

model ExchangeRateSettings {
  id              String    @id @default(cuid())
  updateMode      String
  apiProvider     String?
  apiKey          String?
  updateInterval  Int       @default(60)
  lastAutoUpdate  DateTime?
  updatedAt       DateTime  @updatedAt
}

model PlatformNotification {
  id          String               @id @default(cuid())
  type        NotificationType
  title       String
  message     String
  priority    NotificationPriority @default(NORMAL)
  targetType  String
  targetIds   String[]
  sentBy      String
  sentAt      DateTime             @default(now())
  reads       NotificationRead[]
}

model NotificationRead {
  id             String               @id @default(cuid())
  notificationId String
  notification   PlatformNotification @relation(fields: [notificationId], references: [id])
  galleryId      String
  gallery        Gallery              @relation(fields: [galleryId], references: [id])
  readAt         DateTime             @default(now())
  readBy         String
}

model AuditLog {
  id          String   @id @default(cuid())
  action      String
  entityType  String
  entityId    String
  oldValues   Json?
  newValues   Json?
  performedBy String
  performedAt DateTime @default(now())
  ipAddress   String?
  userAgent   String?
}

// ═══════════════════════════════════════════════════════════
// GALLERY TABLES
// ═══════════════════════════════════════════════════════════

model Gallery {
  id                String              @id @default(cuid())
  name              String
  slug              String              @unique
  address           String?
  city              String?
  phone             String?
  email             String?
  logo              String?
  isActive          Boolean             @default(true)
  subscription      SubscriptionType    @default(BASIC)
  subscriptionEnds  DateTime?
  users             User[]
  vehicles          Vehicle[]
  products          Product[]
  customers         Customer[]
  notifications     NotificationRead[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}

model User {
  id          String    @id @default(cuid())
  email       String    @unique
  password    String
  name        String
  role        UserRole
  galleryId   String?
  gallery     Gallery?  @relation(fields: [galleryId], references: [id])
  isActive    Boolean   @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model TaxSnapshot {
  id           String              @id @default(cuid())
  rates        Json
  currencies   Json
  createdAt    DateTime            @default(now())
  vehicles     Vehicle[]
  calculations ImportCalculation[]
}

model Vehicle {
  id                 String              @id @default(cuid())
  brand              String
  model              String
  year               Int
  vin                String?             @unique
  color              String?
  mileage            Int?
  fuelType           FuelType?
  transmission       Transmission?
  engineCC           Int
  bodyType           String?
  
  originCountryId    String
  originCountry      OriginCountry       @relation(fields: [originCountryId], references: [id])
  fobPrice           Decimal
  fobCurrency        String              @default("USD")
  
  shippingCost       Decimal?
  insuranceCost      Decimal?
  cifValue           Decimal?
  customsDuty        Decimal?
  kdv                Decimal?
  fif                Decimal?
  generalFif         Decimal?
  gkk                Decimal?
  wharfFee           Decimal?
  bandrol            Decimal?
  otherFees          Decimal?
  totalImportCost    Decimal?
  
  additionalExpenses Decimal             @default(0)
  totalCost          Decimal?
  salePrice          Decimal?
  profit             Decimal?
  profitMargin       Decimal?
  
  status             VehicleStatus       @default(TRANSIT)
  estimatedArrival   DateTime?
  arrivalDate        DateTime?
  soldDate           DateTime?
  description        String?
  
  galleryId          String
  gallery            Gallery             @relation(fields: [galleryId], references: [id])
  images             VehicleImage[]
  documents          VehicleDocument[]
  expenses           VehicleExpense[]
  calculations       ImportCalculation[]
  sale               Sale?
  
  taxSnapshotId      String?
  taxSnapshot        TaxSnapshot?        @relation(fields: [taxSnapshotId], references: [id])
  
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
}

model VehicleImage {
  id        String  @id @default(cuid())
  url       String
  isMain    Boolean @default(false)
  order     Int     @default(0)
  vehicleId String
  vehicle   Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
}

model VehicleDocument {
  id         String       @id @default(cuid())
  type       DocumentType
  fileName   String
  fileUrl    String
  fileSize   Int?
  vehicleId  String
  vehicle    Vehicle      @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  uploadedAt DateTime     @default(now())
  uploadedBy String?
}

model VehicleExpense {
  id          String      @id @default(cuid())
  type        ExpenseType
  amount      Decimal
  description String?
  date        DateTime    @default(now())
  vehicleId   String
  vehicle     Vehicle     @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  createdBy   String?
}

model ImportCalculation {
  id              String      @id @default(cuid())
  vehicleId       String?
  vehicle         Vehicle?    @relation(fields: [vehicleId], references: [id])
  
  fobPrice        Decimal
  fobCurrency     String
  originCountry   String
  engineCC        Int
  vehicleType     String
  modelYear       Int
  
  exchangeRate    Decimal
  shippingCost    Decimal
  insuranceCost   Decimal
  cifValue        Decimal
  customsDuty     Decimal
  kdv             Decimal
  fif             Decimal
  generalFif      Decimal
  gkk             Decimal
  wharfFee        Decimal
  bandrol         Decimal
  otherFees       Decimal
  
  totalTaxes      Decimal
  totalCostUSD    Decimal
  totalCostTL     Decimal
  
  taxSnapshotId   String
  taxSnapshot     TaxSnapshot @relation(fields: [taxSnapshotId], references: [id])
  
  calculatedAt    DateTime    @default(now())
  calculatedBy    String
}

model Product {
  id             String          @id @default(cuid())
  name           String
  category       ProductCategory
  unit           String
  currentStock   Decimal         @default(0)
  minStockLevel  Decimal         @default(0)
  unitPrice      Decimal
  barcode        String?
  description    String?
  galleryId      String
  gallery        Gallery         @relation(fields: [galleryId], references: [id])
  movements      StockMovement[]
  lastPurchaseAt DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model StockMovement {
  id        String       @id @default(cuid())
  type      MovementType
  quantity  Decimal
  note      String?
  productId String
  product   Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdBy String?
  createdAt DateTime     @default(now())
}

model Customer {
  id         String   @id @default(cuid())
  name       String
  phone      String?
  email      String?
  identityNo String?
  address    String?
  notes      String?
  galleryId  String
  gallery    Gallery  @relation(fields: [galleryId], references: [id])
  sales      Sale[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Sale {
  id           String   @id @default(cuid())
  vehicleId    String   @unique
  vehicle      Vehicle  @relation(fields: [vehicleId], references: [id])
  customerId   String
  customer     Customer @relation(fields: [customerId], references: [id])
  salePrice    Decimal
  totalCost    Decimal
  profit       Decimal
  profitMargin Decimal
  saleDate     DateTime @default(now())
  paymentType  String?
  notes        String?
  createdBy    String
}
```

---

## 🛠️ TEKNOLOJİ STACK'İ

### Frontend

| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| Next.js | 14+ | React framework (App Router) |
| TypeScript | 5+ | Tip güvenliği |
| Tailwind CSS | 3+ | Styling |
| shadcn/ui | Latest | UI bileşenleri |
| React Query | 5+ | Server state yönetimi |
| Zustand | 4+ | Client state yönetimi |
| React Hook Form | 7+ | Form yönetimi |
| Zod | 3+ | Validasyon |
| Recharts | 2+ | Grafikler |
| Lucide Icons | Latest | İkonlar |

### Backend

| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| Node.js | 20+ | Runtime |
| Express.js | 4+ | Web framework |
| TypeScript | 5+ | Tip güvenliği |
| Prisma | 5+ | ORM |
| PostgreSQL | 15+ | Veritabanı |
| Redis | 7+ | Cache & Session |
| Socket.io | 4+ | Real-time iletişim |
| JWT | - | Authentication |
| Multer | 1+ | Dosya yükleme |
| Node-cron | 3+ | Zamanlanmış görevler |

### DevOps & Araçlar

| Teknoloji | Amaç |
|-----------|------|
| Docker | Konteynerizasyon |
| Docker Compose | Lokal geliştirme |
| GitHub Actions | CI/CD |
| Railway / Render | Deployment |
| Cloudinary | Görsel depolama |
| Resend / Nodemailer | E-posta |

---

## 📁 PROJE YAPISI

```
kktc-galeri-yonetim/
│
├── apps/
│   │
│   ├── web/                          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/               # Authentication sayfaları
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (master)/             # Master Panel
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Master Dashboard
│   │   │   │   ├── tax-rates/
│   │   │   │   ├── exchange-rates/
│   │   │   │   ├── countries/
│   │   │   │   ├── galleries/
│   │   │   │   ├── notifications/
│   │   │   │   └── audit-logs/
│   │   │   │
│   │   │   ├── (dashboard)/          # Galeri Paneli
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Dashboard
│   │   │   │   ├── vehicles/
│   │   │   │   │   ├── page.tsx      # Araç listesi
│   │   │   │   │   ├── transit/      # Yolda gelenler
│   │   │   │   │   ├── [id]/         # Araç detay
│   │   │   │   │   └── new/          # Yeni araç
│   │   │   │   ├── calculator/       # Maliyet hesaplama
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── stock/
│   │   │   │   │   └── inventory/
│   │   │   │   ├── customers/
│   │   │   │   ├── sales/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn bileşenleri
│   │   │   ├── master/               # Master panel bileşenleri
│   │   │   ├── vehicles/
│   │   │   ├── products/
│   │   │   ├── calculator/
│   │   │   ├── dashboard/
│   │   │   ├── forms/
│   │   │   └── shared/
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useVehicles.ts
│   │   │   ├── useProducts.ts
│   │   │   ├── useTaxRates.ts
│   │   │   └── useSocket.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── utils.ts
│   │   │   ├── validations.ts
│   │   │   └── calculator.ts
│   │   │
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── uiStore.ts
│   │   │   └── notificationStore.ts
│   │   │
│   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Express Backend
│       ├── src/
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── vehicle.controller.ts
│       │   │   ├── product.controller.ts
│       │   │   ├── customer.controller.ts
│       │   │   ├── sale.controller.ts
│       │   │   ├── calculator.controller.ts
│       │   │   ├── taxRate.controller.ts
│       │   │   ├── exchangeRate.controller.ts
│       │   │   ├── country.controller.ts
│       │   │   ├── gallery.controller.ts
│       │   │   └── notification.controller.ts
│       │   │
│       │   ├── routes/
│       │   │   ├── index.ts
│       │   │   ├── auth.routes.ts
│       │   │   ├── vehicle.routes.ts
│       │   │   ├── product.routes.ts
│       │   │   ├── customer.routes.ts
│       │   │   ├── sale.routes.ts
│       │   │   ├── calculator.routes.ts
│       │   │   ├── master.routes.ts
│       │   │   └── notification.routes.ts
│       │   │
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── role.middleware.ts
│       │   │   ├── gallery.middleware.ts
│       │   │   ├── upload.middleware.ts
│       │   │   ├── validate.middleware.ts
│       │   │   └── error.middleware.ts
│       │   │
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── vehicle.service.ts
│       │   │   ├── calculator.service.ts
│       │   │   ├── taxRate.service.ts
│       │   │   ├── exchangeRate.service.ts
│       │   │   ├── notification.service.ts
│       │   │   ├── upload.service.ts
│       │   │   └── audit.service.ts
│       │   │
│       │   ├── utils/
│       │   │   ├── jwt.ts
│       │   │   ├── hash.ts
│       │   │   ├── currency.ts
│       │   │   └── helpers.ts
│       │   │
│       │   ├── validations/
│       │   │   ├── auth.validation.ts
│       │   │   ├── vehicle.validation.ts
│       │   │   └── taxRate.validation.ts
│       │   │
│       │   ├── socket/
│       │   │   └── index.ts
│       │   │
│       │   ├── jobs/
│       │   │   └── exchangeRate.job.ts
│       │   │
│       │   └── app.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts
│       │   └── migrations/
│       │
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Paylaşılan tipler ve utils
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           └── index.ts
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## 🚀 GELİŞTİRME YOL HARİTASI

### Faz 1: Temel Altyapı (Hafta 1-2)

- [ ] Proje yapısı kurulumu (monorepo)
- [ ] Backend: Express + TypeScript + Prisma setup
- [ ] Frontend: Next.js + TypeScript + Tailwind setup
- [ ] PostgreSQL veritabanı ve Prisma şeması
- [ ] Authentication sistemi (JWT)
- [ ] Temel layout ve navigation
- [ ] Role-based access control

### Faz 2: Master Panel (Hafta 3-4)

- [ ] Master admin dashboard
- [ ] Vergi oranları CRUD
- [ ] Menşe ülke CRUD
- [ ] Döviz kuru yönetimi
- [ ] Döviz API entegrasyonu
- [ ] Galeri yönetimi
- [ ] Bildirim sistemi
- [ ] Audit log

### Faz 3: Araç Modülü (Hafta 5-6)

- [ ] Araç CRUD API
- [ ] Araç listesi (grid/liste görünümü)
- [ ] Araç ekleme formu
- [ ] Araç detay sayfası
- [ ] Transit / Stokta filtreleme
- [ ] Görsel yükleme (Cloudinary)
- [ ] Evrak yükleme ve yönetimi

### Faz 4: Maliyet Hesaplama (Hafta 7-8)

- [ ] Maliyet hesaplama motoru
- [ ] Dinamik vergi çekme
- [ ] Hesaplama UI
- [ ] PDF rapor oluşturma
- [ ] Hesaplama kaydetme
- [ ] Snapshot mekanizması
- [ ] Araca bağlama

### Faz 5: Ürün Stok Modülü (Hafta 9)

- [ ] Ürün CRUD
- [ ] Stok hareketi kayıtları
- [ ] Stok sayımı
- [ ] Minimum stok uyarıları

### Faz 6: Dashboard & Raporlar (Hafta 10)

- [ ] Dashboard kartları
- [ ] Grafikler (Recharts)
- [ ] Temel raporlar
- [ ] Export (Excel/PDF)

### Faz 7: Müşteri & Satış (Hafta 11)

- [ ] Müşteri yönetimi
- [ ] Satış kaydı
- [ ] Satış geçmişi
- [ ] Kar/zarar analizi

### Faz 8: Real-time & Polish (Hafta 12)

- [ ] Socket.io entegrasyonu
- [ ] Real-time bildirimler
- [ ] Performance optimizasyonu
- [ ] Responsive düzenlemeler
- [ ] Test ve bug fix

### Faz 9: Deployment (Hafta 13)

- [ ] Docker yapılandırması
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Kullanıcı eğitimi

---

## 📡 API ENDPOINT LİSTESİ

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

### Master Panel - Tax Rates
```
GET    /api/master/tax-rates
GET    /api/master/tax-rates/:id
POST   /api/master/tax-rates
PUT    /api/master/tax-rates/:id
DELETE /api/master/tax-rates/:id
GET    /api/master/tax-rates/:id/history
```

### Master Panel - Exchange Rates
```
GET    /api/master/exchange-rates
GET    /api/master/exchange-rates/current
POST   /api/master/exchange-rates
PUT    /api/master/exchange-rates/:id
POST   /api/master/exchange-rates/fetch
GET    /api/master/exchange-rates/settings
PUT    /api/master/exchange-rates/settings
```

### Master Panel - Countries
```
GET    /api/master/countries
GET    /api/master/countries/:id
POST   /api/master/countries
PUT    /api/master/countries/:id
DELETE /api/master/countries/:id
```

### Master Panel - Galleries
```
GET    /api/master/galleries
GET    /api/master/galleries/:id
POST   /api/master/galleries
PUT    /api/master/galleries/:id
DELETE /api/master/galleries/:id
GET    /api/master/galleries/:id/stats
```

### Master Panel - Notifications
```
GET    /api/master/notifications
POST   /api/master/notifications
GET    /api/master/notifications/:id/reads
```

### Master Panel - Audit Logs
```
GET    /api/master/audit-logs
GET    /api/master/audit-logs/:id
```

### Vehicles
```
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
GET    /api/vehicles/transit
GET    /api/vehicles/in-stock
PATCH  /api/vehicles/:id/status
POST   /api/vehicles/:id/images
DELETE /api/vehicles/:id/images/:imageId
POST   /api/vehicles/:id/documents
DELETE /api/vehicles/:id/documents/:docId
POST   /api/vehicles/:id/expenses
DELETE /api/vehicles/:id/expenses/:expenseId
```

### Calculator
```
POST   /api/calculator/calculate
GET    /api/calculator/current-rates
GET    /api/calculator/history
GET    /api/calculator/:id
POST   /api/calculator/:id/save-to-vehicle
GET    /api/calculator/:id/pdf
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/:id/movements
POST   /api/products/:id/movements
GET    /api/products/low-stock
POST   /api/products/inventory
```

### Customers
```
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
GET    /api/customers/:id/sales
```

### Sales
```
GET    /api/sales
GET    /api/sales/:id
POST   /api/sales
PUT    /api/sales/:id
DELETE /api/sales/:id
```

### Reports
```
GET    /api/reports/dashboard
GET    /api/reports/sales
GET    /api/reports/profit
GET    /api/reports/stock-aging
GET    /api/reports/products
GET    /api/reports/export/:type
```

### Gallery Settings
```
GET    /api/settings
PUT    /api/settings
GET    /api/settings/users
POST   /api/settings/users
PUT    /api/settings/users/:id
DELETE /api/settings/users/:id
```

---

## 🖥️ EKRANLAR VE UI/UX

### Master Panel Ekranları

1. **Master Dashboard**
   - Platform istatistikleri
   - Aktif galeri sayısı
   - Toplam araç sayısı
   - Son aktiviteler

2. **Vergi Oranları**
   - Vergi listesi tablosu
   - Oran düzenleme modalı
   - Geçmiş görüntüleme
   - FIF oranları (motor hacmine göre)

3. **Döviz Kurları**
   - Güncel kurlar
   - Güncelleme ayarları
   - Kur geçmişi grafiği
   - Manuel güncelleme

4. **Menşe Ülkeler**
   - Ülke listesi
   - Gümrük oranları
   - Nakliye ücretleri

5. **Galeri Yönetimi**
   - Galeri listesi
   - Galeri detayları
   - Abonelik durumu

6. **Bildirimler**
   - Bildirim oluşturma
   - Gönderilmiş bildirimler
   - Okunma durumu

7. **Audit Log**
   - Değişiklik geçmişi
   - Filtreleme
   - Detay görüntüleme

### Galeri Panel Ekranları

1. **Dashboard**
   - Özet kartlar
   - Grafikler
   - Son aktiviteler
   - Uyarılar

2. **Araç Listesi**
   - Grid/Liste görünümü
   - Filtreleme
   - Arama
   - Quick actions

3. **Araç Detay**
   - Araç bilgileri
   - Görseller
   - Evraklar
   - Giderler
   - Maliyet özeti

4. **Yeni Araç Ekleme**
   - Çok adımlı form
   - Görsel yükleme
   - Evrak yükleme
   - Maliyet hesaplama

5. **Maliyet Hesaplama**
   - Giriş formu
   - Sonuç ekranı
   - PDF export

6. **Transit Araçlar**
   - Yolda gelen liste
   - Tahmini varış
   - Stoğa aktarma

7. **Ürün Stok**
   - Ürün listesi
   - Stok hareketleri
   - Sayım

8. **Müşteriler**
   - Müşteri listesi
   - Müşteri detay

9. **Satışlar**
   - Satış listesi
   - Yeni satış
   - Satış detay

10. **Raporlar**
    - Rapor seçimi
    - Filtreler
    - Sonuçlar
    - Export

11. **Ayarlar**
    - Galeri bilgileri
    - Kullanıcı yönetimi
    - Bildirimler

---

## 📝 NOTLAR VE GEREKSİNİMLER

### KKTC'ye Özel Notlar

- Para birimi: Türk Lirası (TL) - birincil
- Döviz desteği: USD, EUR, GBP, JPY
- Dil: Türkçe arayüz
- Araç ithalatı ağırlıklı olarak Japonya ve İngiltere'den
- Toplam vergi yükü araç değerinin yaklaşık %60-70'i
- Sol direksiyon araçlar (İngiltere'den gelenler için dönüşüm maliyeti)

### Teknik Gereksinimler

- Responsive tasarım (mobil uyumlu)
- Dark/Light mode desteği (opsiyonel)
- WebSocket ile real-time güncellemeler
- Her hesaplama için vergi snapshot'ı
- Audit log ile değişiklik takibi
- API rate limiting
- CORS güvenliği
- Input sanitization
- SQL injection koruması

### İleride Eklenebilecek Özellikler

- [ ] Mobil uygulama (React Native)
- [ ] SMS/WhatsApp bildirimleri
- [ ] Online satış portalı (halkın göreceği)
- [ ] Muhasebe yazılımı entegrasyonu
- [ ] QR kod ile araç bilgisi
- [ ] Çoklu galeri desteği (franchise model)
- [ ] Döviz kuru otomatik API entegrasyonu
- [ ] KKTC Gümrük sistemi API entegrasyonu (varsa)
- [ ] Araç değer tahmini (yapay zeka)
- [ ] Müşteri CRM özellikleri
- [ ] Takvim ve randevu sistemi

---

## 🔐 GÜVENLİK KONTROL LİSTESİ

- [ ] JWT token güvenliği
- [ ] Refresh token mekanizması
- [ ] Password hashing (bcrypt)
- [ ] Rate limiting
- [ ] CORS yapılandırması
- [ ] Helmet.js güvenlik headers
- [ ] Input validation (Zod)
- [ ] SQL injection koruması (Prisma)
- [ ] XSS koruması
- [ ] CSRF koruması
- [ ] Dosya yükleme güvenliği
- [ ] Environment variables
- [ ] Sensitive data encryption

---

## 📞 İLETİŞİM VE DESTEK

Bu dokümanda belirtilen özellikler, KKTC araç galerileri için özel olarak tasarlanmış kapsamlı bir yönetim sistemi için temel gereksinimleri içermektedir. Geliştirme sürecinde ek özellikler veya değişiklikler için dokümantasyon güncellenmelidir.

---

**Doküman Versiyonu:** 2.0  
**Son Güncelleme:** 28 Şubat 2026  
**Hazırlayan:** Claude AI Assistant
