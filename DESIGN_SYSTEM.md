# 🎨 KKTC Araç Galerisi — Design System

> Bu dosya @designer tarafından yönetilir ve güncellenir.
> Tüm UI bileşenleri bu kurallara ZORUNLU uymalıdır.
> Hardcoded renk, boyut, shadow YASAK — sadece token kullan.

---

## 1. Renk Token'ları (HSL — globals.css)

### Marka
```css
--brand-50: 222 47% 95%;
--brand-100: 222 47% 89%;
--brand-200: 222 47% 79%;
--brand-300: 222 47% 65%;
--brand-400: 222 47% 51%;
--brand-500: 222 47% 41%;
--brand-600: 222 47% 31%;    /* PRIMARY */
--brand-700: 222 47% 21%;
--brand-800: 222 47% 15%;
--brand-900: 222 47% 11%;
```

### Semantic — İş Mantığı
```css
/* Kar / Zarar */
--kar: 142 71% 45%;
--kar-bg: 142 76% 95%;
--zarar: 0 84% 60%;
--zarar-bg: 0 84% 96%;
--dusuk-kar: 38 92% 50%;
--dusuk-kar-bg: 38 92% 95%;

/* Araç Durum */
--status-transit: 217 91% 60%;
--status-transit-bg: 217 91% 95%;
--status-stokta: 142 71% 45%;
--status-stokta-bg: 142 76% 95%;
--status-rezerve: 38 92% 50%;
--status-rezerve-bg: 38 92% 95%;
--status-satildi: 215 14% 34%;
--status-satildi-bg: 215 14% 95%;
```

### Surface Katmanlar
```css
--surface-0: 0 0% 100%;        /* Sayfa bg */
--surface-1: 210 40% 98%;      /* Kart bg */
--surface-2: 210 40% 96%;      /* Nested kart */
--surface-3: 210 25% 94%;      /* Hover bg */
--surface-elevated: 0 0% 100%; /* Modal, dropdown */
```

### Dark Mode
```css
.dark {
  --surface-0: 222 47% 7%;
  --surface-1: 222 47% 11%;
  --surface-2: 222 47% 15%;
  --surface-3: 222 47% 19%;
  --surface-elevated: 222 47% 13%;
}
```

---

## 2. Tipografi Ölçeği

| Token | Tailwind | Kullanım | Ek |
|-------|----------|----------|----|
| display | text-4xl font-bold | Dashboard büyük sayılar | tracking-tight tabular-nums |
| h1 | text-2xl font-bold | Sayfa başlığı | tracking-tight |
| h2 | text-xl font-semibold | Bölüm başlığı | — |
| h3 | text-lg font-semibold | Kart başlığı | — |
| body | text-sm font-normal | Genel metin | leading-relaxed |
| body-sm | text-xs font-normal | Yardımcı metin | text-muted-foreground |
| label | text-xs font-medium | Form label, tablo header | uppercase tracking-wider |
| price | text-2xl font-bold | Fiyat gösterimi | tabular-nums (ZORUNLU) |
| stat | text-3xl font-bold | İstatistik sayı | tabular-nums |

Font: Inter (system-ui fallback)

---

## 3. Spacing & Layout
```
Sayfa padding:    px-6 lg:px-8
Kart iç boşluk:  p-5
Kart arası:       gap-4 lg:gap-6
Bölümler arası:   space-y-8
Form elemanları:  space-y-4
İkon-metin arası: gap-2
Sidebar genişlik: w-64 (fixed, lg+)
```

---

## 4. Elevation (Shadow)

| Token | CSS | Kullanım |
|-------|-----|----------|
| shadow-xs | 0 1px 2px rgba(0,0,0,0.05) | Buton |
| shadow-sm | 0 1px 3px rgba(0,0,0,0.1) | Kart default |
| shadow-md | 0 4px 6px -1px rgba(0,0,0,0.1) | Kart hover |
| shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.1) | Dropdown, popover |
| shadow-xl | 0 20px 25px -5px rgba(0,0,0,0.1) | Modal |

---

## 5. Border Radius

| Kullanım | Token |
|----------|-------|
| Buton, input, badge | rounded-lg (8px) |
| Kart küçük | rounded-lg (8px) |
| Kart büyük, section | rounded-xl (12px) |
| Modal, dialog | rounded-2xl (16px) |
| Avatar, pill badge | rounded-full |

---

## 6. Component Kuralları

### StatCard
- İkon(20px muted) + label(text-xs) üstte
- Sayı: text-3xl bold tabular-nums + CountUp animasyon
- Trend: text-xs + ok ikonu (yeşil=↑ kırmızı=↓)
- Hover: border-primary/20 shadow-md (200ms)

### VehicleCard
- Foto: aspect-[4/3] object-cover rounded-t-xl
- Status badge: dot(renk kodlu) + text
- Transit dot: pulse animasyonu
- Fotoğraf yok: gradient placeholder + araç ikonu
- Hover: scale-[1.02] shadow-lg (200ms)

