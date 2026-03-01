# KKTC Galeri API

Express.js + TypeScript backend. Multi-tenant mimari, JWT authentication, Prisma ORM.

## Kurulum

```bash
pnpm install
pnpm db:generate    # Prisma client
pnpm db:migrate     # Migration
pnpm db:seed        # Seed data
pnpm dev            # localhost:4000
```

## API Endpoint'leri

Tum endpoint'ler `/api` prefix'i altindadir. Galeri panel endpoint'leri `authenticate + requireGalleryAccess + galleryTenant` middleware zinciri kullanir.

### Auth
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | /auth/register | Kayit |
| POST | /auth/login | Giris |
| POST | /auth/refresh | Token yenileme |
| GET | /auth/me | Kullanici bilgisi |

### Vehicles (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /vehicles | Arac listesi (filtreleme, pagination) |
| GET | /vehicles/stats | Arac istatistikleri |
| GET | /vehicles/:id | Arac detayi |
| POST | /vehicles | Yeni arac |
| PUT | /vehicles/:id | Arac guncelleme |
| PUT | /vehicles/:id/status | Durum degistirme |
| POST | /vehicles/:id/images | Gorsel yukleme |
| POST | /vehicles/:id/documents | Evrak yukleme |

### Calculator (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | /calculator/calculate | Ithalat maliyet hesapla |
| GET | /calculator/rates | Guncel vergi/doviz oranlari |
| GET | /calculator/history | Hesaplama gecmisi |
| GET | /calculator/:id | Hesaplama detayi |
| GET | /calculator/:id/pdf | PDF rapor indir |
| POST | /calculator/:id/save-to-vehicle | Araca kaydet |

### Products (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /products | Urun listesi |
| GET | /products/stats | Urun istatistikleri |
| GET | /products/:id | Urun detayi |
| POST | /products | Yeni urun |
| PUT | /products/:id | Urun guncelleme |
| DELETE | /products/:id | Urun silme |

### Stock Movements (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /stock-movements/recent | Son hareketler |
| GET | /stock-movements/product/:id | Urun hareketleri |
| POST | /stock-movements | Yeni hareket (IN/OUT/ADJUSTMENT) |
| DELETE | /stock-movements/:id | Hareket silme (geri al) |

### Stock Count (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /stock-count/products | Sayim icin urun listesi |
| POST | /stock-count/preview | Fark onizleme |
| POST | /stock-count/apply | Sayimi uygula |

### Stock Alerts (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /stock-alerts/low-stock | Dusuk stok urunleri |
| POST | /stock-alerts/check | Kontrol et ve bildir |

### Customers (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /customers | Musteri listesi |
| GET | /customers/stats | Musteri istatistikleri |
| GET | /customers/:id | Musteri detayi |
| POST | /customers | Yeni musteri |
| PUT | /customers/:id | Musteri guncelleme |
| DELETE | /customers/:id | Musteri silme |

### Sales (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /sales | Satis listesi |
| GET | /sales/stats | Satis istatistikleri |
| GET | /sales/:id | Satis detayi |
| POST | /sales | Yeni satis (otomatik kar hesaplama) |
| PUT | /sales/:id | Satis guncelleme |
| POST | /sales/:id/cancel | Satis iptali (araci stoga al) |

### Reports (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /reports/vehicle-inventory | Arac envanter raporu |
| GET | /reports/vehicle-status | Durum ozeti |
| GET | /reports/costs | Maliyet raporu |
| GET | /reports/stock | Stok raporu |
| GET | /reports/sales | Satis raporu |
| GET | /reports/financial-summary | Finansal ozet |

### Dashboard (Galeri)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /dashboard | Istatistik kartlari |
| GET | /dashboard/charts | Grafik verileri |

### Master Panel
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| CRUD | /tax-rates | Vergi orani yonetimi |
| CRUD | /exchange-rates | Doviz kuru yonetimi |
| CRUD | /countries | Ulke yonetimi |
| CRUD | /galleries | Galeri yonetimi |
| CRUD | /notifications | Bildirim yonetimi |
| GET | /audit-logs | Denetim kayitlari |

## Authentication

JWT Bearer token kullanilir. Login sonrasi `accessToken` (15dk) ve `refreshToken` (7 gun) doner.

```
Authorization: Bearer <accessToken>
```

## Hata Formati

```json
{
  "success": false,
  "error": {
    "message": "Hata aciklamasi",
    "statusCode": 400
  }
}
```

## Test

```bash
pnpm test           # 668 test
pnpm test:watch     # Watch modu
```
