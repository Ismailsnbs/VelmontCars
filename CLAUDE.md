# KKTC Araç Galerisi Yönetim Sistemi

> **Detaylı proje spec'i:** `SPEC.md` (tüm modüller, ekranlar, API endpoint'leri, Prisma schema, UI wireframe'leri)
> **Orkestrasyon:** `ORCHESTRATION.md`
> **Proje ağacı:** `PROJECT_TREE.md`

## Proje Özeti
KKTC araç galerileri için multi-tenant yönetim paneli. İki ana panel: **Master Panel** (platform yönetimi — vergi, döviz, ülke, galeri, bildirim, audit) ve **Galeri Paneli** (araç stok, transit takip, ithalat maliyet hesaplama, ürün stok, müşteri, satış, raporlama).

## Agent Yapısı & Model Routing
| Agent | Model | Görev Alanı |
|-------|-------|------------|
| Lead Agent | Opus 4.6 | Orkestrasyon, planlama, karar |
| Supervisor | Opus 4.6 | Bağımsız denetçi |
| @coder-heavy | Sonnet | Auth, calculator engine, socket.io, karmaşık iş mantığı, multi-step form, Prisma relations |
| @coder-light | Haiku | Scaffolding, config, basit CRUD, boilerplate, seed data, basit UI |
| @tester | Sonnet | Test tasarımı, edge case, mock |
| @test-runner | Haiku | Test/lint/type-check çalıştırma |
| @reviewer | Sonnet | Code review, güvenlik, performans |
| @docs | Haiku | README, JSDoc, changelog |
| @tree-mapper | Haiku | Proje ağacı, bağımlılık haritası |

### Routing Detayı
**Haiku (@coder-light):**
- Monorepo scaffold, package.json, tsconfig
- Docker Compose, .env.example
- Prisma seed data
- Basit CRUD endpoint (OriginCountry, Gallery, Product, Customer)
- shadcn/ui component shell oluşturma
- Basit liste/tablo UI
- VehicleDocument, VehicleExpense yönetimi
- Filtreleme sidebar, arama
- Dockerfile, CI/CD config

**Sonnet (@coder-heavy):**
- Prisma schema (tüm modeller + ilişkiler)
- JWT Auth + Refresh Token + middleware
- Role-based + Gallery tenant middleware
- TaxRate CRUD + TaxRateHistory + AuditLog
- ExchangeRate + cron job + API entegrasyonu
- **ImportCalculation engine** (vergi hesaplama — KRİTİK)
- TaxSnapshot mekanizması
- Vehicle CRUD (karmaşık ilişkiler)
- Vehicle listesi (grid+liste, filtreleme, sıralama)
- Cloudinary görsel yükleme
- Sale modülü (otomatik kar hesaplama)
- Dashboard grafikleri (Recharts)
- Rapor API'leri + Excel/PDF export
- Socket.io real-time bildirimler
- Notification sistemi

## Teknoloji Stack

### Frontend (apps/web/)
- Next.js 14+ (App Router, SSR/SSG)
- TypeScript 5+
- Tailwind CSS 3+ + **shadcn/ui**
- **Zustand** (client state) + **React Query v5** (server state)
- **React Hook Form** + **Zod** (form + validation)
- **Recharts** (grafikler)
- **Lucide Icons**

### Backend (apps/api/)
- Express.js 4+ (TypeScript)
- **Prisma 5+** (PostgreSQL)
- **Redis 7+** (cache + session)
- **Socket.io 4+** (real-time)
- **JWT** (access 30dk + refresh 10gün) + **bcrypt**
- **Multer** + **Cloudinary** (dosya yükleme)
- **Node-cron** (döviz kuru güncelleme)
- **Zod** (API validation)
- **Helmet.js** (güvenlik headers)

### Veritabanı
- PostgreSQL 15+ (ana DB)
- Redis 7+ (cache)
- Cloudinary (görseller + evraklar)