### Tablo
- Header: sticky bg-muted/50 backdrop-blur-sm text-xs uppercase
- Row: h-14 hover:bg-muted/30 border-b border-border/50 (150ms)
- Actions: MoreHorizontal dropdown sağda
- Bulk: checkbox sol, seçilince action bar slide-down
- Sort: ChevronUp/Down ikonu

### Form
- Label: text-xs font-medium mb-1.5, required=kırmızı yıldız
- Input: h-10 rounded-lg focus:ring-2 ring-primary/20
- Error: kırmızı border + mesaj slide-down (text-xs text-destructive)
- Success: sağda yeşil check fade-in
- Currency: sol tarafta para birimi badge + sayı format

### Multi-Step Form
- Step bar: tamamlanan=yeşil check, aktif=primary, bekleyen=gri
- Geçiş: slide-left/right animasyon
- Footer sticky: Geri / İleri, son adım: Kaydet
- Draft auto-save 30sn

### Badge
- Status: dot + text, rounded-full, text-xs font-medium
  - Stokta: bg-emerald-50 text-emerald-700
  - Transit: bg-blue-50 text-blue-700 (dot pulse)
  - Rezerve: bg-amber-50 text-amber-700
  - Satıldı: bg-slate-50 text-slate-500
- Kar: bg-emerald-50 text-emerald-700 "↑ %18"
- Zarar: bg-red-50 text-red-700 "↓ -%5"

---

## 7. Animasyon Presets
```
Sayfa geçiş:     opacity 0→1, y 8→0 (200ms easeOut)
Liste stagger:    staggerChildren 50ms, item y 12→0
Modal:            opacity 0→1, scale 0.95→1 (200ms)
Kart hover:       translateY -2px + shadow-md (200ms)
Buton click:      scale 0.97→1 (100ms)
Toast:            slide-in sağ (300ms) / slide-out (200ms)
Tab underline:    layoutId slide (framer-motion)
Accordion:        height auto (200ms)
Skeleton:         opacity pulse 0.4→1 (1.5s infinite)
CountUp:          easeOut (1.5s)
Success check:    SVG path draw (400ms)
Badge appear:     scale 0→1 bounce (300ms)
Progress bar:     width 0→X (1s easeOut)
```

prefers-reduced-motion: tüm animasyonlar devre dışı

---

## 8. Zorunlu State'ler

### Loading
- Sayfa: skeleton (animate-pulse), içerik şekline uygun
- Dashboard: 6 skeleton kart + 2 skeleton grafik
- Tablo: 5 skeleton satır
- Grid: 6 skeleton araç kartı
- Buton: disabled + Loader2 spin + text

### Empty
- Büyük ikon (64px muted) + başlık + açıklama + CTA buton
- Her liste için FARKLI mesaj:
  - Araç: "Henüz araç eklenmedi" + [İlk Aracı Ekle]
  - Ürün: "Stokta ürün yok" + [Ürün Ekle]
  - Müşteri: "Müşteri kaydı yok" + [Müşteri Ekle]
  - Arama: "Sonuç bulunamadı" + [Filtreleri Temizle]

### Error
- API: uyarı ikonu + mesaj + [Tekrar Dene]
- Form: kırmızı border + altında mesaj + üstte genel banner
- Bağlantı: üst banner + spinner + auto-reconnect

### Optimistic UI
- Silme: fade-out hemen, hata olursa geri gelir
- Ekleme: fade-in hemen, API onaylarsa kalır
- Status: badge hemen değişir

---

## 9. Responsive Kurallar

| Breakpoint | Layout | Nav |
|------------|--------|-----|
| < 640px | Tek sütun | Bottom tab bar (5 tab) |
| 640-1024px | 2 sütun | Collapsible sidebar |
| > 1024px | 3+ sütun | Fixed sidebar (w-64) |

### Mobil Özel
- Filtreler: bottom sheet (slide-up)
- Detay actions: bottom sheet
- Tablo: card listesine dönüşüm
- FAB: sağ alt floating button (+Araç Ekle)
- Swipe: kart sola → sil/düzenle
- Pull-to-refresh: liste sayfalarında
- Touch target: min 44x44px

---

## 10. Erişilebilirlik

- Kontrast: WCAG AA (4.5:1 normal, 3:1 large)
- Focus: ring-2 ring-primary/20 outline-none — HER interaktif eleman
- Tab order: mantıksal sıra
- ARIA: label, live, expanded, role
- Keyboard: Enter=submit, Escape=close, Arrow=navigate
- Alt text: tüm görseller
- prefers-reduced-motion: animasyonları kapat

---

## Değişiklik Geçmişi

| Tarih | Değişiklik | Veren |
|-------|-----------|-------|
| — | Design system v2 — token sistemi, animasyonlar, responsive, a11y | @designer |
