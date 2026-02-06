# User Overview ([/admin/overview](/admin/overview))

Halaman **User Overview** menyediakan insight statistik dan analytics tentang akun user di sistem Omniflow.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat statistik user | Ke [/admin/overview](/admin/overview) |
| Lihat semua users | Ke [/admin/users](/admin/users) |
| Kelola roles | Ke [/admin/roles](/admin/roles) |
| Cek activity logs | Ke [/admin/log](/admin/log) |

## Notice Route Collision

⚠️ **Penting:** Halaman ini melayani **dua routes**:
- `/admin/overview` - Module overview
- `/admin/user/overview` - Statistik user-specific

Kedua routes menampilkan konten statistik user yang sama. Ini adalah route collision yang diketahui di sistem.

## Dashboard Statistik User

### Metrik Total User

| Metrik | Deskripsi |
|--------|-----------|
| **Total Users** | Semua akun user di sistem |
| **Active Users** | Users dengan `is_active = true` |
| **Inactive Users** | Users dengan `is_active = false` |
| **New This Month** | Users dibuat di bulan saat ini |

### Distribusi Role

**Jumlah User per Role:**
- **Admin**: Users dengan akses penuh sistem
- **Manager**: Users dengan akses mid-level
- **User**: Users dengan akses basic
- **Custom Roles**: Roles spesifik departemen

### Breakdown Status Akun

**Active vs Inactive:**
- Persentase akun active
- Jumlah akun inactive
- Trend aktivasi/deaktivasi terbaru

## Visualisasi Statistik

### Chart yang Direkomendasikan

**User Growth Chart (Line Chart):**
- X-axis: Bulan
- Y-axis: User baru
- Menampilkan trend registrasi user bulanan

**Role Distribution (Pie Chart):**
- Segments: Setiap role
- Percentages: Distribusi di seluruh roles
- Colors: Admin (red), Manager (yellow), User (blue)

**Active Status (Doughnut Chart):**
- Inner: Active count
- Outer: Inactive count
- Percentages: Rasio active vs inactive

### Integrasi Chart.js

Halaman menggunakan Chart.js untuk visualisasi data:

```javascript
// Contoh: User growth chart
const ctx = document.getElementById('userGrowthChart').getContext('2d');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Users',
      data: [12, 19, 8, 15, 22, 18],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }
});
```

## Konteks Module Overview

### Apa itu Module Overview?

Karena halaman ini juga melayani `/admin/overview`, ini menyediakan:
- Statistik dan insights **modul user**
- Summary high-level management user
- Navigasi cepat ke halaman terkait
- Dashboard metrik kunci

### Modul Terkait

| Modul | Halaman Overview |
|-------|------------------|
| Users | `/admin/overview` (halaman ini) |
| Logs | `/admin/log` |
| Queue | `/admin/queue` |
| Cache | `/admin/cache/stats` |
| Permissions | `/admin/roles` |

## Skenario Umum

### Skenario 1: Audit User Bulanan

**Cara Review:**
1. Ke [/admin/overview](/admin/overview)
2. Cek jumlah **Total Users**
3. Review rasio **Active vs Inactive**
4. Catat jumlah **New This Month**
5. Bandingkan dengan bulan sebelumnya
6. Dokumentasi untuk compliance

### Skenario 2: Analisis Distribusi Role

**Cara Analisis:**
1. Lihat chart distribusi role
2. Identifikasi roles yang tidak seimbang:
   - Terlalu banyak Admins → Risiko keamanan
   - Terlalu sedikit Managers → Bottleneck
   - Jumlah custom role tidak biasa
3. Navigasi ke [/admin/roles](/admin/roles) untuk detail
4. Review assignment role di [/admin/users](/admin/users)

### Skenario 3: Cleanup Akun Inactive

**Proses Cleanup:**
1. Catat jumlah **Inactive Users**
2. Navigasi ke [/admin/users](/admin/users)
3. Filter atau identifikasi akun inactive
4. Review tanggal last login (jika tersedia)
5. Deaktivasi atau hapus akun yang tidak digunakan
6. Kembali ke overview untuk verifikasi reduction

### Skenario 4: Monitoring Pertumbuhan

