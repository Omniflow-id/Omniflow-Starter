# Instruksi Implementasi Flash Message (Success, Error, Warning, Info)

## Overview
Dokumentasi ini menjelaskan cara menambahkan support untuk **4 tipe flash message** di aplikasi Express.js dengan Nunjucks template engine:
- ✅ **Success** (hijau) - untuk operasi berhasil
- ❌ **Error** (merah) - untuk error/gagal
- ⚠️ **Warning** (kuning) - untuk peringatan
- ℹ️ **Info** (biru) - untuk informasi

---

## File yang Perlu Dimodifikasi

### 1. **app.js** - Middleware Flash Message

**Lokasi:** Root project (`app.js`)

**Tambahkan mapping untuk warning dan info:**

```javascript
// SEBELUM (hanya success & error)
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.url = req.originalUrl;
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");

  next();
});

// SESUDAH (dengan warning & info)
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.url = req.originalUrl;
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  res.locals.warning_msg = req.flash("warning");  // ← TAMBAH INI
  res.locals.info_msg = req.flash("info");        // ← TAMBAH INI

  // Optional: Debugging
  console.log("Flash Messages:", {
    success: res.locals.success_msg,
    error: res.locals.error_msg,
    warning: res.locals.warning_msg,
    info: res.locals.info_msg,
  });

  next();
});
```

---

### 2. **views/components/alert_flash_message.njk** - Alert Component

**Lokasi:** `views/components/alert_flash_message.njk`

**Update kondisi dan tambahkan alert warning & info:**

```html
{# SEBELUM (hanya success & error) #}
{% if success_msg.length > 0 or error_msg.length > 0 %}
<div class="container-fluid px-4">
    {% if success_msg.length > 0 %}
    <div class="alert alert-success alert-dismissible fade show mt-4" role="alert">
        <i class="fas fa-check-circle me-2"></i>
        {{ success_msg }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    {% endif %}

    {% if error_msg.length > 0 %}
    <div class="alert alert-danger alert-dismissible fade show mt-4" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        {{ error_msg }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    {% endif %}
</div>
{% endif %}

{# ============================================================ #}

{# SESUDAH (dengan warning & info) #}
{% if success_msg.length > 0 or error_msg.length > 0 or warning_msg.length > 0 or info_msg.length > 0 %}
<div class="container-fluid px-4">
    {# Success Alert (Hijau) #}
    {% if success_msg.length > 0 %}
    <div class="alert alert-success alert-dismissible fade show mt-4" role="alert">
        <i class="fas fa-check-circle me-2"></i>
        {{ success_msg }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    {% endif %}

    {# Error Alert (Merah) #}
    {% if error_msg.length > 0 %}
    <div class="alert alert-danger alert-dismissible fade show mt-4" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        {{ error_msg }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    {% endif %}

    {# Warning Alert (Kuning) - TAMBAH INI #}
    {% if warning_msg.length > 0 %}
    <div class="alert alert-warning alert-dismissible fade show mt-4" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ warning_msg }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    {% endif %}

    {# Info Alert (Biru) - TAMBAH INI #}
    {% if info_msg.length > 0 %}
    <div class="alert alert-info alert-dismissible fade show mt-4" role="alert">
        <i class="fas fa-info-circle me-2"></i>
        {{ info_msg }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    {% endif %}
</div>
{% endif %}
```

---

## Cara Penggunaan di Controller

### Di Controller/Router:

```javascript
// Success Message (hijau)
req.flash("success", "Data berhasil disimpan!");

// Error Message (merah)
req.flash("error", "Gagal menyimpan data!");

// Warning Message (kuning)
req.flash("warning", "Beberapa data sudah ada, dilewati.");

// Info Message (biru)
req.flash("info", "Semua data sudah terdaftar. Tidak ada data baru yang ditambahkan.");
```

### Contoh Real Case - Upload Bulk User:

```javascript
const uploadNewUser = async (req, res) => {
  try {
    // ... proses parsing Excel ...

    const insertedCount = users.length - skippedUsers.size;

    // Flash warning jika ada duplicate
    if (duplicateMessages.length > 0) {
      req.flash(
        "warning",
        `Beberapa user dilewati karena sudah terdaftar:\n${duplicateMessages.join("\n")}`
      );
    }

    // Flash success jika ada yang berhasil di-insert
    if (insertedCount > 0) {
      req.flash("success", `${insertedCount} data user baru berhasil di-upload!`);
    }
    // Flash info jika semua duplicate
    else if (skippedUsers.size === users.length && users.length > 0) {
      req.flash(
        "info",
        `Semua ${users.length} user sudah terdaftar di database. Tidak ada data baru yang ditambahkan.`
      );
    }

    return res.redirect("/user/index");
  } catch (err) {
    req.flash("error", `Terjadi kesalahan: ${err.message}`);
    return res.redirect("/user/index");
  }
};
```

