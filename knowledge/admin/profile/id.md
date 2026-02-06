# User Profile ([/admin/profile](/admin/profile))

Halaman **User Profile** menampilkan informasi akun Anda, pengaturan keamanan, dan menyediakan akses ke management password.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat profil | Ke [/admin/profile](/admin/profile) |
| Ubah password | Klik **"Change Password"** → Ke [/admin/change-password](/admin/change-password) |
| Cek status 2FA | Lihat bagian **"2FA Security"** |
| Review status akun | Lihat badge **"Account Status"** |

## Informasi Profil

### Detail Akun

| Field | Deskripsi |
|-------|-----------|
| **Username** | Username login Anda (unik) |
| **Email** | Alamat email akun |
| **Full Name** | Nama lengkap Anda |
| **Role** | Role Anda saat ini (Admin, Manager, User) |
| **Created At** | Timestamp pembuatan akun |

### Status Akun

- **🟢 Active**: Akses penuh sistem
- **🔴 Inactive**: Akun dinonaktifkan, tidak ada akses

**Catatan:** Hanya admin yang dapat mengubah status akun di [/admin/users](/admin/users).

## Two-Factor Authentication (2FA)

### Metode 2FA Saat Ini

Sistem menggunakan **Email OTP** untuk two-factor authentication:

- **Metode**: One-Time Password dikirim ke email Anda
- **Validitas**: 5 menit per OTP
- **Non-blocking**: Email dikirim via RabbitMQ queue (< 200ms respons)
- **Fallback**: Email synchronous jika queue tidak tersedia

### Fitur Keamanan 2FA

✅ **Manfaat Keamanan:**
- Lapisan tambahan di luar password
- Perlindungan terhadap akses tidak sah
- Verifikasi email setiap login
- Penyimpanan OTP berbasis session

### Development Bypass

Untuk environment development/testing:
- **`DEV_2FA_BYPASS=true`** environment variable
- Melewati verifikasi OTP
- **Jangan gunakan di production**

## Pengaturan Keamanan

### Kebijakan Password

Password Anda harus memenuhi persyaratan ini:

| Persyaratan | Nilai Default |
|-------------|---------------|
| Panjang minimum | 8 karakter |
| Panjang maksimum | 128 karakter |
| Huruf besar | Wajib |
| Huruf kecil | Wajib |
| Angka | Wajib (minimum 1) |
| Karakter special | Wajib (minimum 1) |
| Maks karakter berulang | 3 berturut-turut |

**Ubah Password:** [/admin/change-password](/admin/change-password)

### Keamanan Session

- **Session Timeout**: 24 jam inaktivitas
- **Sliding Session**: Auto-renewed saat aktivitas
- **Inactivity Warning**: Modal muncul 2 menit sebelum timeout
- **Keep-Alive**: Refresh session background saat aktivitas user

### Activity Logging

Semua aktivitas akun Anda di-log:
- Percobaan login
- Perubahan password
- Perubahan permission
- Update profil

**Lihat Logs:** [/admin/log](/admin/log) (filter berdasarkan username Anda)

## Skenario Umum

### Skenario 1: Ubah Password

**Kapan Mengubah:**
- Update keamanan berkala (tiap 90 hari direkomendasikan)
- Dugaan akun dikompromikan
- Setelah berbagi kredensial sementara
- Bergabung perusahaan/meninggalkan kontraktor

**Cara Mengubah:**
1. Klik tombol **"Change Password"** di profil
2. Redirect ke [/admin/change-password](/admin/change-password)
3. Masukkan password saat ini
4. Masukkan password baru (harus memenuhi policy)
5. Konfirmasi password baru
6. Submit → Password diupdate

### Skenario 2: Cek Permission Anda

**Cara Lihat:**
1. Role Anda menentukan permissions
2. Lihat detail role di [/admin/roles](/admin/roles)
3. Admin dapat grant/revoke individual permissions di [/admin/users](/admin/users)

**Permission Umum per Role:**
- **Admin**: Semua permissions
- **Manager**: `view_users`, `manage_users`, `view_logs`, `view_profile`
- **User**: `view_profile` saja

### Skenario 3: 2FA Tidak Menerima OTP

**Troubleshooting:**
1. Cek folder spam/junk email Anda
2. Verifikasi alamat email benar di profil
3. Cek status queue di [/admin/queue](/admin/queue) (jika admin)
4. Hubungi system administrator jika persisten

**Troubleshooting Admin:**
- Cek status koneksi RabbitMQ
- Review log email worker
- Verifikasi konfigurasi SMTP
- Cek circuit breaker state

### Skenario 4: Akun Terkunci/Inactive

**Gejala:**
- Tidak bisa login
- Error message "Account inactive"
- Profil menunjukkan status 🔴 Inactive

**Solusi:**
- Hubungi system administrator Anda
- Admin dapat reaktivasi di [/admin/users](/admin/users)
- **Catatan:** Anda tidak bisa aktivasi akun sendiri

## Troubleshooting

| Masalah | Cek | Solusi |
|---------|-----|--------|
| Tidak bisa ubah password | Password saat ini benar? | Verifikasi password saat ini, cek password policy |
| OTP 2FA tidak datang | Alamat email benar? | Cek folder spam, hubungi admin |
| Akun menunjukkan inactive | Badge status akun | Hubungi admin untuk reaktivasi |
| Error permission denied | Permissions role Anda | Hubungi admin untuk review permission |
| Session timeout terlalu cepat | Tingkat aktivitas | Sistem keep session alive saat aktivitas |

## Best Practice Keamanan

### Management Password

✅ **Praktik Bagus:**
- Gunakan password unik untuk sistem ini
- Ubah password tiap 90 hari
- Jangan bagikan kredensial
- Gunakan password manager

❌ **Hindari:**
- Menggunakan ulang password dari sistem lain
- Password simple/predictable
- Berbagi akses akun
- Menulis password

### Keamanan Session

✅ **Praktik Bagus:**
- Logout saat meninggalkan komputer
- Jangan simpan password di browser (komputer shared)
- Laporkan aktivitas mencurigakan
- Amankan email (untuk 2FA)

❌ **Hindari:**
- Membiarkan session terbuka di komputer shared
- Menggunakan WiFi publik tanpa VPN
- Berbagi kode 2FA
- Mengabaikan peringatan keamanan

### Keamanan Akun

✅ **Monitor:**
- Review activity log Anda secara berkala
- Cek lokasi login yang tidak familiar
- Verifikasi alamat email up-to-date
- Laporkan aktivitas mencurigakan segera

## Halaman Terkait

- **Change Password**: [/admin/change-password](/admin/change-password)
- **User Management**: [/admin/users](/admin/users) (admin only)
- **Activity Logs**: [/admin/log](/admin/log) (lihat aktivitas Anda)
- **Roles**: [/admin/roles](/admin/roles) (lihat permissions role)
