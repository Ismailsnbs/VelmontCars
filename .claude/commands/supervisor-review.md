description: Supervisor denetimi başlat

ORCHESTRATION.md ve PROJECT_TREE.md oku ve şu kontrolleri yap:

1. **Bütünlük:** Checkpoint'ler arasında atlama var mı?
2. **Tutarlılık:** Görev tablosu ↔ checkpoint'ler uyumlu mu?
3. **Model Kullanımı:** Doğru agent doğru model ile mi çalışıyor?
4. **Kalite:** src/ kodunu incele — mimari uyumu
5. **Proje Ağacı:** PROJECT_TREE.md güncel mi? Uyarılar var mı? (circular dep, orphan, fat file)
6. **Risk:** Bottleneck veya potansiyel sorun var mı?
7. **İlerleme:** Plan dahilinde mi?

Karar:
- ✅ ONAY — Devam
- ⚠️ UYARI — Düzeltme gerekli (detay ver)
- ❌ RED — Dur, yeniden planla (neden)

Geri bildirimi Günlük bölümüne yaz.

---

## RAPOR ÇIKTISI (ZORUNLU)

Denetim tamamlandıktan sonra `reports/` dizinine şematik bir rapor dosyası yaz.

### Dosya Adlandırma

Dosya adında **faz numarası**, **denetim türü** ve **tarih** bulunmalıdır:

```
reports/SUPERVISOR_{FAZ}_{TUR}_{YYYY-MM-DD}.md
```

| Segment | Açıklama | Örnekler |
|---------|----------|----------|
| `{FAZ}` | Faz numarası | `FAZ1`, `FAZ2`, `FAZ3`, ... `FAZ9` |
| `{TUR}` | Denetim türü/aşaması | `ARA` (ara değerlendirme), `FINAL` (faz kapanış), `FIX` (düzeltme sonrası), `HOTFIX` (acil müdahale sonrası) |
| `{YYYY-MM-DD}` | Tarih | `2026-03-01` |

**Örnekler:**
```
reports/SUPERVISOR_FAZ2_ARA_2026-03-01.md      ← Faz 2 ara denetim
reports/SUPERVISOR_FAZ2_FINAL_2026-03-01.md    ← Faz 2 kapanış denetimi
reports/SUPERVISOR_FAZ2_FIX_2026-03-01.md      ← Faz 2 düzeltme sonrası
reports/SUPERVISOR_FAZ3_ARA_2026-03-15.md      ← Faz 3 ara denetim
reports/SUPERVISOR_FAZ9_FINAL_2026-04-01.md    ← Final denetim
```

**Aynı gün + aynı faz + aynı tür** için ikinci rapor gerekirse sonuna `_v2` ekle:
```
reports/SUPERVISOR_FAZ2_FINAL_2026-03-01_v2.md
```

### Rapor Şablonu

Aşağıdaki şematik yapıyı **birebir** kullan:

```markdown
# SUPERVISOR DENETİM RAPORU

**Tarih:** {tarih} | **Saat:** {saat}
**Denetçi:** Supervisor (Opus 4.6)
**Kapsam:** {checkpoint aralığı}
**Mevcut Faz:** {faz bilgisi}

---

## ÖZET SKOR TABLOSU

```
┌─────────────────────────┬────────┬────────┬────────┬────────┐
│ Kategori                │ KRİTİK │ UYARI  │ ÖNERİ  │ TOPLAM │
├─────────────────────────┼────────┼────────┼────────┼────────┤
│ Checkpoint Bütünlüğü    │   {n}  │   {n}  │   {n}  │   {n}  │
│ Görev Tablosu           │   {n}  │   {n}  │   {n}  │   {n}  │
│ Model Routing           │   {n}  │   {n}  │   {n}  │   {n}  │
│ Multi-Tenant Güvenlik   │   {n}  │   {n}  │   {n}  │   {n}  │
│ Vergi Hesaplama         │   {n}  │   {n}  │   {n}  │   {n}  │
│ Prisma Schema           │   {n}  │   {n}  │   {n}  │   {n}  │
│ API Güvenlik            │   {n}  │   {n}  │   {n}  │   {n}  │
│ PROJECT_TREE.md         │   {n}  │   {n}  │   {n}  │   {n}  │
│ Risk & Bottleneck       │   {n}  │   {n}  │   {n}  │   {n}  │
├─────────────────────────┼────────┼────────┼────────┼────────┤
│ TOPLAM                  │   {n}  │   {n}  │   {n}  │   {n}  │
└─────────────────────────┴────────┴────────┴────────┴────────┘
```

## KARAR: {✅ ONAY | ⚠️ KOŞULLU ONAY | ❌ RED}

---

## DENETİM AKIŞI

```
📥 GIRDI
 │
 ├── ORCHESTRATION.md
 ├── PROJECT_TREE.md
 ├── SPEC.md
 └── CLAUDE.md
 │
 ▼
