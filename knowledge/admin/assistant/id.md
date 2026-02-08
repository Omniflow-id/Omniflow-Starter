# AI Assistant - Context-Aware Sidebar

AI Assistant adalah asisten AI sidebar yang memberikan bantuan berdasarkan halaman yang sedang Anda buka.

## Apa itu AI Assistant?

AI Assistant adalah panel chat sliding yang muncul dari pojok kanan bawah layar saat Anda klik tombol **biru** dengan ikon 🤖 robot.

Bedanya dengan AI Chat (halaman penuh):
- **AI Assistant**: Sidebar cepat, context-aware, tidak menyimpan history
- **AI Chat**: Halaman penuh, conversation-based, menyimpan riwayat

## Cara Menggunakan

### 1. Buka AI Assistant
Klik tombol **biru** dengan ikon 🤖 di pojok kanan bawah layar.

### 2. Lihat Konteks
AI Assistant secara otomatis mendeteksi:
- **Halaman aktif**: Contoh "Users", "Dashboard", "Settings"
- **Role Anda**: Admin, Manager, dll
- **Bahasa**: Sesuai setting bahasa aplikasi

### 3. Mulai Bertanya
Ketik pertanyaan terkait halaman yang sedang Anda buka:

**Contoh di halaman Users:**
- "Bagaimana cara menambah user baru?"
- "Apa bedanya role Admin dan Manager?"
- "Cara reset password user?"

**Contoh di halaman Dashboard:**
- "Jelaskan metrik yang ditampilkan"
- "Apa artinya user aktif vs non-aktif?"

**Contoh di halaman Settings:**
- "Fungsi pengaturan ini apa?"
- "Bagaimana cara mengubah konfigurasi X?"

### 4. Respons Real-time
- AI merespons dengan streaming (karakter per karakter)
- Bisa scroll untuk melihat konteks sebelumnya
- Bisa perluas panel dengan tombol expand (↔️)

## Fitur Unggulan

### Context-Aware
AI tahu halaman apa yang sedang Anda buka dan menyesuaikan jawabannya.

### Voice Input (Microphone)
Klik ikon 🎤 microphone untuk input suara (jika browser mendukung).

### Text-to-Speech
Klik ikon 🔊 speaker di pesan AI untuk membacakan jawaban.

### Expand/Collapse
- **Kecil**: 400px (default)
- **Lebar**: 50% layar (tombol expand)

### History Navigation
Tekan tombol "Back" browser untuk menutup panel (mobile-friendly).

## Tips Penggunaan

### Tanya Spesifik
❌ "Gimana ini?"
✅ "Cara mengubah permission role Admin?"

### Gunakan Konteks Halaman
Karena AI tahu halaman Anda, Anda bisa tanya singkat:
- "Fungsi tombol ini?" (sambil menunjuk tombol di layar)
- "Jelaskan kolom ini" (sambil menunjuk tabel)

### Multi-bahasa
AI merespons sesuai bahasa aplikasi (Indonesia/English).

## Konfigurasi

AI Assistant menggunakan:
- [AI Analysis Settings](/admin/ai_analysis_settings) untuk model & parameter
- Knowledge base dari folder `@knowledge/` untuk konteks halaman

## Bedanya dengan Fitur AI Lain

| Fitur | Lokasi | Simpan History | Fokus |
|-------|--------|----------------|-------|
| **AI Assistant** | Sidebar | ❌ Tidak | Bantuan halaman aktif |
| **AI Copilot** | Floating FAB | ❌ Tidak | Analisis layar |
| **AI Chat** | Halaman penuh | ✅ Ya | Percakapan mendalam |

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Panel tidak terbuka | Refresh halaman, cek JavaScript console |
| Respons tidak relevan | Periksa apakah knowledge tersedia untuk halaman ini |
| Voice input tidak jalan | Pastikan browser support & izin microphone diberikan |
| TTS tidak berfungsi | Pastikan browser support Web Speech API |
| Konteks salah | Refresh halaman untuk reset context detection |

## Catatan Privasi

⚠️ AI Assistant tidak menyimpan percakapan. Setiap sesi adalah fresh session.

⚠️ Konteks halaman dibaca client-side, tidak dikirim ke server kecuali pesan Anda.
