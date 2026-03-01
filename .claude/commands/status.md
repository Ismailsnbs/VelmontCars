description: Proje durumunu hızlıca göster

ORCHESTRATION.md oku ve özetle:

```
╔═══════════════════════════════════╗
║       PROJE DURUMU                ║
╠═══════════════════════════════════╣
║ Faz: [N — isim]                  ║
║ Son Checkpoint: [N]              ║
║ Görevler: ✅X 🔄X ⬜X ❌X       ║
║ Son Supervisor: [tarih/durum]    ║
╚═══════════════════════════════════╝
```

Git durumu:
```bash
git status --short
git log --oneline -3
```

Sıradaki adım: [belirt]
