description: Proje ağacı ve bağımlılık haritasını güncelle
argument-hint: [opsiyonel: belirli klasör veya "full" tam tarama]

## Proje Ağacı Güncelleme

@tree-mapper agent'ını kullan ve şu adımları uygula:

### 1. Dosya Ağacını Tara
```bash
# Proje dosya yapısı (node_modules, .git, dist hariç)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.prisma" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.git/*" | sort
```

### 2. Import/Export Bağımlılıklarını Tara
```bash
# Her kaynak dosyadaki import'ları çıkar
grep -rn "^import \|^import{" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true

# Dinamik import'lar
grep -rn "import(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true

# Export'ları tara
grep -rn "^export " src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true
```

### 3. API ve Route Yapısını Tara
```bash
# Next.js App Router
find . -path "*/app/api/*" -name "route.*" 2>/dev/null || true
find . -path "*/app/*" -name "page.*" 2>/dev/null || true
find . -path "*/app/*" -name "layout.*" 2>/dev/null || true

# Express/Fastify routes
grep -rn "router\.\|app\.get\|app\.post\|app\.put\|app\.delete" src/ --include="*.ts" 2>/dev/null || true
```

### 4. Sorun Tespiti
```bash
# 200+ satırlık dosyalar (fat files)
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | sort -rn | head -20

# Kullanılmayan export'lar (orphan tespiti için ipucu)
# Tüm export edilen isimleri bul, sonra import'larda ara
```

### 5. PROJECT_TREE.md Güncelle

Eğer `$ARGUMENTS` = "full" veya dosya yoksa → tamamını yeniden oluştur.
Aksi halde → sadece değişen bölümleri güncelle.

Dosya formatı:
- Dosya Yapısı (her dosyanın yanında tipi ve temel bağımlılıkları)
- Bağımlılık Haritası (yukarıdan aşağı + aşağıdan yukarı)
- Etki Analizi tablosu
- Servis/Flow haritaları
- Uyarılar (circular, orphan, fat file, high coupling)

### 6. Bildir
Değişiklikleri kısaca raporla:
- Yeni dosyalar: [liste]
- Silinen dosyalar: [liste]
- Değişen bağımlılıklar: [liste]
- Yeni uyarılar: [varsa]
