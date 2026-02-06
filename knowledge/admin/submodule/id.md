# Sub-Module Page ([/admin/submodule](/admin/submodule))

Halaman **Sub-Module Page** adalah template/placeholder page yang mendemonstrasikan pola sub-routing di admin panel Omniflow.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat sub-module | Ke [/admin/submodule](/admin/submodule) |
| Kembali ke dashboard | Ke [/admin](/admin) |

## Tujuan

Halaman ini berfungsi sebagai:
- **Template**: Contoh struktur sub-module
- **Placeholder**: Untuk pengembangan fitur masa depan
- **Pattern**: Mendemonstrasikan nested routing

## Pola Route

### Struktur URL

```
/admin/submodule
```

### Hierarki Route

```
/admin (Main admin area)
└── /submodule (Sub-module example)
```

## Struktur Halaman

### Komponen Sub-Module Tipikal

**Header:**
- Navigasi breadcrumb (Dashboard > Sub-Module)
- Judul halaman
- Tombol aksi

**Area Konten:**
- Konten spesifik fitur
- Tabel data atau forms
- Statistik atau charts

**Footer:**
- Link terkait
- Resource bantuan

## Template Development

### Membuat Sub-Modules Baru

Saat menambah sub-modules baru, ikuti pattern ini:

**1. Definisi Route** (`routes/admin.js`):
```javascript
router.get("/admin/submodule", isLoggedInAndActive, checkPermission("view_submodule"), getSubmodulePage);
```

**2. Controller** (`controllers/admin/getSubmodulePage.js`):
```javascript
const getSubmodulePage = asyncHandler(async (req, res) => {
  // Load data dengan cache
  const result = await handleCache({
    key: "admin:submodule:data",
    ttl: 300,
    dbQueryFn: async () => {
      // Query database
      return { data };
    },
  });

  res.render("pages/admin/submodule", {
    data: result.data,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});
```

**3. View** (`views/pages/admin/submodule.njk`):
```html
{% extends "layout/masterLayout.njk" %}

{% block title %}Sub-Module{% endblock %}

{% block content %}
<div class="container-fluid">
  <h1>Sub-Module</h1>
  <!-- Content di sini -->
</div>
{% endblock %}
```

**4. Knowledge Base** (`knowledge/admin/submodule/en.md`):
- Dokumentasikan fitur dan penggunaan
- Tambah tabel quick actions
- Include skenario umum
- Sediakan panduan troubleshooting

## Konfigurasi Permission

### Permission yang Diperlukan

Buat permission untuk sub-module:
```
Permission Name: view_submodule
Description: Access to sub-module features
```

**Assign ke Roles:**
1. Ke [/admin/permissions](/admin/permissions)
2. Buat permission `view_submodule`
3. Ke [/admin/roles](/admin/roles)
4. Assign ke roles yang sesuai (Admin, Manager, dll.)

## Use Case Umum

### Use Case 1: Module Spesifik Departemen

**Contoh:** Departemen HR perlu area dedicated

**Implementasi:**
- Buat sub-module `/admin/hr`
- Tambah permission `view_hr`
- Assign ke role "HR Manager"
- Bangun fitur spesifik HR

### Use Case 2: Section Spesifik Fitur

**Contoh:** Modul reporting

**Implementasi:**
- Buat sub-module `/admin/reports`
- Tambah fitur generasi report
- Integrasi dengan data export
- Cache hasil report

### Use Case 3: Admin Tool

**Contoh:** System maintenance tools

**Implementasi:**
- Buat sub-module `/admin/tools`
- Tambah permission `manage_tools` (Admin only)
- Include operasi maintenance
- Log semua penggunaan tool

## Titik Integrasi

### Navigasi

Tambah sub-module ke sidebar (`views/partials/sidebarLayout.njk`):

```html
{% if hasPermission(permissions, 'view_submodule') %}
  <li class="nav-item">
    <a class="nav-link" href="/admin/submodule">
      <i class="fas fa-cube"></i>
      <span>Sub-Module</span>
    </a>
  </li>
{% endif %}
```

### Breadcrumbs

Include navigasi breadcrumb:

```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="/admin">Dashboard</a></li>
    <li class="breadcrumb-item active">Sub-Module</li>
  </ol>
</nav>
```

## Best Practices

### Desain Sub-Module

✅ **Praktik Bagus:**
- Tujuan yang jelas dan spesifik
- Cek permission dedicated
- Loading data dengan cache
- Activity logging
- Desain mobile-responsive
- Konsisten dengan UI admin

❌ **Hindari:**
- Mencampur fitur yang tidak terkait
- Tidak ada cek permission
- Query database langsung
- Tidak ada error handling
- Merusak konsistensi UI admin

### Performa

✅ **Optimasi:**
- Gunakan Redis caching
- Server-side DataTables
- Lazy load komponen berat
- Compress responses
- Index database queries

### Keamanan

✅ **Amankan:**
- Require authentication
- Cek permissions
- Validasi semua inputs
- Sanitize outputs
- Log operasi sensitif
- Gunakan CSRF protection

## Checklist Testing

### Testing Sub-Module

- [ ] Route accessible dengan permission yang benar
- [ ] 403 error tanpa permission
- [ ] Halaman load dengan benar
- [ ] Data ditampilkan dengan proper
- [ ] Forms submit sukses
- [ ] CSRF tokens bekerja
- [ ] Cache invalidation bekerja
- [ ] Mobile responsive
- [ ] Error handling bekerja
- [ ] Activity logging aktif

## Persyaratan Dokumentasi

### File Knowledge Base

Untuk setiap sub-module, buat:

**English** (`knowledge/admin/submodule/en.md`):
- Overview dan tujuan
- Tabel quick actions
- Dokumentasi fitur
- Skenario umum
- Panduan troubleshooting

**Indonesian** (`knowledge/admin/submodule/id.md`):
- Konten diterjemahkan
- Pertahankan istilah teknis dalam English
- Maintain struktur markdown

## Halaman Terkait

| Halaman | Tujuan |
|---------|--------|
| **Dashboard** | [/admin](/admin) - Main admin area |
| **Permissions** | [/admin/permissions](/admin/permissions) - Permission management |
| **Roles** | [/admin/roles](/admin/roles) - Konfigurasi role |
| **Activity Logs** | [/admin/log](/admin/log) - Audit operasi |

## Contoh Sub-Modules

### Sub-Modules yang Ada

| Route | Tujuan |
|-------|---------|
| `/admin/user/*` | Operasi management user |
| `/admin/queue/*` | Management job queue |
| `/admin/cache/*` | Operasi cache |
| `/admin/log/*` | Melihat activity log |

### Potensi Sub-Modules Baru

- `/admin/reports` - Reporting dan analytics
- `/admin/settings` - Konfigurasi sistem
- `/admin/backup` - Backup dan restore
- `/admin/audit` - Security audit logs
- `/admin/notifications` - Management notifikasi

## Development Notes

Halaman ini mendemonstrasikan:
- **Routing patterns**: Nested admin routes
- **Permission integration**: Role-based access
- **UI consistency**: Mengikuti template admin
- **Documentation**: Integrasi knowledge base
- **Scalability**: Mudah untuk tambah modul baru

**Template Status:** Ready untuk implementasi
**Knowledge Base:** Complete (en.md, id.md)
**Route Example:** `/admin/submodule`