## Monorepo Yapısı
```
kktc-galeri-yonetim/
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/         # login, register
│   │   │   ├── (master)/       # Master Panel
│   │   │   │   ├── tax-rates/
│   │   │   │   ├── exchange-rates/
│   │   │   │   ├── countries/
│   │   │   │   ├── galleries/
│   │   │   │   ├── notifications/
│   │   │   │   └── audit-logs/
│   │   │   └── (dashboard)/    # Galeri Paneli
│   │   │       ├── vehicles/
│   │   │       │   ├── transit/
│   │   │       │   └── [id]/
│   │   │       ├── calculator/
│   │   │       ├── products/
│   │   │       ├── customers/
│   │   │       ├── sales/
│   │   │       ├── reports/
│   │   │       └── settings/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn
│   │   │   ├── master/
│   │   │   ├── vehicles/
│   │   │   ├── calculator/
│   │   │   ├── products/
│   │   │   └── dashboard/
│   │   ├── hooks/              # useAuth, useVehicles, useSocket...
│   │   ├── lib/                # api, utils, calculator, validations
│   │   ├── stores/             # authStore, uiStore, notificationStore
│   │   └── types/
│   └── api/                    # Express Backend
│       ├── src/
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── middleware/      # auth, role, gallery, upload, validate, error
│       │   ├── services/       # calculator, auth, vehicle, taxRate, exchangeRate...
│       │   ├── utils/          # jwt, hash, currency
│       │   ├── validations/    # Zod schemas
│       │   ├── socket/
│       │   └── jobs/           # exchangeRate cron
│       └── prisma/
│           ├── schema.prisma
│           ├── seed.ts
│           └── migrations/
└── packages/
    └── shared/                 # Paylaşılan tipler
```

## Geliştirme Komutları
```bash
pnpm install                    # Bağımlılıkları yükle
pnpm dev                        # Tüm uygulamaları başlat
docker-compose up -d            # PostgreSQL + Redis

# Backend
cd apps/api
npx prisma generate             # Client oluştur
npx prisma migrate dev          # Migration
npx prisma db seed              # Seed data
npx prisma studio               # DB GUI

# Frontend
cd apps/web
pnpm dev                        # localhost:3000
```

## İş Kuralları — VERGİ HESAPLAMA (KRİTİK)

### Hesaplama Akışı
```
CIF = FOB + Nakliye + Sigorta

Gümrük Vergisi = CIF × %rate   (AB: %0, diğer: %10)
FIF = CIF × %rate              (cc'ye göre kademeli: %15-%30)
KDV = (CIF + Gümrük + FIF) × %rate  (binek: %20, ticari: %16)
GKK = CIF × %2.5
Rıhtım = CIF × %4.4
Genel FIF = motorCC × 2.03 TL (TL/USD dönüşümlü)
Bandrol = ~33.5 TL (sabit)

Toplam Maliyet = CIF + tüm vergiler
```

### FIF Oranları
| Motor Hacmi | Oran |
|-------------|------|
| 0-1000cc | %15 |
| 1001-1600cc | %18 |
| 1601-2000cc | %22 |
| 2001-2500cc | %25 |
| 2500+cc | %30 |

### Doğrulama Örneği
Toyota Corolla 2022, 1600cc, JP, FOB $6000, nakliye $600, sigorta $100:
- CIF: $6,700
- Gümrük (%10): $670
- FIF (%18): $1,206
- KDV (%20): $1,715
- GKK: $168, Rıhtım: $295, Genel FIF: ~$100, Bandrol: ~$10
- **Toplam: ~$10,864**

## Kullanıcı Rolleri & Yetki Matrisi
| Rol | Araç | Maliyet | Ürün | Finans | Müşteri | Rapor | Kullanıcı | Ayar |
|-----|------|---------|------|--------|---------|-------|-----------|------|
| MASTER_ADMIN | tüm sistem | | | | | | | |
| GALLERY_OWNER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GALLERY_MANAGER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SALES | ✅ | ✅ | ✅ | ❌ | ✅ | 👁️ | ❌ | ❌ |
| ACCOUNTANT | 👁️ | 👁️ | 👁️ | ✅ | 👁️ | ✅ | ❌ | ❌ |
| STAFF | 👁️ | ❌ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Zorunlu Kurallar
- **Multi-tenant:** Her query'de `WHERE galleryId = ?` ZORUNLU
- **TaxSnapshot:** Her hesaplamada o anki vergi/döviz kaydedilir
- **AuditLog:** Master panel'deki her değişiklik loglanır
- **Zod:** Her API endpoint için validation schema
- **Prisma migration:** Schema değişikliğinde migration ZORUNLU
- **Git commit:** Her checkpoint sonrası
- **Checkpoint:** Her modül tamamlandığında + her 30dk
- **/resume:** Her session başında

## Komutlar
| Komut | İşlev |
|-------|-------|
| `/resume` | Son checkpoint'ten devam et |
| `/checkpoint "..."` | İlerlemeyi kaydet + tree güncelle |
| `/do <görev>` | Akıllı yönlendirme |
| `/delegate <agent> "..."` | Belirli agent'a ata |
| `/tree` | Proje ağacı güncelle |
| `/impact <dosya>` | Etki analizi |
| `/status` | Proje durumu |
| `/supervisor-review` | Supervisor denetim |
