# Pendaftaran Akun Baru

Halaman **Register** adalah fitur untuk mendaftarkan akun baru di sistem Omniflow. Fitur ini memungkinkan pengguna baru untuk membuat akun sendiri tanpa perlu meminta administrator.

## Siapa yang Menggunakan

- **Karyawan baru** - Yang belum memiliki akun di sistem
- **Pengguna potensial** - Yang diundang untuk mencoba sistem
- **Kontraktor/outsource** - Yang diberi akses oleh tim internal

## Kapan Digunakan

1. **Onboarding karyawan baru** - Setelah HR memberikan akses
2. **Trial pengguna** - Yang ingin mencoba sistem
3. **Registrasi undangan** - Menggunakan link undangan dari admin
4. **Self-service registration** - Jika fitur ini diaktifkan oleh admin

## Langkah Pendaftaran

### 1. Isi Formulir

Di halaman register, lengkapi data berikut:
- **Username**: Nama untuk login (unik, tidak boleh sama)
- **Email**: Alamat email aktif (akan digunakan untuk notifikasi)
- **Password**: Kata sandi sesuai kebijakan keamanan
- **Konfirmasi Password**: Ulangi password yang sama

### 2. Validasi Data

Sistem akan memvalidasi:
- Format email benar
- Username belum digunakan
- Password memenuhi kebijakan (panjang, karakter)
- Password dan konfirmasi cocok

### 3. Verifikasi (Jika Diaktifkan)

Jika admin mengaktifkan verifikasi email:
- Link verifikasi dikirim ke email
- Klik link untuk aktivasi akun
- Setelah itu baru bisa login

### 4. Aktivasi Akun

Setelah berhasil:
- Akun langsung aktif (jika tanpa verifikasi email)
- Atau setelah klik link verifikasi
- Siap untuk login

## Kebijakan Password

Password harus memenuhi persyaratan:
- Minimal 8 karakter
- Mengandung huruf besar (A-Z)
- Mengandung huruf kecil (a-z)
- Mengandung angka (0-9)
- Mengandung karakter khusus (!@#$%^&*)

## Pesan Error dan Solusi

| Pesan Error | Penyebab | Solusi |
|-------------|----------|--------|
| Email sudah terdaftar | Email sudah ada di sistem | Gunakan email lain atau hubungi admin |
| Username sudah digunakan | Nama sudah dipakai user lain | Pilih username lain yang unik |
| Password tidak cocok | Password dan konfirmasi berbeda | Pastikan keduanya sama persis |
| Password terlalu lemah | Tidak memenuhi kebijakan password | Gunakan kombinasi yang lebih kompleks |
| Format email salah | Format email tidak valid | Masukkan email dengan format yang benar |

## Keamanan Pendaftaran

### Verifikasi Email

Untuk mencegah akun palsu:
- Link verifikasi dikirim ke email
- Klik aktivasi dalam waktu tertentu
- Jika tidak diklik, akun tidak bisa login

### Pencegahan Spam

- Menggunakan CAPTCHA (jika diaktifkan)
- Rate limiting untuk mencegah mass registration
- Moderasi manual untuk jenis tertentu

## Jika Tidak Bisa Register

### Kemungkinan Alasan

1. **Registrasi dinonaktifkan** - Admin belum membuka fitur ini
2. **Hanya dengan undangan** - Memerlukan link dari admin
3. **Domain dibatasi** - Hanya email tertentu yang diperbolehkan
4. **Kuota penuh** - Jumlah user sudah mencapai limit

### Solusi

- Hubungi administrator untuk meminta akun
- Jika sudah ada invito, gunakan link tersebut
- Tunggu jika sedang dalam masa maintenance

## Setelah Berhasil Daftar

### Langkah Selanjutnya

1. **Login** ke sistem dengan kredensial baru
2. **Lengkapi profil** - Nama lengkap, departemen, dll.
3. **Ganti password** - Jika menggunakan password sementara
4. **Pelajari sistem** - Ikuti orientasi jika ada

### Jika Menggunakan Link Undangan

- Akun sudah terhubung dengan tim/departemen tertentu
- Tidak perlu input informasi tambahan
- Langsung bisa akses fitur sesuai peran

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak bisa akses halaman register | Fitur mungkin dinonaktifkan, hubungi admin |
| Link verifikasi tidak berfungsi | Cek email lagi, mungkin masuk spam, minta kirim ulang |
| Email tidak terima link | Hubungi admin untuk aktivasi manual |
| Stuck di proses verifikasi | Refresh halaman, jika tetap coba lagi dari awal |

## Perbedaan dengan Akun Admin

| Aspek | Register Self-Service | Akun dari Admin |
|-------|---------------------|-----------------|
| Pembuatan | Oleh user sendiri | Oleh administrator |
| Password | Ditentukan user | Bisa auto-generated |
| Verifikasi | Melalui email (biasanya) | Langsung aktif |
| Role | Default saja | Sesuai kebutuhan |

## Link Terkait

- [Halaman Login](/admin/login) - Jika sudah punya akun
- [Hubungi Admin](/admin/support) - Jika mengalami masalah