description: İlerlemeyi checkpoint olarak kaydet
argument-hint: <açıklama>

ORCHESTRATION.md aç. Son CHECKPOINT numarasını bul, +1 yap.

<!-- YENİ CHECKPOINT'LER BURAYA --> yorumunun ÜSTÜNE ekle:

### CHECKPOINT-[N] — [tarih saat]
- **Durum:** 🔄 Devam
- **Tamamlanan:** $ARGUMENTS
- **Sıradaki:** [bir sonraki adım — spesifik]
- **Sorunlar:** [varsa]
- **Aktif Dosyalar:** [dosya yolları]
- **Bağımlılıklar:** [paketler]
- **Son Komut:** [son terminal komutu]

Görev tablosunu da güncelle (✅ tamamlanan, 🔄 aktif).

Sonra PROJECT_TREE.md'yi güncelle:
- @tree-mapper agent'ını çağır
- Son değişikliklerden etkilenen dosyaları tara
- Bağımlılık haritasını güncelle
- Etki analizi tablosunu güncelle
- Yeni uyarıları (circular, orphan, fat file) ekle
- Değişiklik Geçmişi tablosuna bu checkpoint'i ekle

Son olarak git commit:
```bash
git add -A && git commit -m "checkpoint-[N]: $ARGUMENTS"
```