**Review Bulanan:**
1. Cek metrik **New This Month**
2. Bandingkan dengan target (contoh: 50 user baru/bulan)
3. Jika di bawah target:
   - Review proses onboarding
   - Cek keberhasilan bulk import
   - Verifikasi ketersediaan registration
4. Jika di atas target:
   - Verifikasi signup legitimate
   - Cek untuk bulk imports
   - Review kapasitas sistem

## Konteks Statistik

### Integrasi Cache

Statistik user di-cache:
- **Cache Key**: `admin:user:overview` atau `admin:overview`
- **TTL**: 5 menit
- **Invalidation**: Setelah operasi CRUD user

**Lihat Performa Cache:** [/admin/cache/stats](/admin/cache/stats)

### Sumber Data

**Query Database:**
```sql
-- Total users
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL

-- Active users
SELECT COUNT(*) FROM users WHERE is_active = true AND deleted_at IS NULL

-- New this month
SELECT COUNT(*) FROM users
WHERE created_at >= FIRST_DAY_OF_MONTH
AND deleted_at IS NULL

-- Distribusi role
SELECT role, COUNT(*) FROM users
WHERE deleted_at IS NULL
GROUP BY role
```

### Activity Logging

Operasi user di-log:
- Pembuatan user
- Aktivasi/deaktivasi akun
- Perubahan role
- Penghapusan user

**Lihat Logs:** [/admin/log](/admin/log)

## Troubleshooting

| Masalah | Cek | Solusi |
|---------|-----|--------|
| Statistik tidak loading | Status cache | Clear cache di [/admin/cache/stats](/admin/cache/stats) |
| Jumlah terlihat salah | Soft deletes | Verifikasi filter `deleted_at IS NULL` |
| Jumlah user baru salah | Timezone | Cek konfigurasi timezone server |
| Distribusi role hilang | Database query | Verifikasi tabel roles populated |
| Chart tidak render | Browser console | Cek library Chart.js loaded |

## Pertimbangan Performa

### Optimasi Query

Query statistik:
- **Indexed**: Query COUNT cepat pada status fields
- **Cached**: TTL 5 menit untuk akses berulang
- **Lightweight**: Hanya aggregate counts, tidak ada data user

### Manfaat Cache

- **Response Time**: < 5ms (cached) vs 50-100ms (database)
- **Database Load**: Berkurang 95% saat traffic tinggi
- **Scalability**: Menangani ribuan concurrent views

## Best Practices

### Monitoring Rutin

✅ **Mingguan:**
- Review total user count
- Cek rasio active/inactive
- Monitor trend user baru
- Verifikasi distribusi role

✅ **Bulanan:**
- Audit akun inactive
- Review metrik pertumbuhan
- Bandingkan dengan business targets
- Dokumentasi untuk reporting

### Alert Threshold

Set up monitoring untuk:
- **Rasio inactive > 30%** - Terlalu banyak akun inactive
- **User baru = 0** - Masalah registration
- **Jumlah admin > 10** - Review keamanan diperlukan
- **Total users > kapasitas** - Scale infrastructure

### Integrasi dengan Reporting

Gunakan statistik overview untuk:
- **Management Reports**: KPI bulanan
- **Compliance Audits**: Tracking akun user
- **Capacity Planning**: Proyeksi pertumbuhan
- **Security Reviews**: Analisis distribusi role

## Halaman Terkait

| Halaman | Tujuan | Link |
|---------|--------|------|
| **User Management** | Operasi CRUD | [/admin/users](/admin/users) |
| **Role Management** | Konfigurasi role | [/admin/roles](/admin/roles) |
| **Activity Logs** | Audit operasi user | [/admin/log](/admin/log) |
| **Cache Stats** | Monitoring performa | [/admin/cache/stats](/admin/cache/stats) |

## Future Enhancements

### Potensi Penambahan

- **Login Frequency Chart**: Track user engagement
- **Last Login Dates**: Identifikasi akun dormant
- **Registration Trends**: Pattern signup harian/mingguan
- **Permission Usage**: Permissions paling/paling sedikit digunakan
- **Department Breakdown**: Distribusi user per departemen
- **Export Functionality**: Download statistik sebagai CSV/Excel
