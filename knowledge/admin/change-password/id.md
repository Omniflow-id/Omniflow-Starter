# Change Password ([/admin/change-password](/admin/change-password))

Halaman **Change Password** memungkinkan users untuk mengupdate password akun mereka dengan enforcement policy komprehensif untuk keamanan.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Ubah password | Isi form di [/admin/change-password](/admin/change-password) |
| Lihat profil | Kembali ke [/admin/profile](/admin/profile) |
| Cek persyaratan policy | Lihat tabel di bawah |

## Langkah Ubah Password

### Cara Ubah Password Anda

1. Navigasi ke [/admin/change-password](/admin/change-password)
2. Masukkan **password saat ini**
3. Masukkan **password baru** (harus memenuhi semua persyaratan)
4. **Konfirmasi password baru** (harus cocok)
5. Klik tombol **"Change Password"**
6. **Sukses**: Redirect ke profil dengan pesan konfirmasi

### Field Form

| Field | Wajib | Validasi |
|-------|-------|----------|
| **Current Password** | ✓ | Harus cocok dengan password existing Anda |
| **New Password** | ✓ | Harus memenuhi semua persyaratan password policy |
| **Confirm Password** | ✓ | Harus cocok dengan password baru persis |

## Persyaratan Password Policy

### Tabel Policy Lengkap

| Persyaratan | Nilai Default | Dapat Dikonfigurasi | Deskripsi |
|-------------|---------------|---------------------|-----------|
| **Minimum Length** | 8 karakter | ✓ | Password terpendek yang diizinkan |
| **Maximum Length** | 128 karakter | ✓ | Password terpanjang yang diizinkan |
| **Uppercase Letters** | Wajib (≥ 1) | ✓ | Harus mengandung A-Z |
| **Lowercase Letters** | Wajib (≥ 1) | ✓ | Harus mengandung a-z |
| **Numbers** | Wajib (≥ 1) | ✓ | Harus mengandung 0-9 |
| **Special Characters** | Wajib (≥ 1) | ✓ | Harus mengandung !@#$%^&* dll |
| **Minimum Numbers** | 1 | ✓ | Jumlah minimum digit |
| **Minimum Symbols** | 1 | ✓ | Jumlah minimum karakter special |
| **Max Repeating Characters** | 3 | ✓ | Maks karakter identik berturut-turut |
| **Forbidden Patterns** | Dapat dikonfigurasi | ✓ | Kata/pattern yang dilarang |

### Environment Variables

Administrator dapat customize policy via `.env`:

```env
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true
PASSWORD_MIN_SYMBOLS=1
PASSWORD_MIN_NUMBERS=1
PASSWORD_MAX_REPEATING=3
PASSWORD_FORBIDDEN_PATTERNS=password,admin,12345,qwerty
```

## Aturan Validasi Password

### Persyaratan Tipe Karakter

**Uppercase Letters (A-Z):**
- Minimal 1 huruf besar wajib
- Contoh: `A`, `Z`, `M`

**Lowercase Letters (a-z):**
- Minimal 1 huruf kecil wajib
- Contoh: `a`, `z`, `m`

**Numbers (0-9):**
- Minimal 1 angka wajib
- Contoh: `0`, `5`, `9`

**Special Characters:**
- Minimal 1 karakter special wajib
- Diizinkan: `` !@#$%^&*()_+-=[]{}|;':",./<>?`~ ``
- Contoh: `!`, `@`, `#`, `$`

### Aturan Lanjutan

**Maks Karakter Berulang Berturut-turut:**
- Maksimum 3 karakter identik berturut-turut
- ✅ Bagus: `AAA`, `111`, `!!!`
- ❌ Buruk: `AAAA`, `1111`, `!!!!`

**Forbidden Patterns:**
- Tidak boleh mengandung kata umum (dapat dikonfigurasi)
- Default forbidden: `password`, `admin`, `12345`, `qwerty`
- Pencocokan case-insensitive

### Contoh Kekuatan Password

**✅ Password Kuat:**
- `MyP@ssw0rd2024` (mixed case, angka, simbol)
- `Secure!123Pass` (memenuhi semua persyaratan)
- `Tr0ng#P@ssword` (kompleksitas bagus)

**❌ Password Lemah:**
- `password` (forbidden pattern)
- `12345678` (tidak ada huruf, terlalu simple)
- `Password` (kurang angka, simbol)
- `AAAAA123!` (terlalu banyak karakter berulang)
- `pass` (terlalu pendek)

## Pesan Error Validasi

### Error Umum

| Pesan Error | Penyebab | Solusi |
|-------------|----------|--------|
| Password must be at least 8 characters | Terlalu pendek | Gunakan minimum 8 karakter |
| Password must contain uppercase | Kurang A-Z | Tambah minimal satu huruf besar |
| Password must contain lowercase | Kurang a-z | Tambah minimal satu huruf kecil |
| Password must contain numbers | Kurang 0-9 | Tambah minimal satu angka |
| Password must contain symbols | Kurang karakter special | Tambah !@#$%^&* dll |
| Too many repeating characters | Pattern AAAA | Batasi pengulangan berturut-turut ke 3 |
| Password contains forbidden pattern | Kata terlarang | Hindari kata umum seperti "password" |
| Passwords do not match | Ketidakcocokan di konfirmasi | Password konfirmasi harus cocok dengan password baru |
| Current password incorrect | Password saat ini salah | Masukkan password saat ini yang benar |

