# /health — Sistem Sağlık Kontrolü

Bu komutu çalıştır ve raporla:

## 1. Dosya Bütünlüğü
Şu dosyaların varlığını kontrol et:
- [ ] CLAUDE.md — okunabiliyor mu?
- [ ] ORCHESTRATION.md — checkpoint kayıtları var mı?
- [ ] SPEC.md — proje tanımı mevcut mu?
- [ ] DESIGN_SYSTEM.md — tasarım kuralları mevcut mu?
- [ ] PROJECT_TREE.md — proje ağacı güncel mi?

## 2. Checkpoint Kontrolü
ORCHESTRATION.md'den:
- Son checkpoint numarası ve tarihi
- Son checkpoint'teki "Sıradaki Adım" spesifik mi yoksa belirsiz mi?
- Atlanan checkpoint var mı? (numara boşluğu)

## 3. Görev Tablosu
ORCHESTRATION.md'den görev tablosunu oku:
- Toplam görev sayısı
- ✅ Tamamlanan
- 🔄 Devam eden
- ⬜ Başlanmamış
- ❌ Hatalı
- Mevcut faz numarası

## 4. Agent Kullanım Analizi
- Haiku görevleri doğru mu? (basit iş = Haiku)
- Sonnet görevleri doğru mu? (karmaşık iş = Sonnet)
- Yanlış model ataması var mı?

## 5. Proje Ağacı
PROJECT_TREE.md'den:
- Son güncelleme tarihi
- CIRCULAR dependency uyarısı var mı?
- ORPHAN dosya var mı?
- FAT_FILE (200+ satır) uyarısı var mı?

## Çıktı Formatı
```
🏥 SİSTEM SAĞLIK RAPORU
═══════════════════════
📁 Dosyalar:        ✅ 5/5
📍 Son Checkpoint:  #X — [tarih]
📊 Görevler:        ✅X | 🔄X | ⬜X | ❌X
🌳 Proje Ağacı:     Güncel/Eski — X uyarı
🎯 Mevcut Faz:      X/9
⚠️ Sorunlar:        [varsa listele]
```
