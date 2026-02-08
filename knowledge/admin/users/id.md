# Manajemen User ([/admin/users](/admin/users))

Halaman **Manajemen User** adalah pusat kontrol untuk mengelola akun pengguna sistem Omniflow.

## Fitur Utama

### 1. Daftar User
Tabel lengkap dengan informasi:
- **ID**: Identifikasi unik user
- **Username**: Nama login user
- **Email**: Alamat email terdaftar
- **Full Name**: Nama lengkap user
- **Role**: Peran/level akses (Admin, Manager, User)
- **Status**: Aktif/Non-aktif
- **Last Login**: Waktu login terakhir
- **Created At**: Tanggal pembuatan akun

### 2. Tambah User Baru

**Cara Manual:**
1. Klik tombol **"Tambah User"**
2. Isi form:
   - Username (unik)
   - Email (valid & unik)
   - Full Name
   - Password (atau auto-generate)
   - Role
3. Klik **Simpan**

**Password Auto-Generate:**
- Sistem akan generate password random
- Password ditampilkan sekali saat pembuatan
- User wajib ganti password saat pertama login

### 3. Edit User

**Data yang Bisa Diedit:**
- Email
- Full Name
- Role
- Status (Aktif/Non-aktif)
- Password (reset)

**Cara Edit:**
1. Klik icon **Edit** di baris user
2. Ubah data yang diperlukan
3. Klik **Simpan**

### 4. Reset Password

**Cara Reset:**
1. Klik **Edit** user
2. Klik tombol **"Reset Password"**
3. Pilih:
   - **Auto-generate**: Sistem buat password baru
   - **Manual**: Admin input password baru
4. Password baru ditampilkan (copy & kirim ke user)

### 5. Toggle Status Aktif

**Nonaktifkan User:**
1. Klik toggle switch di kolom Status
2. Konfirmasi nonaktivasi
3. User tidak bisa login lagi

**Aktifkan Kembali:**
1. Klik toggle switch
2. User bisa login lagi dengan credential yang sama

### 6. Hapus User (Soft Delete)

**Cara Hapus:**
1. Klik icon **Hapus** (tempat sampah)
2. Konfirmasi penghapusan
3. User di-soft delete (bisa direstore)

**Note:** Data user tidak benar-benar hilang, hanya ditandai deleted.

### 7. Import Bulk via Excel

**Template Download:**
1. Klik **"Download Template"**
2. Isi template dengan data user
3. Upload file Excel

**Kolom Template:**
- username (wajib, unik)
- email (wajib, valid)
- full_name (wajib)
- password (opsional, kosong = auto-generate)
- role (wajib: Admin/Manager/User)
- is_active (1 atau 0)

**Validasi Import:**
- Cek duplikat username/email
- Validasi format email
- Password minimal 8 karakter (jika manual)
- Role harus valid

### 8. Export Data

**Export Options:**
- **CSV**: Untuk import ke sistem lain
- **Excel**: Format yang bisa diedit
- **JSON**: Untuk integrasi API

**Filtered Export:**
- Export hanya data yang difilter
- Contoh: Export hanya user aktif saja

## Filter & Search

### Search Box
Cari berdasarkan:
- Username
- Email
- Full Name

### Filter Kolom
- **Role**: Filter per role
- **Status**: Aktif/Non-aktif/Semua
- **Date Range**: Tanggal pembuatan akun

### Sorting
Klik header kolom untuk sort:
- ID (asc/desc)
- Username (A-Z/Z-A)
- Created At (terbaru/terlama)
- Last Login (aktif/tidak)

## Permission yang Diperlukan

| Permission | Deskripsi |
|------------|-----------|
| `view_users` | Melihat daftar user |
| `manage_users` | CRUD operasi user |
| `manage_permissions` | Ubah permission user |

## Best Practices

### Keamanan
✅ **Selalu:**
- Gunakan password auto-generate untuk user baru
- Wajibkan user ganti password saat pertama login
- Nonaktifkan (bukan hapus) user yang resign
- Audit log perubahan permission

❌ **Jangan:**
- Beritahu password user lain ke siapapun
- Biarkan user tanpa role
- Hapus permanen user dengan data penting

### Manajemen
✅ **Direkomendasikan:**
- Review user aktif bulanan
- Disable user yang >90 hari tidak login
- Assign role sesuai job function
- Dokumentasikan perubahan permission

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| User tidak bisa login | Cek status aktif & password |
| Email sudah terdaftar | Gunakan email lain atau reset user lama |
| Role tidak muncul | Cek konfigurasi di halaman Roles |
| Import gagal | Cek format Excel & validasi error message |
| Password reset tidak berfungsi | Pastikan email server berjalan |

## Link Terkait

- [Roles](/admin/roles) - Konfigurasi role & permission
- [Overview](/admin/overview) - Statistik user
- [Activity Logs](/admin/log) - Audit aktivitas user
