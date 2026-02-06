# Manajemen Permissions ([/admin/permissions](/admin/permissions))

Fitur **Manajemen Permissions** memungkinkan Admin untuk membuat, melihat, dan mengelola izin individual dalam sistem Omniflow. Permissions adalah blok bangunan dari sistem RBAC (Role-Based Access Control).

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat semua permissions | Buka [/admin/permissions](/admin/permissions) |
| Buat permission baru | Klik tombol **"+ Add Permission"** |
| Edit permission | Klik kartu permission → **Edit** |
| Hapus permission | Klik kartu permission → **Delete** (jika tidak diberikan ke role) |
| Berikan ke role | Buka [/admin/roles](/admin/roles) |

## Permissions Bawaan

| Nama Permission | Deskripsi | Assignment Default |
|----------------|-----------|-------------------|
| `view_users` | Melihat akun dan informasi pengguna | Admin, Manager |
| `manage_users` | Membuat, edit, dan hapus akun pengguna | Admin, Manager |
| `manage_permissions` | Mengelola sistem roles dan permissions | Admin saja |
| `view_logs` | Melihat log aktivitas sistem dan audit trail | Admin, Manager |
| `manage_cache` | Mengelola cache sistem dan performa | Admin |
| `manage_queue` | Mengelola job queues dan background tasks | Admin |
| `view_profile` | Melihat dan edit profil pengguna sendiri | Semua role |

## Konvensi Penamaan Permission

### Prefix Standar

| Prefix | Tujuan | Contoh |
|--------|---------|--------|
| `view_` | Akses read-only | `view_users`, `view_logs`, `view_reports` |
| `manage_` | Akses CRUD penuh | `manage_users`, `manage_cache`, `manage_queue` |
| `approve_` | Workflow persetujuan | `approve_requests`, `approve_transactions` |
| `export_` | Operasi ekspor data | `export_users`, `export_reports` |
| `delete_` | Operasi penghapusan | `delete_users`, `delete_records` |

### Best Practices

✅ **Nama Bagus:**
- `view_financial_reports`
- `manage_inventory`
- `approve_leave_requests`
- `export_employee_data`

❌ **Nama Buruk:**
- `financial` (terlalu vague)
- `all_access` (merusak tujuan RBAC)
- `admin_permission` (scope tidak jelas)

## Membuat Permission Baru

1. Buka **[Manajemen Permissions](/admin/permissions)**
2. Klik tombol **"+ Add Permission"**
3. Isi formulir:
   - **Permission Name**: Gunakan underscore_case (contoh: `view_reports`)
   - **Description**: Penjelasan singkat apa yang diizinkan permission ini
4. Klik **Save**
5. **Langkah Berikutnya**: Berikan ke roles di [/admin/roles](/admin/roles)

### Contoh: Membuat Permission Khusus Departemen

**Skenario:** Departemen HR perlu akses ke data karyawan

```
Permission Name: view_employee_records
Description: Melihat informasi personal dan records karyawan
```

Kemudian berikan ke role "HR Manager" di [/admin/roles](/admin/roles).

## Hubungan Permission vs Role

### Konsep Kunci

- **Permissions**: Hak akses atomik (contoh: `view_users`)
- **Roles**: Kumpulan permissions (contoh: "Manager" punya `view_users` + `manage_users`)
- **Users**: Diberikan SATU role, mewarisi semua permissions role
- **Overrides**: Users bisa punya grant atau revoke permission individual (PBAC)

### Alur Permission

```
Permission → Role → User → Akses Diberikan
```

**Contoh:**
1. Buat permission `manage_reports`
2. Berikan ke role "Report Manager" di [/admin/roles](/admin/roles)
3. Berikan users ke role "Report Manager" di [/admin/users](/admin/users)
4. Users sekarang bisa manage reports

## User Permission Overrides (PBAC)

Sistem mendukung **override permission khusus user** yang memperluas atau membatasi permissions role:

### Grant Additional Permissions

Berikan user tertentu extra permissions di luar role mereka:

1. Buka [/admin/users](/admin/users)
2. Klik user → **Manage Permissions**
3. Aktifkan additional permissions yang tidak ada di role mereka
4. **Hasil**: User dapat role permissions + additional permissions

**Contoh:**
- Manager role punya: `view_users`, `manage_users`, `view_logs`
- Grant `manage_cache` ke manager tertentu
- Final permissions: `view_users`, `manage_users`, `view_logs`, `manage_cache`

### Revoke Role Permissions

Hapus permissions tertentu dari user tanpa mengubah role mereka:

1. Buka [/admin/users](/admin/users)
2. Klik user → **Manage Permissions**
3. Non-aktifkan permissions role tertentu
4. **Hasil**: User kehilangan permission tersebut meskipun role mereka punya

**Contoh:**
- Manager role punya: `view_users`, `manage_users`, `view_logs`
- Revoke `manage_users` dari manager tertentu
- Final permissions: `view_users`, `view_logs`

### Formula Override

