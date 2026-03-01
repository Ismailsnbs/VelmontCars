description: Sub-agent'a görev ata (model otomatik seçilir)
argument-hint: <agent-adı> <görev>

## Görev: $1 → $2

### Ön Kontrol
1. Görevin bağımlılıkları tamamlanmış mı? (Görev tablosunu kontrol et)
2. Aynı dosyada başka agent çalışıyor mu?

### Model Seçim Rehberi
Eğer agent adı belirtilmemişse, görev karmaşıklığına göre seç:
- Basit (scaffolding, config, boilerplate, lint, tek dosya) → @coder-light (Haiku)
- Karmaşık (iş mantığı, çok dosya, entegrasyon) → @coder-heavy (Sonnet)
- Test yazma → @tester (Sonnet)
- Test çalıştırma → @test-runner (Haiku)
- Code review → @reviewer (Sonnet)
- Dokümantasyon → @docs (Haiku)

### Çalıştır
$1 sub-agent'ını çağır ve görevi ver: $2

### Tamamlandığında
1. Çıktıyı doğrula
2. Sorun varsa düzeltme iste
3. `/checkpoint "$1: $2 tamamlandı"`
4. Sonraki adımı belirle
