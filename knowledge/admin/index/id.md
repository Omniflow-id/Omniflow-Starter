# Dashboard & Fitur Sistem Omniflow

Selamat datang di **Omniflow Advanced ERP**. Dashboard ini adalah pusat kendali untuk mengelola seluruh aspek sistem.

## Navigasi Cepat

| Menu | Route | Deskripsi |
|------|-------|-----------|
| [Dashboard](/admin) | `/admin` | Halaman utama dashboard |
| [Users](/admin/users) | `/admin/users` | Mengelola user aplikasi |
| [Roles](/admin/roles) | `/admin/roles` | Mengelola role & permissions |
| [Permissions](/admin/permissions) | `/admin/permissions` | Konfigurasi akses |
| [AI Management](#ai-management) | `/admin/ai_models` | Manajemen AI features |
| [Cache](/admin/cache) | `/admin/cache` | Monitor Redis cache |
| [Queue](/admin/queue) | `/admin/queue` | Monitor background jobs |
| [Logs](/admin/logs) | `/admin/logs` | Lihat log aktivitas sistem |
| [Profile](/admin/profile) | `/admin/profile` | Kelola profil Anda |

## AI Management (Baru!)

Sistem dilengkapi dengan **4 fitur AI** yang saling terintegrasi:

### 1. AI Models ([/admin/ai_models](/admin/ai_models))
Konfigurasi model AI (OpenAI, API key, model variant).

### 2. AI Use Cases ([/admin/ai_use_cases](/admin/ai_use_cases))
Setup use cases dan knowledge base untuk AI Chat.

### 3. AI Analysis Settings ([/admin/ai_analysis_settings](/admin/ai_analysis_settings))
Pengaturan global untuk AI Assistant & AI Copilot:
- Model default
- Max tokens & temperature
- Enable context features

### 4. AI Chat ([/admin/chat](/admin/chat))
Interface percakapan AI berbasis web dengan riwayat.

### AI Assistant (Sidebar 🤖)
Tombol **biru** di pojok kanan bawah - bantuan cepat context-aware.

### AI Copilot (FAB ✨)
Tombol **ungu** di pojok kanan bawah - analisis layar real-time.

## Fitur Utama (Admin)

### 1. **User Management ([/admin/users](/admin/users))**
Mengelola data pengguna aplikasi.

**Kemampuan:**
- **Lihat User**: Menampilkan daftar user dengan email, role, status, dan login terakhir
- **Tambah User**: Daftarkan user baru dengan password otomatis
- **Edit User**: Update profil, reset password, toggle status aktif
- **Import User**: Bulk import via template Excel

**Tugas Umum:**
- Reset password user → Ke [Users](/admin/users) → Edit → Reset Password
- Nonaktifkan user → Ke [Users](/admin/users) → Toggle status aktif
- Buat admin baru → Ke [Users](/admin/users) → Tambah User → Pilih role "Admin"

### 2. **Permissions System**
Sistem kontrol akses berbasis Role-Based Access Control (RBAC).

#### **Roles ([/admin/roles](/admin/roles))**
Kelola level akses pengguna:
- **Admin**: Akses penuh sistem (tidak bisa dihapus)
- **Manager**: User management + akses monitoring
- **User**: Akses profil dasar saja

**Aksi:**
- [Tambah role baru](/admin/roles) → Klik "Add Role"
- [Edit permissions role](/admin/roles) → Klik role → Manage Permissions

#### **Permissions ([/admin/permissions](/admin/permissions))**
Hak akses granular:
- `view_users` - Lihat akun user
- `manage_users` - Create, edit, delete users
- `manage_permissions` - Konfigurasi roles & permissions
- `view_logs` - Akses log aktivitas
- `manage_cache` - Operasi clear cache
- `manage_queue` - Manage job queues
- `view_profile` - Lihat profil sendiri

### 3. **System Monitoring**

#### **Cache ([/admin/cache](/admin/cache))**
Manajemen Redis caching:
- Lihat statistik cache (hits, misses, memory)
- Test performa cache
- Flush cache jika diperlukan
- Monitor koneksi health

**Kegunaan:** Setelah perubahan data besar, clear cache agar user melihat data terbaru.

#### **Queue ([/admin/queue](/admin/queue))**
Monitoring antrian job RabbitMQ:
- Lihat pending, processing, completed, failed jobs
- Retry failed jobs
- Monitor statistik queue
- Cek status circuit breaker

**Kegunaan:** Monitor progress pengiriman email massal atau proses import background.

#### **Logs ([/admin/logs](/admin/logs))**
Pelacakan aktivitas sistem:
- Filter berdasarkan tipe aksi, user, rentang tanggal
- Export log untuk audit
- Lihat detail metadata aktivitas
- Lacak aksi user untuk keamanan

**Kegunaan:** Investigasi insiden keamanan atau aksi user.

### 4. **Settings & Profile**

#### **Profile ([/admin/profile](/admin/profile))**
- Update informasi pribadi (nama, email)
- Ganti password
- Konfigurasi pengaturan 2FA

#### **Keamanan 2FA**
- Verifikasi OTP berbasis email
- Diperlukan untuk akun admin (bisa dikonfigurasi)
- Backup codes tersedia

## Default Roles & Permissions

| Role | Key Permissions |
|------|------------------|
| **Admin** | Semua permissions |
| **Manager** | view_users, manage_users, view_logs, view_profile |
| **User** | view_profile saja |

## Tips Penggunaan

1. **Pencarian Cepat**: Gunakan search bar di tabel untuk mencari user/log dengan cepat
2. **Keyboard Shortcuts**: Tekan `Ctrl+K` untuk navigasi cepat (jika diaktifkan)
3. **Investigasi Error**: Jika ada yang tidak bekerja → Cek [Logs](/admin/logs) dulu
4. **Masalah Cache**: Setelah update data → Clear cache di [/admin/cache](/admin/cache)
5. **Operasi Bulk**: Gunakan Excel import di [Users](/admin/users) untuk pembuatan user massal

## FAQ

**Q: Cara buat admin baru?**
A: Ke [Users](/admin/users) → Tambah User → Pilih role "Admin"

**Q: User tidak bisa akses fitur?**
A: Cek permissions role mereka di [/admin/roles](/admin/roles)

**Q: dimana lihat siapa yang hapus record?**
A: Cek activity logs di [/admin/logs](/admin/logs) dengan filter "delete"
