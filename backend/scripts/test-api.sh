#!/usr/bin/env bash
# ============================================
#  test-api.sh - Prueba completa de la URL Shortener API
#  Uso: bash scripts/test-api.sh [BASE_URL]
#  Ej:  bash scripts/test-api.sh http://localhost:3000
# ============================================

set -e

BASE_URL="${1:-http://localhost:3000}"
EMAIL="demo@test.com"
PASSWORD="password123"
FULL_NAME="Demo User"
TARGET_URL="https://github.com/anomalyco/opencode"

# Colores
GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'

pass() { echo -e "${GREEN}✔${NC} $1"; }
fail() { echo -e "${RED}✘ $1${NC}"; }
info() { echo -e "${CYAN}$1${NC}"; }
title() { echo -e "\n${YELLOW}===== $1 =====${NC}"; }

JSON="Content-Type: application/json"

# ────────────────────────────────────────────
title "1. Health check"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
[ "$HTTP" = "200" ] && pass "GET /health ($HTTP)" || fail "GET /health ($HTTP)"
curl -s "$BASE_URL/health"; echo

# ────────────────────────────────────────────
title "2. Registro de usuario"
REG=$(curl -s -X POST "$BASE_URL/api/auth/register" -H "$JSON" \
  -d "{\"fullName\":\"$FULL_NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
REG_MSG=$(echo "$REG" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).message))")
echo "  → $REG_MSG"
echo "$REG" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d);console.log(r.data.accessToken?'  → accessToken OK':'  → sin token')})"

# ────────────────────────────────────────────
title "3. Login (obtener token)"
LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" -H "$JSON" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.accessToken))")
REFRESH=$(echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.refreshToken))")

if [ -z "$TOKEN" ] || [ "$TOKEN" = "undefined" ]; then
  echo "$LOGIN"; fail "No se pudo obtener el token (¿email ya registrado? el paso 2 debió haber duplicado el registro)"
  exit 1
fi
pass "accessToken obtenido: ${TOKEN:0:25}..."

# ────────────────────────────────────────────
title "4. Acortar una URL"
SHORT=$(curl -s -X POST "$BASE_URL/api/urls" -H "$JSON" -H "Authorization: Bearer $TOKEN" \
  -d "{\"originalUrl\":\"$TARGET_URL\"}")
CODE=$(echo "$SHORT" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.shortCode))")
ID=$(echo "$SHORT" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.id))")
pass "URL acortada: $BASE_URL/$CODE"
echo "  contando un click man a la url corta..."

# ────────────────────────────────────────────
title "5. Redirección (3 clicks)"
for i in 1 2 3; do
  RES=$(curl -s -o /dev/null -w "%{http_code} → %{redirect_url}" "$BASE_URL/$CODE")
  echo "  click $i: $RES"
done

# ────────────────────────────────────────────
title "6. Listar URLs"
curl -s "$BASE_URL/api/urls" -H "Authorization: Bearer $TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d);console.log('  total:',r.data.pagination.total,'| códigos:',r.data.data.map(u=>u.shortCode).join(', '))})"

# ────────────────────────────────────────────
title "7. Detalle de la URL"
curl -s "$BASE_URL/api/urls/$ID" -H "Authorization: Bearer $TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const u=JSON.parse(d).data;console.log('  shortCode:',u.shortCode,'| clicks:',u.clickCount)})"

# ────────────────────────────────────────────
title "8. Actualizar URL original"
UPDATED=$(curl -s -X PATCH "$BASE_URL/api/urls/$ID" -H "$JSON" -H "Authorization: Bearer $TOKEN" \
  -d "{\"originalUrl\":\"https://es.wikipedia.org/wiki/URL_shortener\"}")
echo "$UPDATED" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const u=JSON.parse(d).data;console.log('  nueva originalUrl:',u.originalUrl)})"

# ────────────────────────────────────────────
title "9. Estadísticas"
echo -n "  overview: "
curl -s "$BASE_URL/api/stats/overview" -H "Authorization: Bearer $TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=JSON.parse(d).data;console.log('totalUrls:',s.totalUrls,'| totalClicks:',s.totalClicks,'| clicksHoy:',s.clicksToday)})"

echo -n "  top-urls: "
curl -s "$BASE_URL/api/stats/top-urls" -H "Authorization: Bearer $TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d).data;console.log(r.map(u=>u.shortCode+' ('+u.clickCount+')').join(', '))})"

echo -n "  clicks-by-day: "
curl -s "$BASE_URL/api/stats/clicks-by-day" -H "Authorization: Bearer $TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d).data;console.log(JSON.stringify(r))})"

echo -n "  url stats: "
curl -s "$BASE_URL/api/stats/urls/$ID" -H "Authorization: Bearer $TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=JSON.parse(d).data;console.log('shortCode:',s.url.shortCode,'| clicks:',s.url.clickCount)})"

# ────────────────────────────────────────────
title "10. Refresh token"
NEWTOK=$(curl -s -X POST "$BASE_URL/api/auth/refresh-token" -H "$JSON" \
  -d "{\"refreshToken\":\"$REFRESH\"}")
echo "$NEWTOK" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d);console.log(r.data&&r.data.accessToken?'  → nuevo accessToken OK':'  → falló')})"

# ────────────────────────────────────────────
title "11. Eliminar URL"
curl -s -X DELETE "$BASE_URL/api/urls/$ID" -H "Authorization: Bearer $TOKEN"
echo

# ────────────────────────────────────────────
title "12. Logout"
curl -s -X POST "$BASE_URL/api/auth/logout" -H "Authorization: Bearer $TOKEN"
echo

echo -e "\n${GREEN}Prueba completada. ✅${NC}"
echo -e "  Swagger UI: ${CYAN}$BASE_URL/api-docs${NC}"