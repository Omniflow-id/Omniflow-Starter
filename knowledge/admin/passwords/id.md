# Generated Passwords ([/admin/passwords](/admin/passwords))

Halaman **Generated Passwords** menampilkan auto-generated passwords setelah bulk user imports, memungkinkan admin untuk mengkomunikasikan kredensial dengan aman ke user baru.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat generated passwords | Ke [/admin/passwords](/admin/passwords) setelah Excel import |
| Copy password | Klik teks password untuk copy |
| Download daftar password | Klik tombol **"Download CSV"** (jika tersedia) |
| Kembali ke users | Ke [/admin/users](/admin/users) |

## Kapan Passwords Di-generate

### Proses Bulk User Upload

Generated passwords muncul setelah:

1. Admin navigasi ke [/admin/users](/admin/users)
2. Klik tombol **"Upload Users"**
3. Upload file Excel dengan data user
4. Sistem membuat users dengan auto-generated passwords
5. **Redirect ke** [/admin/passwords](/admin/passwords)
6. Menampilkan semua generated passwords untuk distribusi

### Persyaratan File Excel

**Kolom Wajib (total 4):**
- `name` - Username untuk login
- `email` - Alamat email user
- `full_name` - Nama lengkap untuk generasi password
- `role` - Role user (Admin, Manager, User)

**Catatan:** Kolom password TIDAK diperlukan (auto-generated).

## Pattern Generasi Password

### Formula

```
FullNameWithoutSpaces + "@12345?."
```

### Contoh

| Full Name | Generated Password |
|-----------|-------------------|
| Eric Julianto | `EricJulianto@12345?.` |
| Jane Smith | `JaneSmith@12345?.` |
| Ahmad Wijaya | `AhmadWijaya@12345?.` |
| Maria Garcia | `MariaGarcia@12345?.` |
| John Doe | `JohnDoe@12345?.` |

### Komponen Pattern

| Komponen | Tujuan | Contoh |
|----------|--------|--------|
| **Full Name** | Identifikasi user | `EricJulianto` |
| **No Spaces** | Hapus whitespace | `Eric Julianto` → `EricJulianto` |
| **@** | Karakter special | `@` |
| **12345** | Angka | `12345` |
| **?.** | Simbol tambahan | `?.` |

### Kepatuhan Password Policy

✅ **Memenuhi Semua Persyaratan:**
- **Uppercase**: Huruf pertama tiap bagian nama (E, J)
- **Lowercase**: Huruf sisanya (ric, ulianto)
- **Numbers**: Pattern tetap (12345)
- **Symbols**: Tiga simbol (@, ?, .)
- **Length**: Biasanya 15-30 karakter
- **No Repeating**: Maksimum 2 karakter berturut-turut

## Peringatan Keamanan

### ⚠️ Risiko Generated Password

**Pattern Predictable:**
- Passwords mengikuti formula konsisten
- Dapat ditebak jika pattern diketahui
- **Tidak cocok untuk penggunaan jangka panjang**

**Best Practice Keamanan:**
- Users HARUS ubah password di first login
- Komunikasikan passwords dengan aman (encrypted email, secure messaging)
- Hapus/invalidate temporary passwords setelah digunakan
- Monitor untuk unchanged generated passwords

### Instruksi untuk First-Time User

**Email Template untuk User Baru:**

```
Subject: Welcome to Omniflow - Account Credentials

Dear [Full Name],

Your account has been created:

Username: [username]
Temporary Password: [GeneratedPassword]
Login URL: [APP_URL]/admin/login

IMPORTANT SECURITY NOTICE:
1. Login with the temporary password above
2. IMMEDIATELY change your password at /admin/change-password
3. Choose a unique, strong password
4. Do not share your credentials

This temporary password is predictable and must be changed immediately.
```

## Halaman Display Password

### Informasi yang Ditampilkan

Untuk setiap generated user:
- **Username**: Identifier login
- **Email**: Alamat email user
- **Full Name**: Nama lengkap
- **Role**: Role yang di-assign
- **Generated Password**: Password sementara (visible)

### Fitur Keamanan

- **One-Time Display**: Halaman hanya muncul setelah import
- **No Permanent Storage**: Passwords ditampilkan sekali, tidak bisa diambil lagi
- **Session-Based**: Data dibersihkan setelah navigasi away
- **Admin-Only Access**: Memerlukan permission `manage_users`

## Skenario Umum

### Skenario 1: Bulk User Onboarding

**Use Case:** HR import 50 karyawan baru dari Excel

**Proses:**
1. HR siapkan Excel dengan 4 kolom (name, email, full_name, role)
2. Upload di [/admin/users](/admin/users)
3. Sistem generate 50 users dengan passwords
4. **Redirect ke** [/admin/passwords](/admin/passwords)
5. HR copy/download daftar password
6. HR kirim email individual dengan kredensial
7. User baru login dan ubah passwords

**Best Practice:**
- Kirim kredensial via encrypted email
- Gunakan secure password sharing service
- Set expiration pada temporary passwords
- Monitor first-login completion

### Skenario 2: Single User Quick Add

**Use Case:** Perlu onboarding satu kontraktor segera