```
Final User Permissions = (Role Permissions + User Grants) - User Revokes
```

### Kapan Menggunakan Overrides

✅ **Use Case Bagus:**
- Akses elevated sementara
- Periode training/probation
- Kontraktor dengan scope terbatas
- Anggota tim cross-functional

❌ **Use Case Buruk:**
- Pola akses permanen (buat role baru)
- Multiple users perlu override sama (ubah role)
- Pengecualian security (perbaiki security policy)

## Edit Permissions

### Ubah Detail Permission

1. Klik kartu permission di [/admin/permissions](/admin/permissions)
2. Klik **Edit**
3. Update name atau description
4. Klik **Save**

⚠️ **Peringatan:** Mengubah nama permission mempengaruhi semua roles dan users yang menggunakannya.

### Cek Penggunaan Permission

Sebelum edit, lihat dimana permission digunakan:

1. Klik kartu permission
2. Lihat count **"Used by X roles"**
3. Klik untuk lihat daftar role
4. Navigasi ke [/admin/roles](/admin/roles) untuk review

## Hapus Permissions ⚠️

### Pre-Delete Checklist

Sebelum hapus permission:

1. Cek roles yang menggunakan permission ini di [/admin/roles](/admin/roles)
2. Cek users dengan override grants di [/admin/users](/admin/users)
3. Hapus dari semua roles dulu
4. Hapus semua user overrides
5. Baru hapus permission

### Cara Hapus

1. Buka [/admin/permissions](/admin/permissions)
2. Klik kartu permission → **Delete**
3. Konfirmasi penghapusan

### Aturan Security

- ❌ Tidak bisa hapus jika diberikan ke role manapun
- ❌ Tidak bisa hapus jika ada user dengan override grant/revoke
- ✅ Permission yang dihapus dihilangkan dari sistem permanen
- ⚠️ Tidak ada undo - penghapusan permanen

## Skenario Umum

### Skenario 1: Fitur Baru Perlu Access Control

**Masalah:** Buat fitur "Reports" baru, perlu kontrol akses

**Solusi:**
1. Buat permissions di [/admin/permissions](/admin/permissions):
   - `view_reports` (read-only)
   - `manage_reports` (akses penuh)
2. Buka [/admin/roles](/admin/roles)
3. Berikan `view_reports` ke role "User"
4. Berikan `manage_reports` ke role "Manager"

### Skenario 2: Akses Project Sementara

**Masalah:** Developer perlu akses cache sementara untuk debugging

**Solusi:**
1. Buka [/admin/users](/admin/users)
2. Cari developer → **Manage Permissions**
3. Grant permission `manage_cache`
4. Setelah debugging, revoke permission override
5. **Hasil**: Akses sementara tanpa mengubah role mereka

### Skenario 3: Restrukturisasi Departemen

**Masalah:** Tim Finance sekarang mengelola inventory

**Solusi:**
1. Buat permissions di [/admin/permissions](/admin/permissions):
   - `view_inventory`
   - `manage_inventory`
2. Buka [/admin/roles](/admin/roles)
3. Cari role "Finance" → **Manage Permissions**
4. Tambahkan inventory permissions
5. Semua user tim Finance dapat akses instant

### Skenario 4: Kontraktor dengan Scope Terbatas

**Masalah:** Kontraktor eksternal perlu view user tapi bukan data sensitif

**Solusi:**
1. Buat role "Contractor" di [/admin/roles](/admin/roles)
2. Berikan hanya `view_users` dan `view_profile`
3. Jika kontraktor perlu exception, gunakan permission overrides
4. Saat kontrak berakhir, non-aktifkan akun user

## Troubleshooting

| Issue | Solusi |
|-------|--------|
| Permission tidak ada di role | Buka [/admin/roles](/admin/roles) → Manage Permissions → Tambahkan |
| User punya permission tapi tidak bisa akses | Cek apakah akun user aktif di [/admin/users](/admin/users) |
| Tidak bisa hapus permission | Hapus dari semua roles dan user overrides dulu |
| Perubahan permission tidak bekerja | User mungkin perlu logout dan login lagi |
| Terlalu banyak permissions | Pertimbangkan buat kategori/grup permission |
| Override tidak berlaku | Cek activity logs di [/admin/log](/admin/log) untuk errors |

## Arsitektur Sistem Permission

### Integrasi Cache

- Permission lookups di-cache di Redis untuk 5 menit
- Pattern cache key: `user:{userId}:permissions`
- Perubahan invalidate cache otomatis
- Lihat cache stats di [/admin/cache/stats](/admin/cache/stats)

### Activity Logging

Semua perubahan permission di-log:

- Pembuatan/penghapusan permission
- Assignment permission ke role
- User permission overrides (grants/revokes)
- Lihat logs di [/admin/log](/admin/log)

### Tabel Database

- `permissions` - Semua system permissions
- `role_permissions` - Mapping role-ke-permission
- `user_permissions` - User-specific overrides (grants/revokes)
- Soft deletes enabled untuk permissions (bisa di-restore)
