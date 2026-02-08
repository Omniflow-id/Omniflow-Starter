# Pengaturan AI Analysis

## Apa itu AI Analysis Settings?

AI Analysis Settings adalah pengaturan global untuk mengkonfigurasi perilaku AI di seluruh aplikasi Omniflow. Pengaturan ini menentukan:

- Model AI mana yang digunakan
- Parameter seperti max tokens dan temperature
- Fitur konteks yang diaktifkan

## Fitur yang Terpengaruh

Pengaturan ini mempengaruhi dua fitur AI utama:

1. **AI Assistant** - Sidebar chat context-aware di pojok kanan bawah
2. **AI Copilot** - Floating button untuk analisis layar (magic sparkles icon)

## Parameter Konfigurasi

### Model AI
Pilih model AI yang aktif dari daftar model yang telah dikonfigurasi di [AI Models](/admin/ai_models).

### Max Tokens
- **Default**: 4096
- **Fungsi**: Batas maksimum token (kata/karakter) dalam respons AI
- **Tips**: Naikkan untuk respons lebih panjang, turunkan untuk hemat resource

### Temperature
- **Default**: 0.1
- **Range**: 0.0 - 2.0
- **Fungsi**: Mengontrol kreativitas/randomness respons AI
  - **Rendah (0.0-0.3)**: Respons konsisten, faktual, predictable
  - **Sedang (0.4-0.7)**: Balance antara kreativitas dan konsistensi
  - **Tinggi (0.8-2.0)**: Respons kreatif, bervariasi, lebih human-like

### Fitur Konteks

#### Enable Context
Aktifkan konteks pengguna untuk personalisasi respons AI.

#### Enable Company Stats
Sertakan statistik perusahaan/sistem dalam konteks analisis AI.

#### Enable Activity Tracking
Sertakan data aktivitas user dalam konteks AI.

## Cara Mengubah Pengaturan

1. Klik menu **AI Management** → **Pengaturan Analisis AI** di sidebar
2. Pilih model AI dari dropdown
3. Sesuaikan max tokens dan temperature sesuai kebutuhan
4. Aktifkan/nonaktifkan fitur konteks yang diinginkan
5. Klik **Simpan Pengaturan**

## Tips Penggunaan

### Untuk Produksi
- Gunakan temperature **0.1-0.3** untuk respons konsisten
- Set max tokens sesuai kebutuhan (2048-4096 ideal)
- Aktifkan semua fitur konteks untuk hasil optimal

### Untuk Development/Testing
- Temperature bisa lebih tinggi (0.5-0.7) untuk eksplorasi
- Max tokens bisa diturunkan untuk menghemat cost

### Pemilihan Model
- **GPT-4o**: Model terbaru, balanced speed & quality
- **GPT-4o-mini**: Lebih cepat & hemat, cocok untuk task sederhana
- **GPT-4**: Kualitas tertinggi, cocok untuk analisis kompleks

## Troubleshooting

### Model tidak tersedia
Pastikan model AI sudah dikonfigurasi di halaman [AI Models](/admin/ai_models) dan statusnya **Aktif**.

### Perubahan tidak berlaku
Perubahan pengaturan langsung berlaku tanpa restart server. Jika tidak berfungsi:
1. Refresh halaman
2. Logout dan login kembali
3. Clear browser cache

## Link Terkait

- [AI Models](/admin/ai_models) - Konfigurasi model AI
- [AI Use Cases](/admin/ai_use_cases) - Use case dan knowledge base
- [AI Chat](/admin/chat) - Interface percakapan AI
