# /review <dosya-veya-modul> — Kod Review

Belirtilen dosya veya modülü incele.

$ARGUMENTS ile belirtilen hedefi oku ve şu açılardan değerlendir:

## Kontrol Listesi
1. **Doğruluk:** İş mantığı SPEC.md ile uyumlu mu?
2. **Güvenlik:** galleryId filtresi, auth middleware, input validation
3. **Performans:** N+1 query, gereksiz re-render, büyük payload
4. **Tip Güvenliği:** any kullanımı, eksik tipler
5. **Error Handling:** try/catch, hata mesajları, edge case'ler
6. **DRY:** Tekrarlanan kod var mı?
7. **UI (frontend ise):** DESIGN_SYSTEM.md uyumu, 3 state, responsive

## Çıktı
```
📝 REVIEW: [dosya/modül]
═══════════════════════════
✅ İyi: [olumlu noktalar]
⚠️ Uyarı: [düzeltilmesi gereken]
❌ Sorun: [kritik hatalar]
💡 Öneri: [iyileştirme fikirleri]
```