---

## Icon Reference (Font Awesome)

```html
✅ Success: <i class="fas fa-check-circle"></i>
❌ Error:   <i class="fas fa-exclamation-circle"></i>
⚠️ Warning: <i class="fas fa-exclamation-triangle"></i>
ℹ️ Info:    <i class="fas fa-info-circle"></i>
```

---

## Bootstrap Alert Classes

```html
Success: alert-success   (hijau)
Error:   alert-danger    (merah)
Warning: alert-warning   (kuning)
Info:    alert-info      (biru)
```

---

## Untuk Template Engine Lain

### **EJS:**

```ejs
<!-- app.js tetap sama -->

<!-- alert_flash_message.ejs -->
<% if (success_msg && success_msg.length > 0) { %>
  <div class="alert alert-success alert-dismissible fade show mt-4" role="alert">
    <i class="fas fa-check-circle me-2"></i>
    <%= success_msg %>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
<% } %>

<% if (error_msg && error_msg.length > 0) { %>
  <div class="alert alert-danger alert-dismissible fade show mt-4" role="alert">
    <i class="fas fa-exclamation-circle me-2"></i>
    <%= error_msg %>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
<% } %>

<% if (warning_msg && warning_msg.length > 0) { %>
  <div class="alert alert-warning alert-dismissible fade show mt-4" role="alert">
    <i class="fas fa-exclamation-triangle me-2"></i>
    <%= warning_msg %>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
<% } %>

<% if (info_msg && info_msg.length > 0) { %>
  <div class="alert alert-info alert-dismissible fade show mt-4" role="alert">
    <i class="fas fa-info-circle me-2"></i>
    <%= info_msg %>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
<% } %>
```

### **Handlebars (HBS):**

```handlebars
{{!-- app.js tetap sama --}}

{{!-- alert_flash_message.hbs --}}
{{#if success_msg}}
  <div class="alert alert-success alert-dismissible fade show mt-4" role="alert">
    <i class="fas fa-check-circle me-2"></i>
    {{success_msg}}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
{{/if}}

{{#if error_msg}}
  <div class="alert alert-danger alert-dismissible fade show mt-4" role="alert">
    <i class="fas fa-exclamation-circle me-2"></i>
    {{error_msg}}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
{{/if}}

{{#if warning_msg}}
  <div class="alert alert-warning alert-dismissible fade show mt-4" role="alert">
    <i class="fas fa-exclamation-triangle me-2"></i>
    {{warning_msg}}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
{{/if}}

{{#if info_msg}}
  <div class="alert alert-info alert-dismissible fade show mt-4" role="alert">
    <i class="fas fa-info-circle me-2"></i>
    {{info_msg}}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
{{/if}}
```

---

## Troubleshooting

### ❌ Flash message tidak muncul:

1. **Cek app.js sudah ada mapping `res.locals.warning_msg` dan `res.locals.info_msg`**
2. **Cek alert component sudah handle warning_msg dan info_msg**
3. **Cek conditional di component:** `{% if warning_msg.length > 0 %}` bukan `{% if warning_msg %}`
4. **Restart server** setelah edit app.js

### ❌ Flash message muncul tapi kosong:

1. **Cek di controller pakai `req.flash("warning", "...")` bukan `req.flash("warn", "...")`**
2. **Pastikan key-nya sama persis:** "success", "error", "warning", "info"

### ❌ Flash message format jelek (ada `\n`):

Untuk multiline message, gunakan `white-space: pre-line` di CSS:

```html
<div class="alert alert-warning" style="white-space: pre-line;">
    {{ warning_msg }}
</div>
```

Atau split dan loop:

```html
{% set lines = warning_msg.split('\n') %}
{% for line in lines %}
  {{ line }}<br>
{% endfor %}
```

---

## Checklist Implementasi

- [ ] Edit `app.js` - tambah `res.locals.warning_msg` dan `res.locals.info_msg`
- [ ] Edit `views/components/alert_flash_message.njk` - tambah kondisi warning & info
- [ ] Update kondisi awal: tambah `or warning_msg.length > 0 or info_msg.length > 0`
- [ ] Test semua tipe flash message di browser
- [ ] Restart server setelah edit app.js

---

## References

- Express Flash: https://www.npmjs.com/package/connect-flash
- Bootstrap Alerts: https://getbootstrap.com/docs/5.3/components/alerts/
- Font Awesome Icons: https://fontawesome.com/icons

---

**Created:** 2025-10-07
**Project:** Omniflow HRIS
**Author:** Eric Julianto
