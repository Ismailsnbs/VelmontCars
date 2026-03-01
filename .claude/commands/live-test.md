description: Playwright ile frontend sayfalarını canlı test et ve hataları raporla

Playwright MCP kullanarak frontend sayfalarını canlı test eden `live-tester` agent'ını başlat.

## Parametreler

- `$ARGUMENTS` — opsiyonel: test edilecek bölüm (`master`, `gallery`, `auth`, `all`)
  - Varsayılan: `all` (tüm mevcut route'ları test et)

## Talimatlar

1. `live-tester` agent'ını **background'da** spawn et
2. Agent'a şu talimatı ver:

```
Playwright MCP araçlarını kullanarak frontend'i canlı test et.

Test kapsamı: $ARGUMENTS (varsayılan: all)

Adımlar:
1. localhost:3000 ve localhost:4000 erişilebilirlik kontrolü
2. Tarayıcı aç (Chromium, 1280x720)
3. /login sayfasında admin@kktcgaleri.com / 123456 ile giriş yap
4. Belirtilen kapsama göre route'ları gez:
   - master: /master altındaki tüm sayfalar
   - gallery: /dashboard altındaki tüm sayfalar
   - auth: /login, /register
   - all: yukarıdakilerin hepsi
5. Her sayfada:
   - Yüklenme kontrolü
   - Console error toplama
   - Network error toplama
   - Butonlara tıklama
   - Dialog/modal aç-kapat
   - Form doldurma (varsa)
6. Sonuçları reports/LIVE_TEST_{FAZ}_{TARİH}.md dosyasına yaz

Mevcut faz bilgisi için ORCHESTRATION.md dosyasını oku.
Bugünün tarihi: güncel tarihi kullan.
```

3. Agent tamamlandığında rapor dosya yolunu kullanıcıya bildir
4. Rapordaki kritik hataları özet olarak listele

## Notlar
- Bu komut kod DEĞİŞTİRMEZ, sadece test eder
- Sonuçlar `reports/` dizinine yazılır
- Lead agent raporu okuyup düzeltmeleri ayrıca yapar
