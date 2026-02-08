# AI Copilot - Screen Analysis

AI Copilot adalah fitur analisis layar berbasis AI yang membantu Anda memahami data dan konten yang sedang dilihat.

## Apa itu AI Copilot?

AI Copilot adalah tombol floating (ikon ✨ magic sparkles) yang muncul di pojok kanan bawah layar (di atas AI Assistant). Fitur ini menganalisis konten layar yang sedang aktif dan memberikan insight cerdas.

## Cara Menggunakan

### 1. Buka AI Copilot
Klik tombol **ungu** dengan ikon ✨ di pojok kanan bawah layar.

### 2. Input Pertanyaan (Opsional)
Anda bisa:
- **Langsung analisis**: Klik "Analisis Layar" tanpa pertanyaan
- **Dengan pertanyaan spesifik**: Ketik pertanyaan di kolom input, lalu analisis

Contoh pertanyaan:
- "Jelaskan tren data yang terlihat"
- "Ada anomali apa di data ini?"
- "Bandingkan performa bulan ini vs bulan lalu"
- "Apa rekomendasi berdasarkan data ini?"

### 3. Tunggu Analisis
AI akan:
1. Membaca struktur halaman (tabel, form, konten)
2. Menganalisis data yang terlihat
3. Memberikan insight dalam format markdown
4. Menampilkan hasil dengan efek typing

### 4. Gunakan Hasil
- **Scroll** untuk membaca analisis lengkap
- **Salin** hasil dengan tombol "Salin"
- **Tutup** modal untuk kembali bekerja

## Fitur Unggulan

### Analisis Real-time
AI membaca konten halaman secara live, termasuk:
- Data tabel
- Form input
- Heading dan judul
- Alert dan notifikasi

### Konteks Halaman
AI mengetahui halaman apa yang sedang Anda buka, sehingga analisis lebih relevan.

### Respons Streaming
Hasil analisis muncul karakter per karakter (typewriter effect) seperti chat.

### Bisa Dihentikan
Klik tombol "Berhenti" kapan saja jika ingin menghentikan analisis.

## Tips Penggunaan

### Untuk Dashboard/Overview
Tanyakan: "Ringkas performa sistem berdasarkan data yang terlihat"

### Untuk Halaman Data/Tabel
Tanyakan: 
- "Identifikasi pola dan tren dalam data ini"
- "Apa outlier atau anomali yang terlihat?"

### Untuk Form/Input
Tanyakan: "Jelaskan fungsi form ini dan cara pengisiannya"

### Untuk Error Page
Tanyakan: "Analisis error ini dan saran perbaikannya"

## Bedanya dengan AI Assistant

| AI Copilot | AI Assistant |
|------------|--------------|
| Analisis konten layar aktif | Chat interaktif sidebar |
| Sekali analisis per klik | Percakapan bolak-balik |
| Fokus pada data yang terlihat | Fokus pada pertanyaan umum |
| Tidak menyimpan history | Tidak menyimpan history |

## Konfigurasi

AI Copilot menggunakan pengaturan dari [AI Analysis Settings](/admin/ai_analysis_settings):
- Model AI
- Temperature
- Max tokens
- Fitur konteks

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tombol tidak muncul | Refresh halaman, pastikan bukan halaman login |
| Analisis lambat | Cek koneksi internet, atau model AI sedang sibuk |
| Hasil tidak relevan | Perjelas pertanyaan Anda, atau coba tanpa pertanyaan |
| Error saat analisis | Hubungi admin, mungkin konfigurasi AI bermasalah |

## Catatan Penting

⚠️ **Screen Analysis**: AI membaca struktur dan konten teks yang terlihat di layar, bukan screenshot gambar.

⚠️ **Data Sensitivity**: Hindari menganalisis halaman dengan data sensitif jika tidak diperlukan.

⚠️ **Not Real-time**: Data yang dianalisis adalah snapshot saat tombol diklik, bukan real-time.
