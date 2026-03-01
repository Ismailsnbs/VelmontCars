# /cost — Model Kullanım & Maliyet Tahmini

ORCHESTRATION.md görev tablosunu oku ve model kullanımını analiz et.

## Hesapla

### Tamamlanan Görevler
Her tamamlanan (✅) görev için hangi agent/model kullanıldığını say:
- Haiku görevleri: @coder-light, @test-runner, @docs, @tree-mapper
- Sonnet görevleri: @coder-heavy, @tester, @reviewer, @designer
- Opus görevleri: Lead Agent, Supervisor (sadece orkestrasyon)

### Kalan Görevler
Henüz başlanmamış (⬜) ve devam eden (🔄) görevler için aynı dağılımı çıkar.

## Optimizasyon Kontrolü
- Haiku yapabilecekken Sonnet'e atanmış görev var mı? (gereksiz maliyet)
- Sonnet gerektiren ama Haiku'ya atanmış görev var mı? (kalite riski)
- Aynı dosya üzerinde birden fazla agent çalışmış mı? (çakışma riski)

## Çıktı
```
💰 MODEL KULLANIM RAPORU
═══════════════════════════
         | Haiku | Sonnet | Opus
─────────┼───────┼────────┼──────
Biten    |   X   |   X    |  X
Kalan    |   X   |   X    |  X
─────────┼───────┼────────┼──────
TOPLAM   |   X   |   X    |  X

Haiku/Sonnet oranı: X% / Y%
Hedef oran: ~60% Haiku / ~35% Sonnet / ~5% Opus

⚠️ Optimizasyon önerileri:
- [varsa listele]
```
