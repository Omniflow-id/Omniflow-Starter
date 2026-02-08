# AI Chat ([/admin/chat](/admin/chat))

AI Chat adalah interface percakapan AI berbasis web untuk berinteraksi dengan asisten AI menggunakan berbagai use cases.

## Perbedaan AI Chat vs AI Assistant

| Fitur | AI Chat | AI Assistant |
|-------|---------|--------------|
| **Lokasi** | Halaman penuh `/admin/chat` | Sidebar floating (pojok kanan bawah) |
| **Knowledge** | Berdasarkan AI Use Cases | Berdasarkan halaman aktif |
| **History** | Tersimpan di database | Tidak tersimpan (session only) |
| **Tujuan** | Percakapan mendalam | Bantuan cepat kontekstual |

## Fitur Utama

### 1. Percakapan Berbasis Use Case
Pilih use case yang sesuai untuk mendapatkan respons yang lebih relevan:
- **General**: Tanya jawab umum
- **HR Assistant**: Pertanyaan seputar HRIS dan kebijakan
- **Tech Support**: Bantuan teknis sistem
- Custom use cases dari admin

### 2. Manajemen Percakapan
- **Chat Baru**: Mulai percakapan fresh
- **Riwayat Chat**: Lanjutkan percakapan sebelumnya
- **Edit Judul**: Ubah judul percakapan
- **Hapus**: Hapus percakapan yang tidak diperlukan

### 3. Streaming Respons
Teks muncul karakter per karakter (typewriter effect) untuk pengalaman yang lebih natural.

### 4. Markdown Support
- **Bold**: `**teks**`
- *Italic*: `*teks*`
- `Code`: ``` `kode` ```
- Code blocks dengan syntax highlighting
- Daftar bernomor dan bullet

## Cara Menggunakan

### Memulai Chat Baru
1. Klik tombol **Baru** atau **+**
2. Pilih **Use Case** yang sesuai (opsional)
3. Pilih **Model AI** (opsional, override global settings)
4. Masukkan judul percakapan (opsional)
5. Klik **Mulai**

### Mengirim Pesan
- Ketik pesan di kotak input
- Tekan **Enter** untuk mengirim
- Tekan **Shift + Enter** untuk baris baru

### Mengelola Riwayat
- Klik icon **pensil** untuk edit judul
- Klik icon **sampah** untuk hapus percakapan

## Konfigurasi Global

AI Chat menggunakan konfigurasi dari [AI Analysis Settings](/admin/ai_analysis_settings):
- Model AI default
- Max tokens
- Temperature

Override sementara bisa dilakukan saat membuat chat baru.

## Tips Penggunaan

### Prompt yang Efektif
❌ "Buatkan laporan"
✅ "Buatkan laporan ringkasan kehadiran karyawan untuk bulan Januari 2026 dalam format tabel"

❌ "Error"
✅ "Saya menemukan error 'Connection timeout' saat mengakses halaman user profile, bagaimana solusinya?"

### Gunakan Konteks
Jika ada error, copy-paste error message lengkap. Jika ada data, sertakan data relevan.

### Iterasi
Jika jawaban kurang sesuai:
- "Jelaskan lebih detail"
- "Buatkan versi yang lebih ringkas"
- "Tambahkan contoh konkret"

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| AI tidak responsif | Cek koneksi internet, refresh halaman |
| Respons terpotong | Batas token tercapai, mulai chat baru |
| Error 500 | Hubungi admin - kemungkinan model AI bermasalah |
| Use case tidak muncul | Pastikan use case aktif di [AI Use Cases](/admin/ai_use_cases) |

## Link Terkait

- [AI Analysis Settings](/admin/ai_analysis_settings) - Konfigurasi global AI
- [AI Models](/admin/ai_models) - Manajemen model AI
- [AI Use Cases](/admin/ai_use_cases) - Konfigurasi use case dan knowledge base
