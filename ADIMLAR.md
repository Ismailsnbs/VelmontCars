# 📖 KKTC Araç Galerisi — Adım Adım Rehber

---

## 1. Kurulum (5 dakika)

### Gereksinimler
```bash
node --version       # v20+ gerekli
pnpm --version       # yoksa: npm i -g pnpm
claude --version     # yoksa: npm i -g @anthropic-ai/claude-code
docker --version     # PostgreSQL + Redis için
```

### Dosyaları Kur
```bash
mkdir kktc-galeri-yonetim && cd kktc-galeri-yonetim

# ZIP aç ve dosyaları kopyala
unzip ~/Downloads/kktc-galeri-setup.zip -d /tmp/
cp -r /tmp/kktc-galeri/.claude ./
cp /tmp/kktc-galeri/*.md ./
cp /tmp/kktc-galeri/setup.sh ./
chmod +x setup.sh && bash setup.sh
```

### Environment
```bash
cp .env.example .env
# .env'i düzenle: DATABASE_URL, JWT_SECRET, CLOUDINARY_* doldur
```

---

## 2. Başlatma

### Terminal Düzeni (WebStorm)
| Tab | İsim | Kullanım |
|-----|------|----------|
| 1 | LEAD | `claude` → Lead Agent (ana orkestratör) |
| 2 | SUPERVISOR | `claude` → Periyodik denetim |
| 3 | TERMINAL | git, docker, npm komutları |

### İlk Başlatma (Tab 1)
```bash
claude
```
PROMPTS.md'den **"İlk Kez"** prompt'unu kopyala-yapıştır. Lead Agent CLAUDE.md + ORCHESTRATION.md + SPEC.md okuyup plan çıkaracak.

### Sonraki Her Session
```bash
claude
/resume
```

---

## 3. Fazlar ve Kritik Noktalar

### Faz 1: Temel Altyapı (T-001 → T-014)
**Yapılacak:** Monorepo, Docker, Prisma schema (20 model), seed data, JWT auth, role middleware, layout

**DİKKAT:**
- Prisma schema → **@coder-heavy** (20 model, 12 enum, karmaşık ilişkiler)
- Auth + middleware → **@coder-heavy** (güvenlik kritik)
- Geri kalan scaffold → **@coder-light** (hızlı, ucuz)
- Faz sonu: **Supervisor onayı ZORUNLU**

**Kontrol:**
- [ ] `pnpm install` çalışıyor mu?
- [ ] `docker-compose up -d` → DB başlıyor mu?
- [ ] `npx prisma migrate dev` başarılı mı?
- [ ] Login/Register çalışıyor mu?
- [ ] Role middleware → MASTER_ADMIN vs SALES ayrımı doğru mu?

---

### Faz 2: Master Panel (T-015 → T-027)
**Yapılacak:** TaxRate CRUD, OriginCountry CRUD, ExchangeRate + cron, Gallery CRUD, Notification, AuditLog, Master Dashboard

**DİKKAT:**
- TaxRate değiştiğinde **TaxRateHistory** otomatik kaydedilmeli
- AuditLog her CREATE/UPDATE/DELETE'te otomatik
- Döviz kuru cron job ayarlanabilir olmalı
- Master panel → **sadece MASTER_ADMIN** erişebilmeli

---

### Faz 3: Araç Modülü (T-028 → T-036)
**Yapılacak:** Vehicle CRUD (ilişkiler dahil), grid+liste, multi-step form, detay, transit, Cloudinary upload, evrak, gider

**DİKKAT:**
- Vehicle en karmaşık model — 7 ilişki, 30+ alan
- **Multi-tenant:** Tüm query'lerde `galleryId` filtresi ŞART
- Cloudinary API key .env'de olmalı
- Transit→Stokta geçiş otomatik tarih güncellemeli

---

### Faz 4: Maliyet Hesaplama — **EN KRİTİK FAZ** (T-037 → T-043)
**Yapılacak:** Tam vergi hesaplama motoru, TaxSnapshot, API, UI, PDF rapor

