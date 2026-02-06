# Role Management ([/admin/roles](/admin/roles))

Fitur **Role Management** memungkinkan Admin untuk mengelola level akses pengguna dalam sistem Omniflow menggunakan Role-Based Access Control (RBAC).

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat semua role | Ke [/admin/roles](/admin/roles) |
| Buat role baru | Klik tombol **"Add Role"** |
| Edit permissions | Klik role → **Manage Permissions** |
| Hapus role | Klik role → Delete (jika tidak ada user) |

## Default Roles

| Role | Deskripsi | Tidak Bisa Dihapus |
|------|-----------|-------------------|
| **Admin** | Akses penuh sistem | ✓ Dikunci |
| **Manager** | User management + monitoring | ✗ |
| **User** | Akses profil dasar saja | ✗ |

## Membuat Role Baru

1. Akses **[Roles Management](/admin/roles)**
2. Klik tombol **"+ Add Role"**
3. Isi form:
   - **Role Name**: Nama unik (contoh: "HR Manager", "Keuangan")
   - **Description**: Tujuan singkat role ini
4. Klik **Save** → Role dibuat dengan permission KOSONG
5. **Penting**: Assign permissions segera setelah dibuat

## Mengelola Permissions

Setelah membuat role, Anda perlu assign permissions:

1. Klik role di [/admin/roles](/admin/roles)
2. Klik tombol **"Manage Permissions"**
3. Pilih permissions dari list:
   - `view_users` - Lihat daftar user
   - `manage_users` - CRUD users + reset password
   - `manage_permissions` - Konfigurasi roles
   - `view_logs` - Baca log aktivitas
   - `manage_cache` - Flush Redis cache
   - `manage_queue` - Manage job queues
   - `view_profile` - Lihat profil sendiri
4. Klik **Save Permissions**

## Referensi Permissions

| Permission | Deskripsi | Kegunaan |
|------------|-----------|----------|
| `view_users` | Lihat akun user | Butuh untuk Manager |
| `manage_users` | CRUD users | Tugas HR/Admin |
| `manage_permissions` | Konfigurasi roles | Super admin only |
| `view_logs` | Baca riwayat aktivitas | Audit & monitoring |
| `manage_cache` | Flush Redis cache | Operasi teknis |
| `manage_queue` | Manage job queues | Background jobs |
| `view_profile` | Lihat profil sendiri | Semua user butuh |

## Contoh Kombinasi Role

**HR Manager:**
- `view_users`
- `manage_users`
- `view_profile`

**Keuangan:**
- `view_users`
- `view_profile`
- (tambahkan permissions finance spesifik)

**Staff Support:**
- `view_users`
- `view_logs`
- `view_profile`

## Mengedit Role

### Ubah Nama/Deskripsi Role
1. Klik role di [/admin/roles](/admin/roles)
2. Klik **Edit**
3. Update fields
4. **Catatan**: Assignment permissions tetap tidak berubah

### Ubah Permissions
1. Klik role
2. Klik **Manage Permissions**
3. Tambah/hapus permissions
4. **Catatan**: Perubahan langsung berlaku untuk semua user dengan role ini

## Menghapus Role ⚠️

**Sebelum Menghapus:**
1. Cek apakah ada user yang di-assign role ini di [/admin/users](/admin/users)
2. Reassign user ke role lain dulu
3. Hapus hanya jika TIDAK ADA user dengan role ini

**Cara Hapus:**
1. Klik role
2. Klik **Delete**
3. Konfirmasi penghapusan

**Aturan Keamanan:**
- ❌ Role **Admin** (ID 1) TIDAK BISA dihapus
- ❌ Tidak bisa hapus role jika ada user assigned
- ✅ Permissions role yang dihapus dihapus dari semua user

## Skenario Umum

### Skenario 1: Dept Baru Butuh Akses
**Masalah:** Tim Finance butuh akses data user
**Solusi:**
1. Buat role "Finance" di [/admin/roles](/admin/roles)
2. Assign permissions `view_users`, `view_profile`
3. Tambah user finance ke role ini di [/admin/users](/admin/users)

### Skenario 2: Manager Butuh Permissions Ekstra
**Masalah:** Manager perlu lihat logs
**Solusi:**
1. Ke [/admin/roles](/admin/roles)
2. Klik role Manager → Manage Permissions
3. Tambah permission `view_logs`
4. Save

### Skenario 3: Cabut Akses Cepat
**Masalah:** Karyawan resign hari ini
**Solusi:**
1. Ke [/admin/users](/admin/users)
2. Cari user → Edit
3. Set "Active" ke OFF
4. User langsung kehilangan akses

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| User tidak bisa akses fitur | Cek permissions role di [/admin/roles](/admin/roles) |
| Terlalu banyak permissions | Hapus permissions yang tidak perlu dari role |
| Admin terkunci | Hubungi system administrator |
| Permissions tidak berlaku | User mungkin perlu login ulang |
