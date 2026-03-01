description: Bir dosya/fonksiyon/servis için etki analizi yap — sorunun kaynağını ve etkilenen yerleri bul
argument-hint: <dosya-yolu veya fonksiyon-adı>

## Etki Analizi: $ARGUMENTS

### 1. PROJECT_TREE.md Oku
Önce mevcut bağımlılık haritasını oku.

### 2. Hedef Dosyayı Analiz Et
```bash
# Hedef dosyanın import'ları (neye bağımlı?)
grep -n "^import\|^from\|require(" "$ARGUMENTS" 2>/dev/null || \
  grep -rn "$ARGUMENTS" src/ --include="*.ts" --include="*.tsx" -l

# Hedef dosyayı kim import ediyor? (kim bağımlı?)
grep -rn "$ARGUMENTS" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null || true
```

### 3. Çağrı Zincirini Çıkar

Yukarı yönde (sorunun kaynağı olabilecekler):
```
$ARGUMENTS
  ← nereden veri alıyor? (import'lar)
    ← o dosyalar nereden alıyor? (2. seviye)
      ← ... (3. seviyeye kadar git)
```

Aşağı yönde (etkilenenler):
```
$ARGUMENTS
  → kim kullanıyor? (import edenler)
    → onları kim kullanıyor? (2. seviye)
      → ... (3. seviyeye kadar git)
```

### 4. Rapor

```
🔍 ETKİ ANALİZİ: $ARGUMENTS

📥 BAĞIMLILIKLAR (sorunun kaynağı olabilir):
  Seviye 1: [doğrudan import ettiği dosyalar]
  Seviye 2: [onların import ettiği dosyalar]
  Seviye 3: [daha derin bağımlılıklar]

📤 ETKİLENENLER (bu dosya bozulursa ne kırılır):
  Seviye 1: [doğrudan import eden dosyalar]
  Seviye 2: [onları import edenler]
  Seviye 3: [daha derin etki]

⚡ KRİTİK NOKTALAR:
  - [yüksek riskli bağımlılık zincirleri]
  - [paylaşılan utility'ler]
  - [external API çağrıları]

🧪 ÇALIŞTIRILMASI GEREKEN TESTLER:
  - [ilgili test dosyaları]

🔧 OLASI SORUN KAYNAKLARI:
  1. [en muhtemel kaynak — neden]
  2. [ikinci olasılık — neden]
  3. [üçüncü olasılık — neden]
```