## Generated Passwords (Admin Bulk Import)

### Pattern Password untuk Bulk Upload

Saat admin import users via Excel, passwords auto-generated:

**Pattern:** `FullNameWithoutSpaces@12345?.`

**Contoh:**
- Eric Julianto → `EricJulianto@12345?.`
- Jane Smith → `JaneSmith@12345?.`
- Ahmad Wijaya → `AhmadWijaya@12345?.`

**Policy Compliance:**
- ✅ Uppercase: Huruf pertama tiap bagian nama
- ✅ Lowercase: Huruf sisanya
- ✅ Numbers: `12345`
- ✅ Symbols: `@`, `?`, `.`
- ✅ Memenuhi panjang minimum (8+ karakter)

### Peringatan Keamanan untuk Generated Passwords

⚠️ **Penting untuk User Baru:**
- Generated passwords **predictable**
- Users harus **ubah segera** setelah first login
- Admin lihat generated passwords di [/admin/passwords](/admin/passwords)
- **Jangan bagikan** generated passwords dengan tidak aman

## Skenario Umum

### Skenario 1: Lupa Password Saat Ini

**Masalah:** Tidak bisa ingat password saat ini untuk mengubahnya

**Solusi:**
1. Logout dari akun Anda
2. Hubungi system administrator
3. Admin dapat reset password Anda di [/admin/users](/admin/users)
4. Admin berikan password sementara
5. Login dengan password sementara
6. Segera ubah ke password Anda sendiri

**Catatan:** Sistem tidak support self-service password reset (fitur keamanan).

### Skenario 2: Password Ditolak oleh Policy

**Masalah:** Password baru terus ditolak

**Diagnosis:**
1. Cek semua persyaratan di tabel policy di atas
2. Review pesan error dengan hati-hati
3. Gunakan password strength checker (jika tersedia)

**Solusi:**
- Pastikan minimal 8 karakter
- Include uppercase (A-Z)
- Include lowercase (a-z)
- Include numbers (0-9)
- Include special characters (!@#$)
- Hindari karakter berulang (maks 3)
- Hindari kata terlarang

### Skenario 3: First Login Setelah Bulk Import

**Untuk User Baru yang Dibuat Admin:**

1. Cek email/dokumentasi untuk password sementara
2. Login dengan generated password (format: `FullName@12345?.`)
3. **Segera navigasi ke** [/admin/change-password](/admin/change-password)
4. Ubah ke password personal yang aman
5. Simpan password dengan aman (password manager direkomendasikan)

### Skenario 4: Update Password Rutin

**Best Practice Schedule:**

1. Ubah password tiap **90 hari** (direkomendasikan)
2. Navigasi ke [/admin/change-password](/admin/change-password)
3. Masukkan password saat ini
4. Pilih password baru yang kuat (berbeda dari sebelumnya)
5. Update entry password manager
6. Logout dan login untuk verifikasi

## Troubleshooting

| Masalah | Diagnosis | Solusi |
|---------|-----------|--------|
| Form validation gagal | Cek semua persyaratan policy | Review pesan error, pastikan semua aturan dipenuhi |
| Password saat ini salah | Typo atau caps lock | Verifikasi password yang benar, cek caps lock |
| Confirmation mismatch | Error ketik | Hati-hati ketik ulang password konfirmasi |
| Password terlalu lemah | Password simple | Tambah kompleksitas: mixed case, angka, simbol |
| Tidak bisa akses halaman | Belum login | Login dulu, lalu akses change password |
| Perubahan tidak tersimpan | Error server/network | Cek koneksi internet, coba lagi |

## Best Practice Keamanan

### Memilih Password Kuat

✅ **Praktik Bagus:**
- Gunakan password manager untuk generate password random
- Buat password unik per sistem
- Gunakan passphrase (contoh: `Coffee$Morning2024!`)
- Mix tipe karakter di seluruh password
- Buat password memorable tapi unpredictable

❌ **Hindari:**
- Informasi personal (tanggal lahir, nama, telpon)
- Pattern umum (123456, qwerty, password)
- Kata dictionary
- Menggunakan ulang password di sistem berbeda
- Berbagi password dengan siapapun

### Maintenance Password

✅ **Update Rutin:**
- Ubah password tiap 90 hari
- Update segera jika:
  - Dugaan kompromi
  - Setelah berbagi kredensial (akses sementara)
  - Meninggalkan perusahaan
  - Security breach diumumkan
  - Bergabung dari kontraktor ke karyawan

### Activity Logging

Semua perubahan password di-log ke sistem aktivitas:
- Timestamp perubahan
- User yang mengubah password
- Alamat IP
- Status sukses/gagal

**Lihat Logs:** [/admin/log](/admin/log) (admin only)

## Halaman Terkait

- **User Profile**: [/admin/profile](/admin/profile) - Lihat detail akun
- **Generated Passwords**: [/admin/passwords](/admin/passwords) - Admin bulk import passwords
- **User Management**: [/admin/users](/admin/users) - Admin user CRUD
- **Activity Logs**: [/admin/log](/admin/log) - Lihat audit trail perubahan password
