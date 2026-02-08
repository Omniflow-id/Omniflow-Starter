# Activity Logs ([/admin/log/index](/admin/log/index))

Halaman **Activity Logs** menyediakan audit trail lengkap atas semua aktivitas yang terjadi di sistem Omniflow.

## Fitur Utama

### 1. Daftar Log Aktivitas
Tabel lengkap dengan kolom:
- **Timestamp**: Waktu kejadian
- **User**: Siapa yang melakukan aksi
- **Action**: Jenis aktivitas (CREATE, UPDATE, DELETE, LOGIN, dll)
- **Module**: Area sistem yang terkena
- **Details**: Detail tambahan dalam format JSON
- **IP Address**: IP address user (untuk audit keamanan)

### 2. Filter & Search

**Filter Berdasarkan:**
- **Date Range**: Dari tanggal - Sampai tanggal
- **User**: Pilih user spesifik
- **Action Type**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ERROR
- **Module**: Users, Permissions, Queue, Cache, dll

**Search:**
- Cari berdasarkan deskripsi aktivitas
- Cari di detail JSON

### 3. Export Log

**Format Export:**
- **CSV**: Untuk analisis di Excel
- **JSON**: Untuk integrasi sistem lain
- **PDF**: Untuk laporan audit

**Filtered Export:**
- Export hanya hasil filter yang aktif
- Berguna untuk compliance reporting

## Tipe Aktivitas

| Action | Deskripsi | Contoh |
|--------|-----------|--------|
| **CREATE** | Pembuatan data baru | Tambah user, buat role |
| **UPDATE** | Perubahan data | Edit user, update permission |
| **DELETE** | Penghapusan data | Hapus user, soft delete |
| **LOGIN** | User login ke sistem | Admin login dari IP x.x.x.x |
| **LOGOUT** | User logout | Session ended |
| **ERROR** | Error/exception | Failed login attempt |
| **VIEW** | Akses baca data | Lihat detail user |

## Modul yang Dilacak

- **users**: Aktivitas manajemen user
- **permissions**: Perubahan permission & role
- **queue**: Job queue operations
- **cache**: Cache flush/invalidate
- **ai**: Penggunaan fitur AI (Chat, Assistant, Copilot)
- **system**: Konfigurasi sistem

## Detail Metadata

Klik row log untuk melihat detail JSON lengkap:
```json
{
  "user_id": 7,
  "username": "admin",
  "action": "UPDATE",
  "module": "users",
  "record_id": 15,
  "changes": {
    "old": { "role": "User" },
    "new": { "role": "Manager" }
  },
  "ip_address": "192.168.1.100"
}
```

## Use Case Audit

### Investigasi Keamanan
**Skenario:** Ada aktivitas mencurigakan

**Langkah:**
1. Filter user yang dicurigai
2. Filter date range kejadian
3. Cek action LOGIN dari IP tidak dikenal
4. Cek perubahan permission/role
5. Export log untuk evidence

### Compliance Report
**Skenario:** Butuh laporan audit bulanan

**Langkah:**
1. Set date range bulan lalu
2. Filter critical actions (CREATE, DELETE)
3. Filter module sensitif (permissions, users)
4. Export ke PDF
5. Submit ke auditor

### Troubleshooting
**Skenario:** Data berubah tapi tidak tahu siapa

**Langkah:**
1. Search berdasarkan record_id
2. Filter module terkait
3. Cek action UPDATE/DELETE
4. Lihat detail siapa user yang melakukan
5. Cek timestamp untuk timeline

## Retensi & Cleanup

**Default Retention:**
- Logs disimpan selama 90 hari
- Auto-cleanup job berjalan setiap minggu
- Archive ke cold storage (jika dikonfigurasi)

**Manual Cleanup:**
- Admin dengan permission `manage_logs` bisa manual cleanup
- Filter date range lama → Delete
- Atau export dulu sebelum delete

## Permission

| Permission | Akses |
|------------|-------|
| `view_logs` | Melihat daftar log |
| `export_logs` | Export log data |
| `manage_logs` | Cleanup/archive logs |

## Best Practices

### Audit Trail
✅ **Selalu aktifkan logging untuk:**
- Perubahan permission
- CRUD user
- Perubahan konfigurasi sistem
- Akses data sensitif

### Review Rutin
✅ **Jadwalkan review log:**
- Daily: Cek error/exception
- Weekly: Review failed logins
- Monthly: Audit permission changes

### Keamanan
⚠️ **Penting:**
- Log tidak bisa dihapus oleh user biasa
- Super admin bisa melihat semua log
- Export log berisi data sensitif → handle dengan hati-hati

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Log tidak muncul | Cek filter yang aktif, clear filter |
| Export gagal | Cek ukuran data, coba filter lebih spesifik |
| Detail JSON error | Cek di browser console, refresh halaman |
| Performance lambat | Gunakan date range lebih kecil |

## Link Terkait

- [Users](/admin/users) - Manajemen user
- [Permissions](/admin/permissions) - Konfigurasi permission
- [Queue](/admin/queue) - Background jobs
