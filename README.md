# KKTC Arac Galerisi Yonetim Sistemi

Multi-tenant arac galerisi yonetim platformu. Master Panel (platform yonetimi) ve Galeri Paneli (arac stok, ithalat maliyet hesaplama, urun stok, musteri, satis, raporlama) olmak uzere iki ana panelden olusur.

## Ozellikler

- **Multi-Tenant Mimari** — Her galeri izole veri alaninda calisir
- **Ithalat Maliyet Hesaplayici** — CIF, gumruk, FIF, KDV, GKK, rihtim vergisi hesaplama (KKTC mevzuatina uygun)
- **Arac Yonetimi** — Transit takip, stok yonetimi, gorsel/evrak yukleme, durum gecisleri
- **Urun Stok Yonetimi** — IN/OUT/ADJUSTMENT hareketleri, sayim, minimum stok uyarilari
- **Satis Modulu** — Otomatik kar hesaplama, atomik transaction'lar, satis iptali
- **Musteri Yonetimi** — CRUD, satis gecmisi, istatistikler
- **Dashboard & Raporlar** — 6 grafik (Recharts), 6 rapor, CSV export
- **Real-Time Bildirimler** — Socket.io ile canli guncelleme
- **Rol Tabanli Erisim** — 6 rol (Master Admin, Gallery Owner, Manager, Sales, Accountant, Staff)
- **Dark Mode** — next-themes ile

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Query v5, React Hook Form, Zod, Recharts |
| Backend | Express.js 4, TypeScript, Prisma 5, Socket.io 4, JWT, Zod, PDFKit |
| Veritabani | PostgreSQL 15, Redis 7 |
| Altyapi | Docker, GitHub Actions CI/CD |

## Onkoşullar

- Node.js 20+
- pnpm 9.15+
- Docker & Docker Compose

## Hizli Baslangic

```bash
# 1. Repoyu klonla
git clone <repo-url>
cd kktc-galeri-yonetim

# 2. Ortam degiskenlerini ayarla
cp .env.example .env
# .env dosyasini duzenle (JWT_SECRET, Cloudinary, vs.)

# 3. PostgreSQL + Redis baslat
docker-compose up -d

# 4. Bagimliliklar
pnpm install

# 5. Veritabani
cd apps/api
pnpm db:generate    # Prisma client olustur
pnpm db:migrate     # Migration'lari calistir
pnpm db:seed        # Ornek veri yukle

# 6. Gelistirme sunucusu
cd ../..
pnpm dev            # API (4000) + Web (3000) paralel baslar
```

## Proje Yapisi

```
kktc-galeri-yonetim/
├── apps/
│   ├── api/                    # Express Backend
│   │   ├── src/
│   │   │   ├── controllers/    # Route handler'lar
│   │   │   ├── routes/         # API route tanimlari
│   │   │   ├── services/       # Is mantigi
│   │   │   ├── middleware/     # Auth, role, gallery, validate, error
│   │   │   ├── validations/   # Zod schema'lari
│   │   │   ├── socket/        # Socket.io server + event'ler
│   │   │   ├── utils/         # JWT, hash, currency
│   │   │   └── jobs/          # Cron job'lar
│   │   └── prisma/
│   │       ├── schema.prisma  # Veritabani modelleri
│   │       ├── seed.ts        # Seed data
│   │       └── migrations/
│   └── web/                   # Next.js Frontend
│       ├── app/
│       │   ├── (auth)/        # Login, Register
│       │   ├── (master)/      # Master Panel
│       │   └── (dashboard)/   # Galeri Paneli
│       ├── components/ui/     # shadcn/ui
│       ├── hooks/             # useSocket, useAuth, vs.
│       ├── stores/            # Zustand store'lar
│       └── lib/               # API client, utils
├── packages/
│   └── shared/                # Paylasilan tipler
├── docker-compose.yml         # Gelistirme (DB + Redis)
├── docker-compose.prod.yml    # Production (tum servisler)
└── .github/workflows/ci.yml   # CI/CD pipeline
```

## API Endpoint'leri

| Modul | Endpoint | Aciklama |
|-------|----------|----------|
| **Auth** | POST /api/auth/login, register, refresh, me | Kimlik dogrulama |
| **Vehicles** | GET/POST/PUT/DELETE /api/vehicles | Arac CRUD + durum gecisleri |
| **Calculator** | POST /api/calculator/calculate | Ithalat maliyet hesaplama |
| **Products** | GET/POST/PUT/DELETE /api/products | Urun stok yonetimi |
| **Stock** | POST /api/stock-movements | IN/OUT/ADJUSTMENT hareketleri |
| **Stock Count** | POST /api/stock-count/preview, apply | Batch stok sayimi |
| **Customers** | GET/POST/PUT/DELETE /api/customers | Musteri yonetimi |
| **Sales** | GET/POST/PUT /api/sales, POST cancel | Satis + kar hesaplama |
| **Reports** | GET /api/reports/* | 6 rapor (envanter, durum, maliyet, stok, satis, finansal) |
| **Dashboard** | GET /api/dashboard, /charts | Istatistik + grafikler |
| **Tax Rates** | GET/POST/PUT/DELETE /api/tax-rates | Vergi orani yonetimi (Master) |
| **Exchange Rates** | GET/PUT /api/exchange-rates | Doviz kuru yonetimi (Master) |
| **Countries** | GET/POST/PUT/DELETE /api/countries | Ulke yonetimi (Master) |
| **Galleries** | GET/POST/PUT/DELETE /api/galleries | Galeri yonetimi (Master) |
| **Notifications** | GET/POST /api/notifications | Bildirim sistemi |
| **Audit Logs** | GET /api/audit-logs | Denetim kayitlari (Master) |

## Ortam Degiskenleri

| Degisken | Aciklama | Varsayilan |
|----------|----------|------------|
| `DATABASE_URL` | PostgreSQL baglanti URL'i | `postgresql://postgres:postgres@localhost:5432/kktc_galeri` |
| `REDIS_URL` | Redis baglanti URL'i | `redis://localhost:6379` |
| `JWT_SECRET` | Access token sifresi | — (zorunlu) |
| `JWT_REFRESH_SECRET` | Refresh token sifresi | — (zorunlu) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary hesap adi | — |
| `CLOUDINARY_API_KEY` | Cloudinary API anahtari | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API sifresi | — |
| `EXCHANGE_RATE_API_KEY` | Doviz kuru API anahtari | — |
| `PORT` | API sunucu portu | `4000` |
| `FRONTEND_URL` | Frontend URL (CORS) | `http://localhost:3000` |

## Test

```bash
cd apps/api
pnpm test           # 668 test calistir
pnpm test:watch     # Watch modunda calistir
```

Test coverage: 18 test dosyasi, 668 test — auth, middleware, services (calculator, product, customer, sale, stockMovement, stockAlert, exchangeRate, taxRate, country, gallery, vehicle, audit, notification), utils (jwt, hash, currency).

## Docker ile Deploy

```bash
# Production ortami
cp .env.example .env
# .env dosyasini production degerleri ile duzenle

docker-compose -f docker-compose.prod.yml up -d --build

# Veritabani migration
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec api npx prisma db seed
```

## Lisans

MIT