**DİKKAT:**
- Hesaplama formülü SPEC.md'den birebir uygulanmalı
- FIF oranları motor hacmine göre kademeli (%15-%30)
- KDV bazı: CIF + Gümrük + FIF (sadece CIF değil!)
- TaxSnapshot → her hesaplamada o anki oranlar kaydedilir
- **6 test senaryosu zorunlu:** AB/AB-dışı ülke, küçük/büyük motor, binek/ticari, farklı döviz
- Doğrulama: Toyota Corolla 1600cc JP $6000 → ~$10,864

---

### Faz 5-9: Kısa Özet
| Faz | Süre | Anahtar |
|-----|------|---------|
| 5: Ürün Stok | 1-2 gün | Basit CRUD, çoğu @coder-light |
| 6: Dashboard | 2-3 gün | Recharts grafikleri, rapor API |
| 7: Müşteri & Satış | 2-3 gün | Satışta otomatik kar hesaplama |
| 8: Real-time | 2-3 gün | Socket.io, bildirimler |
| 9: Deployment | 1-2 gün | Docker, CI/CD, final review |

---

## 4. Hafıza Yönetimi

### Checkpoint Ne Zaman?
- Her modül/dosya tamamlandığında
- Her 30 dakikada (uzun çalışmada)
- Hata oluştuğunda
- Gün sonunda
- Bağlam dolmaya başladığında
- Faz geçişlerinde

### "Sıradaki Adım" Kuralı
**YANLIŞ:** `Devam et`
**DOĞRU:** `T-037: apps/api/src/services/calculator.service.ts dosyasında FIF hesaplama fonksiyonunu yaz. 1001-1600cc aralığı için %18 oranını CIF üzerinden hesapla.`

### Session Kurtarma
```
claude → /resume → durum raporu → onayla → devam
```

### Bağlam Dolduğunda
```
"Bağlam doluyor. Detaylı checkpoint yaz: tamamlanmamış işler, sıradaki adım TAM yaz, aktif dosyalar."
```
→ Yeni session → `/resume`

---

## 5. Supervisor Denetimi

| Ne Zaman | Zorunluluk |
|----------|------------|
| Her 3 checkpoint'te | Önerilen |
| Faz geçişlerinde | **ZORUNLU** |
| Faz 4 sonunda (calculator) | **ZORUNLU** |
| Final (Faz 9) | **ZORUNLU** |

Tab 2'de `claude` aç → PROMPTS.md'den Supervisor prompt'unu yapıştır → Geri bildirimi Tab 1'e aktar.

---

## 6. YAPIN / YAPMAYIN

### ✅ YAPIN
- Her session `/resume` ile başlayın
- Her modül sonrası `/checkpoint` yazın
- Faz geçişlerinde Supervisor çalıştırın
- Calculator'u 6 senaryoyla test edin
- Her query'de `galleryId` filtresi koyun
- Prisma değişikliğinde migration oluşturun
- Git commit her checkpoint sonrası

### ❌ YAPMAYIN
- Checkpoint yazmadan session kapatmayın
- Haiku'ya calculator/auth/socket vermeyin → Sonnet
- `galleryId` filtresi unutmayın → güvenlik açığı
- TaxSnapshot kaydetmeyi unutmayın → eski hesaplamalar bozulur
- Aynı dosyayı iki agent'a aynı anda vermeyin
- .env dosyasını Git'e commit etmeyin

---

## 7. Komut Referansı

| Komut | Ne Zaman |
|-------|----------|
| `/resume` | Her session başında |
| `/checkpoint "..."` | Her modül sonrası |
| `/do <görev>` | Görev atama (otomatik agent) |
| `/delegate <agent> "..."` | Spesifik agent'a atama |
| `/tree` | Dosya yapısı değiştiğinde |
| `/impact <dosya>` | Hata araştırmada |
| `/status` | Hızlı durum |
| `/supervisor-review` | Her 3 checkpoint'te |

---

## Hızlı Başlangıç

```
bash setup.sh              ← Dosyaları kur
cp .env.example .env       ← Ortam değişkenlerini doldur
claude                     ← Tab 1'de Claude Code başlat
[prompt yapıştır]          ← PROMPTS.md'den kopyala
"Başla"                    ← Faz 1 başlar
```
