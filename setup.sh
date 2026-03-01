#!/bin/bash
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}🚗 KKTC Araç Galerisi Yönetim Sistemi${NC}"
echo -e "${CYAN}   Multi-Agent Orkestrasyon Kurulumu${NC}"
echo "═══════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Gereksinimler
echo -e "${BOLD}1/6 — Gereksinimler...${NC}"
command -v node &>/dev/null && echo -e "  ${GREEN}✅ Node.js: $(node --version)${NC}" || { echo -e "  ${RED}❌ Node.js yok${NC}"; exit 1; }
command -v claude &>/dev/null && echo -e "  ${GREEN}✅ Claude Code${NC}" || { echo -e "  ${RED}❌ Claude Code yok → npm i -g @anthropic-ai/claude-code${NC}"; exit 1; }
command -v pnpm &>/dev/null && echo -e "  ${GREEN}✅ pnpm${NC}" || { npm i -g pnpm; echo -e "  ${GREEN}✅ pnpm kuruldu${NC}"; }
command -v docker &>/dev/null && echo -e "  ${GREEN}✅ Docker${NC}" || echo -e "  ${YELLOW}⚠️  Docker yok — DB için gerekli${NC}"
command -v git &>/dev/null && echo -e "  ${GREEN}✅ Git${NC}" || { echo -e "  ${RED}❌ Git yok${NC}"; exit 1; }

# 2. Dizin yapısı
echo -e "${BOLD}2/6 — .claude dizini...${NC}"
mkdir -p .claude/agents .claude/commands
echo -e "  ${GREEN}✅ .claude/ hazır${NC}"

# 3. Dosyaları kopyala
echo -e "${BOLD}3/6 — Dosyalar kopyalanıyor...${NC}"
if [ -f "$SCRIPT_DIR/.claude/agents/coder-light.md" ]; then
    cp "$SCRIPT_DIR/.claude/agents/"*.md .claude/agents/
    cp "$SCRIPT_DIR/.claude/commands/"*.md .claude/commands/
    echo -e "  ${GREEN}✅ 7 agent + 8 komut dosyası${NC}"
    for f in CLAUDE.md ORCHESTRATION.md PROMPTS.md PROJECT_TREE.md SPEC.md ADIMLAR.md; do
        [ ! -f "$f" ] && cp "$SCRIPT_DIR/$f" . 2>/dev/null && echo -e "  ${GREEN}✅ $f${NC}" || echo -e "  ${YELLOW}⚠️  $f zaten var${NC}"
    done
else
    echo -e "  ${RED}❌ Kaynak dosyalar bulunamadı${NC}"; exit 1
fi

# 4. settings.json (izin birleştirme)
echo -e "${BOLD}4/6 — İzinler (settings.json)...${NC}"
EXISTING_SETTINGS=""; [ -f ".claude/settings.json" ] && EXISTING_SETTINGS=".claude/settings.json"
[ -z "$EXISTING_SETTINGS" ] && [ -f "$HOME/.claude/settings.json" ] && EXISTING_SETTINGS="$HOME/.claude/settings.json"
TEMPLATE_SETTINGS="$SCRIPT_DIR/.claude/settings.json"
export EXISTING_SETTINGS TEMPLATE_SETTINGS
python3 << 'PY'
import json, os
existing_path, template_path = os.environ.get("EXISTING_SETTINGS",""), os.environ.get("TEMPLATE_SETTINGS","")
existing, ep, tp = {}, [], []
if existing_path and os.path.isfile(existing_path):
    try: existing = json.load(open(existing_path)); ep = existing.get("permissions",{}).get("allow",[])
    except: pass
if template_path and os.path.isfile(template_path):
    try: tp = json.load(open(template_path)).get("permissions",{}).get("allow",[])
    except: pass
all_p = list(dict.fromkeys(ep + tp))
env = existing.get("env",{}); env["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1"
result = dict(existing); result["env"] = env
result["permissions"] = {"allow": sorted(all_p), "deny": [], "ask": []}
result["enableAllProjectMcpServers"] = True
json.dump(result, open(".claude/settings.json","w"), indent=2, ensure_ascii=False)
print(f"  ✅ Toplam izin: {len(all_p)}")
PY

# 5. .env.example + Git
echo -e "${BOLD}5/6 — .env.example...${NC}"
[ ! -f ".env.example" ] && cat > .env.example << 'ENV'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kktc_galeri?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="degistir-guclu-bir-sifre-32-karakter"
JWT_REFRESH_SECRET="degistir-baska-guclu-sifre"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
EXCHANGE_RATE_API_KEY=""
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest"
NODE_ENV="development"
PORT=4000
FRONTEND_URL="http://localhost:3000"
ENV
echo -e "  ${GREEN}✅ .env.example${NC}"

echo -e "${BOLD}6/6 — Git...${NC}"
[ ! -d ".git" ] && git init && echo -e "  ${GREEN}✅ Git oluşturuldu${NC}" || echo -e "  ${GREEN}✅ Git mevcut${NC}"
[ ! -f ".gitignore" ] && printf "node_modules/\ndist/\n.next/\n.env\n.env.local\n.claude/settings.json\n*.log\n.DS_Store\ncoverage/\n" > .gitignore

echo ""
echo "═══════════════════════════════════════════"
echo -e "${GREEN}${BOLD}🎉 Kurulum tamamlandı!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "📁 Dosyalar:"
echo "   CLAUDE.md          ← Proje beyni (tech stack, routing, iş kuralları)"
echo "   SPEC.md            ← Detaylı proje tanımı (modüller, schema, API, UI)"
echo "   ORCHESTRATION.md   ← 66 görev + 9 faz + checkpoint sistemi"
echo "   PROMPTS.md         ← Kopyala-yapıştır prompt'lar"
echo "   ADIMLAR.md         ← Bu projeyi nasıl geliştireceğiniz"
echo "   PROJECT_TREE.md    ← Proje ağacı (otomatik güncellenir)"
echo "   .claude/           ← 7 agent + 8 komut + izinler"
echo ""
echo -e "${CYAN}🚀 Başlatma:${NC}"
echo "   1. cp .env.example .env  (doldur)"
echo "   2. claude"
echo "   3. PROMPTS.md'den Lead Agent prompt'unu yapıştır"
echo ""
