# Manajemen Model AI ([/admin/ai_models](/admin/ai_models))

Modul **AI Models** adalah inti dari kecerdasan Omniflow. Modul ini memungkinkan administrator untuk mengonfigurasi koneksi ke berbagai penyedia LLM (Large Language Model) seperti OpenAI, Anthropic, atau model lokal yang kompatibel.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| **Tambah Model** | Klik **Tambah Model Baru** → Isi detail |
| **Edit Model** | Klik **Edit** (Ikon Pensil) pada baris |
| **Ganti Status** | Klik tombol **Status** (Aktif/Tidak Aktif) |
| **Hapus Model** | Klik **Hapus** (Ikon Sampah) |

## Bidang Konfigurasi

| Bidang | Deskripsi | Contoh |
|--------|-----------|--------|
| **Nama** | Nama tampilan untuk referensi internal | `GPT-4 Omni`, `Claude 3.5 Sonnet` |
| **Varian Model** | String ID API yang dibutuhkan oleh penyedia | `gpt-4o`, `claude-3-5-sonnet-20240620` |
| **URL API** | Endpoint lengkap untuk chat completions | `https://api.openai.com/v1/chat/completions` |
| **Kunci API** | Kunci rahasia (disimpan terenkripsi) | `sk-proj-123...` |
| **Is Active** | Mengontrol ketersediaan di Use Case | `True` / `False` |

## Dukungan Penyedia

Omniflow mendukung penyedia apa pun yang kompatibel dengan format **OpenAI Chat Completion API**.

### 1. OpenAI (Default)
- **URL**: `https://api.openai.com/v1` (atau path lengkap `/chat/completions`)
- **Model**: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`

### 2. DeepSeek (via Kompatibilitas)
- **URL**: `https://api.deepseek.com`
- **Model**: `deepseek-chat`, `deepseek-coder`

### 3. Model Lokal (Ollama/vLLM)
- **URL**: `http://localhost:11434/v1`
- **Model**: `llama3`, `mistral`
- **Catatan**: Pastikan server Omniflow dapat mengakses IP jaringan lokal.

## Keamanan & Enkripsi

- **Enkripsi**: Kunci API dienkripsi sebelum disimpan ke database menggunakan AES-256.
- **Tampilan**: Kunci tidak pernah ditampilkan dalam teks biasa setelah disimpan. Anda hanya dapat menggantinya.
- **Transmisi**: Request dilakukan dari server-ke-server; kunci tidak pernah menyentuh browser klien.

## Skenario Umum

### Skenario 1: Rotasi Kunci API (Key Rotation)
Jika kunci terkompromi atau kedaluwarsa:
1. Buka [/admin/ai_models](/admin/ai_models).
2. Edit model yang terdampak.
3. Tempel kunci baru di kolom **API Key**.
4. Simpan. Kunci lama akan segera diganti.

### Skenario 2: Menambahkan Logika Hemat Biaya
1. Buat model bernama "AI Hemat Anggaran".
2. Gunakan varian yang lebih murah seperti `gpt-4o-mini`.
3. Setel sebagai **Aktif**.
4. Buka **Use Cases** dan tetapkan "AI Hemat Anggaran" untuk tugas umum/non-prioritas.

## Pemecahan Masalah (Troubleshooting)

| Masalah | Cek | Resolusi |
|---------|-----|----------|
| **Gagal Terhubung** | URL API | Pastikan URL diakhiri dengan `/v1` atau `/chat/completions` sesuai library. |
| **401 Unauthorized** | API Key | Kunci mungkin salah atau kedaluwarsa. Perbarui. |
| **Model Tidak Ditemukan** | Varian Model | Cek salah ketik pada ID model (misal: `gpt-4` vs `gpt-4o`). |
| **Timeout/Lambat** | Jaringan | Periksa pengaturan firewall atau proxy server. |

> **Tips Pro**: Gunakan fitur **"Tes Koneksi"** (jika tersedia) atau buat Use Case "Tes" sementara untuk memverifikasi model baru sebelum diluncurkan ke pengguna.
