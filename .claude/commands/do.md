description: Görevi otomatik olarak en uygun agent'a yönlendir
argument-hint: <görev açıklaması>

## Akıllı Görev Yönlendirme

Görevi analiz et: $ARGUMENTS

### Karar Ağacı

**Görev tipi nedir?**

1. **Dosya oluşturma / scaffolding / config / boilerplate / basit değişiklik:**
   → `@coder-light` (Haiku — hızlı & ucuz)
   
2. **İş mantığı / çok dosyalı / entegrasyon / auth / ödeme / karmaşık:**
   → `@coder-heavy` (Sonnet — derin düşünme)

3. **Test yazma / test tasarlama / mock oluşturma:**
   → `@tester` (Sonnet — kapsamlı analiz)

4. **Test çalıştırma / lint / type-check / build kontrol:**
   → `@test-runner` (Haiku — hızlı çalıştırma)

5. **Kod inceleme / güvenlik / performans analizi:**
   → `@reviewer` (Sonnet — derin analiz)

6. **README / yorum / changelog / dokümantasyon:**
   → `@docs` (Haiku — hızlı yazım)

7. **Proje ağacı / bağımlılık haritası / dosya yapısı tarama:**
   → `@tree-mapper` (Haiku — hızlı tarama)

### Yönlendir
Seçilen agent'ı çağır ve görevi ver.
Karmaşıklık konusunda şüphen varsa, Sonnet'e yönlendir (güvenli seçim).

Tamamlandığında checkpoint yaz.
