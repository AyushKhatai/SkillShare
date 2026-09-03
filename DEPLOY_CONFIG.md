# ─── Deployment Configuration ──────────────────────────────────
# When you redeploy the backend on Render (or anywhere else),
# update the two values below and redeploy to Vercel.

# 1. Backend root URL (no trailing slash, no /api suffix).
BACKEND_URL=https://YOUR-BACKEND.onrender.com

# 2. After redeploying, change vercel.json to point at it:
#    "destination": "<BACKEND_URL>/api/:path*"

# 3. The frontend's api.js already auto-detects production vs local
#    and falls back to a 12s timeout, then demo data, if unreachable.
#    No frontend changes needed when you swap backends.

# ─── Frontend (Vercel) ─────────────────────────────────────────
# Build command:  (none — pure static)
# Output dir:     ./
# Install cmd:    (none)
# Root:           ./

# ─── Backend (Render) ──────────────────────────────────────────
# Root:           ./
# Build:          npm install
# Start:          node server.js
# Env vars required:
#   DATABASE_URL      (or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)
#   JWT_SECRET        (any long random string)
#   GOOGLE_CLIENT_ID  (from Google Cloud Console)
#   NODE_ENV=production
# Healthcheck:     /api