┌──────────────────────────────────────────┐
│  1. CHECKPOINT BÜTÜNLÜĞÜ                │
│  ┌────────┬────────┬────────┬────────┐   │
│  │ CP-{n} │ Tarih  │ Kapsam │ Durum  │   │
│  ├────────┼────────┼────────┼────────┤   │
│  │ ...    │ ...    │ ...    │ ✅/❌  │   │
│  └────────┴────────┴────────┴────────┘   │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  2. GÖREV TABLOSU TUTARLILIĞI            │
│                                          │
│  Faz {n}: {tamamlanan}/{toplam}          │
│  ├── ✅ Tamamlanan: {liste}              │
│  ├── 🔄 Devam eden: {liste}              │
│  └── ⬜ Bekleyen: {liste}                │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  3. MODEL ROUTING                        │
│                                          │
│  ┌──────────┬──────────────┬──────────┐  │
│  │ Görev    │ Atanan Agent │ Doğru?   │  │
│  ├──────────┼──────────────┼──────────┤  │
│  │ {T-nnn}  │ @{agent}     │ ✅/❌   │  │
│  └──────────┴──────────────┴──────────┘  │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  4. GÜVENLİK ANALİZİ                    │
│                                          │
│  Multi-Tenant:                           │
│  ├── galleryId filtresi: ✅/❌           │
│  ├── gallery middleware: ✅/❌            │
│  └── Sorunlar: {varsa listele}           │
│                                          │
│  API Auth:                               │
│  ├── authenticate: ✅/❌                 │
│  ├── role guard: ✅/❌                   │
│  ├── validate: ✅/❌                     │
│  └── Sorunlar: {varsa listele}           │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  5. VERGİ HESAPLAMA DOĞRULAMA            │
│                                          │
│  CIF = FOB + Nakliye + Sigorta           │
│   └──► ${amount}                         │
│  Gümrük = CIF × %{rate}                 │
│   └──► ${amount}                         │
│  FIF = CIF × %{rate}                    │
│   └──► ${amount}                         │
│  KDV = (CIF+Gümrük+FIF) × %{rate}       │
│   └──► ${amount}                         │
│  Sonuç: ✅ Doğru / ❌ Hatalı             │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  6. SCHEMA & TREE KONTROLÜ               │
│                                          │
│  Prisma: {model_sayısı} model,           │
│          {enum_sayısı} enum               │
│  ├── SPEC uyumu: ✅/❌                   │
│  ├── Index eksikleri: {varsa liste}       │
│  └── Migration: ✅/⬜                    │
│                                          │
│  PROJECT_TREE.md: ✅ Güncel / ❌ Eski    │
│  └── Sorunlar: {varsa listele}           │
└──────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────┐
│  7. RİSK & BOTTLENECK                   │
│                                          │
│  🔴 Kritik:                              │
│  ├── {risk açıklaması}                   │
│  └── {risk açıklaması}                   │
│                                          │
│  🟡 Uyarı:                               │
│  ├── {risk açıklaması}                   │
│  └── {risk açıklaması}                   │
│                                          │
│  🟢 Öneri:                               │
│  ├── {risk açıklaması}                   │
│  └── {risk açıklaması}                   │
│                                          │
│  Bottleneck:                             │
│  ├── {blokcu görev} → {neden}            │
│  └── {blokcu görev} → {neden}            │
└──────────────────────────────────────────┘

📤 ÇIKTI
 │
 ▼
┌──────────────────────────────────────────┐
│  KARAR: {ONAY / KOŞULLU ONAY / RED}     │
│                                          │
│  Zorunlu Aksiyonlar:                     │
│  1. {aksiyon}                            │
│  2. {aksiyon}                            │
│                                          │
│  Önerilen Aksiyonlar:                    │
│  1. {aksiyon}                            │
│  2. {aksiyon}                            │
└──────────────────────────────────────────┘
```

---

## DENETLENEN DOSYALAR

```
{okunan dosyaların listesi — her satırda dosya yolu}
```

---

**Supervisor imzası:** Opus 4.6
**Denetim süresi:** ~{n} dakika
**Denetlenen dosya sayısı:** {n}
**Tespit edilen sorun:** {kritik} kritik, {uyarı} uyarı, {öneri} öneri
```

### Ek Kurallar
- Rapor dosyası **her denetimde yeni bir dosya** olarak oluşturulur (üzerine yazma)
- Raporu yazdıktan sonra `reports/README.md`'deki "Files In This Directory" tablosuna yeni raporu ekle
- Kullanıcıya rapor dosya yolunu bildir
- Şematik kutular ASCII box-drawing karakterleri ile çizilir (UTF-8 uyumlu)
