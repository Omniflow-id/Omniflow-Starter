# Omniflow AI Chat ([/admin/chat](/admin/chat))

Omniflow AI Chat adalah pusat kendali untuk berinteraksi dengan asisten AI Anda.

## Fitur Utama

1. **Kesadaran Konteks**: AI mengetahui *siapa Anda* (Peran, Nama) dan *di mana Anda* (Halaman Saat Ini).
2. **Respons Streaming**: Pesan muncul karakter-per-karakter untuk pengalaman yang lancar.
3. **Dukungan Markdown**: Blok kode, tabel, teks tebal/miring, dan daftar dirender dengan indah.
4. **Manajemen Riwayat**: Percakapan Anda disimpan secara otomatis. Lanjutkan kapan saja.

## Cara Menggunakan

### Memulai Percakapan
1. Arahkan ke `/admin/chat` (atau buka Sidebar).
2. Klik **Chat Baru** (Kanan Atas atau Ikon "Plus" Sidebar).
3. (Opsional) Pilih **Use Case** jika tersedia (misal: "General", "HR").
4. Ketik pesan Anda dan tekan Enter.

### Mengelola Pesan
- **Edit**: Arahkan kursor ke pesan Anda → Klik Ikon Pensil. AI akan **meregenerasi** respons berdasarkan perubahan.
- **Hapus**: Arahkan kursor ke pesan → Klik Ikon Sampah. Ini menghapusnya dari konteks.
- **Salin**: Pilih teks atau gunakan tombol "Copy" pada blok kode.

### Sidebar vs Halaman Penuh
- **Sidebar**: Bantuan cepat saat menjelajahi halaman lain.
- **Halaman Penuh**: Workspace khusus untuk tugas kompleks, coding, atau penulisan panjang.

## Praktik Terbaik

- **Jadilah Spesifik**: "Tulis kueri SQL untuk pengguna aktif" lebih baik daripada "SQL pengguna".
- **Gunakan Konteks**: "Jelaskan error ini" berfungsi baik jika Anda menempelkan kode error.
- **Iterasi**: Jika jawaban pertama tidak sempurna, minta perbaikan ("Buat lebih pendek", "Tambahkan komentar").

## Batasan & Privasi

- **Privasi Data**: Jangan bagikan data pribadi sensitif (PII) kecuali diotorisasi. Percakapan dicatat untuk audit.
- **Limit Token**: Percakapan panjang mungkin mencapai batas token (misal: 4000 token). Mulai chat baru jika AI lupa konteks awal.
- **Penggunaan Model**: Admin mengontrol model mana yang digunakan. Beberapa mungkin lebih lambat/pintar dari yang lain.

## Pemecahan Masalah

| Masalah | Solusi |
|---------|--------|
| **Streaming Macet** | Refresh halaman. Periksa koneksi jaringan. |
| **"Error: 500"** | Layanan AI mungkin down atau salah konfigurasi. Hubungi Admin. |
| **Respons Terpotong** | Ketik "Lanjutkan" untuk membiarkan AI menyelesaikan. |
