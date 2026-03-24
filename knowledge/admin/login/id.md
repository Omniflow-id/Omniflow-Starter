# Proses Login ke Sistem

Halaman **Login** adalah pintu masuk utama untuk mengakses sistem Omniflow. Halaman ini menangani autentikasi pengguna dengan keamanan berlapis menggunakan password dan verifikasi dua faktor (2FA).

## Siapa yang Menggunakan

- **Semua pengguna sistem** - Karyawan, manajer, administrator yang memiliki akun di Omniflow
- **User baru** - Karyawan yang baru didaftarkan oleh administrator
- **Kontraktor/outsource** - Pihak eksternal yang diberi akses sementara ke sistem

## Kapan Digunakan

1. **Akses pertama kali** - Saat pertama kali masuk ke sistem setelah akun dibuat
2. **Session berakhir** - Setelah logout atau session timeout (24 jam tidak aktif)
3. **Login dari perangkat baru** - Saat mengakses dari browser/perangkat baru
4. **Reset password** - Setelah administrator mereset password, user harus login ulang

## Langkah Login

### 1. Masukkan Kredensial

Di halaman login, masukkan:
- **Email**: Alamat email yang terdaftar di sistem
- **Password**: Kata sandi akun Anda

### 2. Verifikasi Password

Sistem akan memverifikasi:
- Email terdaftar di sistem
- Password cocok dengan yang tersimpan
- Akun dalam kondisi aktif

### 3. Verifikasi Dua Faktor (2FA)

Jika password benar, sistem akan mengirim kode OTP ke email Anda:
-OTP dikirim secara otomatis setelah password diverifikasi
- Anda akan diarahkan ke halaman verifikasi OTP
- Masukkan kode 6 digit yang dikirim ke email

### 4. Akses Sistem

Setelah OTP diverifikasi, Anda akan diarahkan ke halaman utama (dashboard).

## Pesan Error dan Solusi

| Pesan Error | Penyebab | Solusi |
|-------------|----------|--------|
| Email atau password salah | Email tidak terdaftar atau password salah | Cek kembali email dan password, hubungi admin jika lupa |
| Akun tidak aktif | Akun dinonaktifkan oleh administrator | Hubungi administrator untuk aktivasi ulang |
| Terlalu banyak percobaan login | Rate limit tercapai | Tunggu 15 menit, coba lagi |
| Sesi berakhir | Idle terlalu lama | Login ulang |

## Keamanan Login

### Perlindungan yang Diterapkan

1. **Enkripsi password** - Password disimpan dengan enkripsi kuat (bcrypt)
2. **Two-Factor Authentication** - Kode OTP dikirim ke email untuk verifikasi tambahan
3. **Rate limiting** - Mencegah percobaan brute force dengan membatasi percobaan login
4. **Activity logging** - Semua percobaan login (berhasil/gagal) dicatat untuk audit

### Best Practices Keamanan

✅ **Lakukan:**
- Gunakan password unik yang tidak digunakan di sistem lain
- Jangan pernah berbagi kredensial login
- Logout saat meninggalkan komputer
- Segera laporkan aktivitas mencurigakan

❌ **Hindari:**
- Menyimpan password di browser (terutama di komputer bersama)
- Login dari WiFi publik tanpa VPN
- Menekan tombol "remember me" di komputer shared
- Mengabaikan pesan keamanan sistem

## Pengaturan Session

### Durasi Session

- **Lifetime**: 24 jam (jika tidak ada aktivitas)
- **Auto-renewal**: Session diperpanjang otomatis saat ada aktivitas
- **Timeout warning**: Muncul 2 menit sebelum session berakhir

### Mekanisme Keamanan Session

- Setiap aktivitas (klik, input) memperbarui timer session
- Session terikat dengan browser dan IP address
- Jika IP berubah signifikan, session akan berakhir

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak menerima email OTP | Cek folder spam, pastikan email benar, hubungi admin jika masih bermasalah |
| Email tidak terdaftar | Hubungi administrator untuk mendaftarkan akun |
| Lupa password | Hubungi administrator untuk reset password |
| Akun terkunci | Hubungi administrator untuk unlock |
| Tidak bisa login sama sekali | Verifikasi status akun dengan administrator |

## Integrasi dengan Fitur Lain

### Setelah Login Berhasil

- **Permission dimuat** - Sistem memuat hak akses berdasarkan peran Anda
- **Redirect ke dashboard** - Anda masuk ke halaman utama sesuai peran
- **Activity dicatat** - Log aktivitas dibuat untuk audit trail

### Jika Login Gagal

- Percobaan gagal dicatat dengan detail IP dan waktu
- Admin bisa melihat riwayat login di Activity Logs
- Jika terlalu banyak gagal, akun mungkin perlu diverifikasi admin

## Informasi Tambahan

### Akun Default (Untuk Testing)

Jika Anda menggunakan environment development dengan fitur bypass aktif, Anda bisa login dengan akun default:
- admin@omniflow.id / Admin12345
- manager@omniflow.id / Manager12345
- user@omniflow.id / User12345

**Catatan**: Akun bypass hanya aktif di environment development, tidak di production.

### Dukungan Browser

Sistem mendukung browser modern:
- Chrome (versi terbaru)
- Firefox (versi terbaru)
- Safari (versi terbaru)
- Edge (versi terbaru)

## Link Terkait

- [Verifikasi OTP](/admin/verify-otp) - Halaman masukkan kode OTP
- [Lupa Password](/admin/forgot-password) - Proses reset password (jika diaktifkan)
- [Hubungi Admin](/admin/support) - Jika mengalami masalah login