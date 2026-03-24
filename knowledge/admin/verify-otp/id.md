# Verifikasi Kode OTP

Halaman **Verifikasi OTP** adalah langkah keamanan kedua dalam proses login ke sistem Omniflow. Setelah berhasil memverifikasi password, Anda akan diminta untuk memasukkan kode verifikasi yang dikirim ke email.

## Siapa yang Menggunakan

- **Semua user yang login** - Siapa pun yang berhasil memverifikasi password akan melewati step ini
- **User dengan akun aktif** - Akun yang tidak dinonaktifkan
- **User yang baru pertama kali login** - Setelah password direset, tetap perlu verifikasi 2FA

## Kapan Digunakan

1. **Login normal** - Setelah password berhasil diverifikasi
2. **Login setelah reset password** - Menggunakan password baru
3. **Login dari perangkat baru** - Sistem mendeteksi perangkat baru
4. **Session expire** - Setelah session timeout, login ulang memerlukan OTP

## Cara Menggunakan

### 1. Periksa Email

Setelah dialihkan ke halaman verifikasi OTP:
- Buka inbox email Anda
- Carilah email dari sistem Omniflow
- Kode OTP terdiri dari 6 digit angka

### 2. Masukkan Kode

- Ketik 6 digit kode OTP di kolom yang tersedia
- Pastikan tidak ada spasi di antara angka
- Klik tombol "Verifikasi" atau tekan Enter

### 3. Tunggu Proses

- Sistem memverifikasi kode dalam hitungan detik
- Jika benar, Anda akan diarahkan ke dashboard
- Jika salah, akan muncul pesan error

## Batas Waktu OTP

### Masa Berlaku

- **Durasi**: 5 menit sejak kode dikirim
- **Timer display**: Sistem menampilkan sisa waktu yang tersedia
- **Expired handling**: Jika kedaluwarsa, harus login ulang dari awal

### Jika OTP Expired

1. Anda akan dikembalikan ke halaman login
2. Harus memasukkan email dan password lagi
3. Kode OTP baru akan dikirim ke email

## Pesan Error dan Solusi

| Pesan Error | Penyebab | Solusi |
|-------------|----------|--------|
| Kode OTP tidak valid | Salah memasukkan kode atau sudah expired | Cek kode terbaru di email, jangan gunakan kode lama |
| OTP sudah expired | Melebihi 5 menit | Login ulang untuk dapat kode baru |
| Terlalu banyak percobaan | Salah memasukkan kode berkali-kali | Tunggu 5 menit, coba lagi |
| Sesi tidak ditemukan | Refresh page atau navigasi tidak valid | Login ulang dari halaman awal |

## Mekanisme Keamanan

### Mengapa OTP Diperlukan?

- **Lapisan keamanan tambahan** - Meskipun password bocor, akun tetap aman
- **Verifikasi kepemilikan email** - Memastikan akses oleh pemilik akun yang sah
- **Mencegah akses tidak sah** - Menyerang harus memiliki akses ke email juga

### Keamanan OTP

- Kode bersifat unik dan random
- Hanya berlaku untuk satu sesi login
- Tidak bisa digunakan ulang
- Different code setiap percobaan login

## Tips Keamanan

### ✅ Praktik Baik

- Jangan pernah membagikan kode OTP kepada siapa pun
-system tidak akan pernah meminta kode OTP melalui telepon
- Jika menerima email OTP tanpa diminta, segera laporkan ke admin
- Ganti password secara berkala untuk keamanan ekstra

### ❌ Hal yang Harus Dihindari

- Jangan berikan kode OTP ke orang yang mengklaim dari support
- Jangan masukan kode di website selain Omniflow resmi
- Jangan forward email OTP ke orang lain
- Jangan screenshoot kode OTP

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak menerima email OTP | Cek folder spam/junk, pastikan email benar, hubungi admin |
| Email OTP masuk ke promo/spam | Cek pengaturan email, mark的发件人为 trusted |
| Timer habis sebelum sempat masukkan | Klik "Kirim Ulang OTP" untuk dapat kode baru |
| Salah memasukkan kode berkali-kali | Tunggu 5 menit, pastikan input benar sebelum submit |
| Stuck di halaman ini | Refresh browser, jika masih bermasalah logout dan login ulang |

## Pengembangan (Dev Mode)

### Fitur Bypass untuk Development

Di environment development, administrator dapat mengaktifkan fitur bypass 2FA:
- Jika aktif, kode OTP tidak diperlukan
- User langsung masuk setelah password diverifikasi
-biasanya untuk keperluan testing atau demo

**Catatan Penting**: Fitur ini TIDAK boleh diaktifkan di environment production karena mengurangi keamanan.

## Link Terkait

- [Halaman Login](/admin/login) - Untuk memulai proses login
- [Hubungi Admin](/admin/support) - Jika mengalami masalah verifikasi
- [Ganti Password](/admin/change-password) - Setelah berhasil login