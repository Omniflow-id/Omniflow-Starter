# Instruksi Environment Detection Badge

Panduan implementasi badge development mode dengan warna kuning untuk membedakan environment development dan production.

## 1. Konsep

Aplikasi akan menampilkan badge berbeda berdasarkan environment:

### Development Mode (`NODE_ENV=development`)
- App name dengan suffix: "Minori AI (Dev)"
- Badge kuning "DEV" di navbar
- Badge kuning "DEVELOPMENT MODE" di footer

### Production Mode (`NODE_ENV=production`)
- App name bersih: "Minori AI" (tanpa suffix)
- Badge hijau "PRODUCTION" di navbar  
- Badge hijau "PRODUCTION MODE" di footer

### Other Modes
- Tidak ada badge (clean interface)

## 2. Implementasi di Express + Nunjucks

### Update app.js

```javascript
// Add app name with environment mode indicator
const baseAppName = process.env.APP_NAME || "Minori AI";
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const appNameWithMode = isDevelopment ? `${baseAppName} (Dev)` : baseAppName;

env.addGlobal("appName", appNameWithMode); // Add app name as global
env.addGlobal("isDevelopment", isDevelopment); // Add development mode flag
env.addGlobal("isProduction", isProduction); // Add production mode flag
```

### Update Navbar (views/components/navbar.njk)

```html
<a class="navbar-brand ps-3 d-flex align-items-center" href="/">
  {{ appName.replace(' (Dev)', '') }}
  {% if isDevelopment %}
    <span class="badge bg-warning text-dark ms-2 small">DEV</span>
  {% elif isProduction %}
    <span class="badge bg-success text-white ms-2 small">PRODUCTION</span>
  {% endif %}
</a>
```

### Update Footer (views/components/footer.njk)

```html
<div class="text-muted d-flex align-items-center justify-content-center">
  Hak Cipta &copy; {{ appName.replace(' (Dev)', '') }} {{ currentYear }}
  {% if isDevelopment %}
    <span class="badge bg-warning text-dark ms-2 small">DEVELOPMENT MODE</span>
  {% elif isProduction %}
    <span class="badge bg-success text-white ms-2 small">PRODUCTION MODE</span>
  {% endif %}
</div>
```

## 3. Session Configuration Fix

Untuk mengatasi masalah session di production mode (redirect loop), update session config:

```javascript
// app.js - Session configuration
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production" && process.env.USE_HTTPS === "true",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
```

## 4. Environment Variables

Pastikan environment variables di `.env`:

```env
NODE_ENV=development
APP_NAME=Minori AI
USE_HTTPS=false
```

**Catatan:**
- `USE_HTTPS=false` untuk development/testing di localhost
- `USE_HTTPS=true` hanya untuk production dengan SSL certificate

## 5. Styling

Badge menggunakan Bootstrap classes:
- `bg-warning`: Background kuning
- `text-dark`: Text hitam agar kontras
- `ms-2`: Margin start untuk spacing
- `small`: Ukuran font kecil

## 6. Hasil Visual

### Development Mode
- Navbar: "Minori AI (Dev)" dengan badge kuning "DEV"
- Footer: "Hak Cipta © Minori AI (Dev) 2025" + badge kuning "DEVELOPMENT MODE"

### Production Mode
- Navbar: "Minori AI" (bersih) dengan badge hijau "PRODUCTION"
- Footer: "Hak Cipta © Minori AI 2025" + badge hijau "PRODUCTION MODE"

### Other Modes
- Navbar: "Minori AI" (tanpa badge)
- Footer: "Hak Cipta © Minori AI 2025" (tanpa badge)

## 6. Keuntungan

1. **Visual Clarity**: Jelas membedakan environment
2. **Developer Friendly**: Mudah tahu sedang di development
3. **Professional**: App name bersih di production, hanya badge hijau sebagai indikator
4. **Responsive**: Badge mengikuti layout responsif Bootstrap

## 7. Testing

```bash
# Set development mode
NODE_ENV=development npm start
# Badge kuning akan muncul

# Set production mode  
NODE_ENV=production npm start
# Badge hijau muncul, app name bersih tanpa suffix
```

## 8. Customization

Untuk mengubah warna badge, ganti class Bootstrap:
- `bg-danger` untuk merah
- `bg-success` untuk hijau
- `bg-info` untuk biru
- `bg-secondary` untuk abu-abu

## 9. Best Practices

1. Selalu gunakan environment detection untuk fitur development
2. Development mode: tampilkan suffix dan badge kuning
3. Production mode: app name bersih + badge hijau subtle
4. Hindari hardcode environment check di template
5. Gunakan global variables untuk konsistensi