**Proses:**
1. Buat Excel dengan single row:
   ```
   name,email,full_name,role
   jdoe,john.doe@example.com,John Doe,User
   ```
2. Upload file
3. Lihat generated password: `JohnDoe@12345?.`
4. Kirim kredensial via secure channel
5. Instruksikan untuk ubah password segera

### Skenario 3: Daftar Password Hilang

**Masalah:** Admin navigasi away sebelum simpan passwords

**Impact:**
- Generated passwords tidak lagi visible
- Users tidak bisa login
- Perlu password reset

**Solusi:**
1. Navigasi ke [/admin/users](/admin/users)
2. Untuk setiap user: Klik **Edit** → **Reset Password**
3. Sistem generate password baru
4. Admin berikan kredensial baru

**Prevention:**
- Download password CSV segera
- Copy ke secure password manager
- Jangan navigasi away sampai passwords tersimpan

### Skenario 4: User Tidak Pernah Ubah Password

**Risiko Keamanan:** User masih menggunakan password `FullName@12345?.`

**Deteksi:**
1. Review activity logs di [/admin/log](/admin/log)
2. Cek untuk password change events
3. Identifikasi users tanpa password changes

**Solusi:**
1. Force password change di next login (jika fitur tersedia)
2. Deaktivasi akun sampai password diubah
3. Hubungi user untuk ubah password
4. Reset password jika user tidak responsif

## Best Practices

### Tanggung Jawab Admin

✅ **Saat Import:**
- Review generated passwords segera
- Download/copy daftar password sebelum navigasi away
- Verifikasi semua users dibuat sukses
- Catat error atau failed imports

✅ **Distribusi:**
- Kirim kredensial via secure channels saja
- Jangan email passwords dalam plain text
- Gunakan password sharing services (contoh: 1Password, Bitwarden)
- Include instruksi first-login
- Set follow-up reminders

✅ **Monitoring:**
- Track first-login completion
- Monitor untuk unchanged passwords
- Review activity logs secara berkala
- Follow up dengan users yang belum login

### Komunikasi User

**Metode Distribusi Aman:**

| Metode | Keamanan | Direkomendasikan |
|--------|----------|------------------|
| Encrypted Email | Medium | ✓ Untuk sistem low-risk |
| Password Manager Share | High | ✓ Best practice |
| Secure Messaging (Signal) | High | ✓ Untuk akun sensitif |
| In-Person | Highest | ✓ Untuk eksekutif |
| Plain Text Email | Very Low | ✗ Jangan gunakan |
| SMS | Low | ✗ Hindari |
| Slack/Teams DM | Low | ✗ Hindari |

## Persyaratan Excel Import

### Format yang Benar

**File:** `users.xlsx` atau `users.csv`

**Urutan Kolom (nama exact):**
```
name,email,full_name,role
```

**Contoh Data:**
```csv
name,email,full_name,role
jsmith,jane.smith@company.com,Jane Smith,Manager
bdoe,bob.doe@company.com,Bob Doe,User
aadmin,alice@company.com,Alice Admin,Admin
```

### Error Import Umum

| Error | Penyebab | Solusi |
|-------|----------|--------|
| Column not found | Nama kolom salah | Gunakan exact: name, email, full_name, role |
| Duplicate email | Email ada di sistem | Hapus duplikat dari Excel |
| Invalid role | Role tidak ditemukan | Gunakan: Admin, Manager, atau User |
| Missing required field | Sel kosong | Isi semua 4 kolom untuk setiap user |
| File format error | Tipe file salah | Gunakan .xlsx atau .csv saja |

## Troubleshooting

| Masalah | Diagnosis | Solusi |
|---------|-----------|--------|
| Halaman password kosong | Import gagal | Cek upload errors, retry import |
| Tidak bisa copy passwords | Restriksi browser | Gunakan tombol Download CSV |
| Passwords tidak bekerja | Typo atau caps lock | Verifikasi exact password (case-sensitive) |
| User tidak bisa login | Akun inactive | Aktivasi di [/admin/users](/admin/users) |
| Daftar password hilang | Navigasi away | Reset passwords secara individual |
| Pattern tidak diikuti | Bug/manual creation | Laporkan ke developer |

## Checklist Keamanan

### Sebelum Distribusi

- [ ] Downloaded/copied semua passwords
- [ ] Verified jumlah user cocok dengan import
- [ ] Siapkan metode distribusi aman
- [ ] Drafted instruksi first-login
- [ ] Set calendar reminder untuk follow-up

### Setelah Distribusi

- [ ] Confirmed users menerima kredensial
- [ ] Monitored percobaan first-login
- [ ] Verified perubahan password completed
- [ ] Deleted temporary password copies
- [ ] Documented proses di activity logs

### Follow-Up 30 Hari

- [ ] Review unchanged passwords
- [ ] Force password resets jika perlu
- [ ] Deactivate akun yang tidak digunakan
- [ ] Audit aktivitas pembuatan akun

## Halaman Terkait

- **User Management**: [/admin/users](/admin/users) - User CRUD dan upload
- **Change Password**: [/admin/change-password](/admin/change-password) - Password policy
- **Activity Logs**: [/admin/log](/admin/log) - Track password changes
- **Roles**: [/admin/roles](/admin/roles) - Memahami permissions role
