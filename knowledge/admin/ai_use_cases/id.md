# Konfigurasi AI Use Cases ([/admin/ai_use_cases](/admin/ai_use_cases))

Use Case AI adalah inti cara membagi dan mengkhususkan asisten AI Anda di berbagai departemen dan tugas dalam Omniflow.

## Konsep
Sebuah **Use Case** menggabungkan:
1. **Siapa** (Peran/Role: HR, Manajer, Admin)
2. **Apa** (Pengetahuan: Kontrak, FAQ, Database)
3. **Bagaimana** (Model: GPT-4, Llama 3)
4. **Perilaku** (System Prompts)

Ini memastikan bahwa seorang Manajer HR mendapatkan asisten yang berfokus pada data karyawan, sedangkan Pengguna Keuangan mendapatkan yang berfokus pada akuntansi.

## Menyiapkan Use Case

### 1. Info Umum
- **Nama**: Nama yang muncul di chatbot (misal: "HR Assistant").
- **Deskripsi**: Catatan internal tentang tujuannya.
- **Model**: Pilih model aktif dari [AI Models](/admin/ai_models).

### 2. Rekayasa Prompt (Prompt Engineering)
- **System Prompt**: Definisi "persona".
  - *Contoh*: "Anda adalah asisten HR yang ramah. Bersikap sopan dan profesional."
- **Pengetahuan Dasar**: Gunakan ini untuk fakta umum yang relevan dengan semua percakapan di use case ini.
  - *Contoh*: "Kebijakan perusahaan menyatakan cuti membutuhkan 3 hari kerja."
- **Temperatur**: 
  - `0.2` = Ketat (Baik untuk pencarian data, SQL).
  - `0.7` = Seimbang (Baik untuk obrolan, draft email).
  - `1.0` = Kreatif (Baik untuk brainstorming).

### 3. Penugasan Peran
- **Pilih Role**: Tentukan peran pengguna mana yang dapat mengakses use case ini.
- **Prioritas**: Jika pengguna memiliki beberapa peran, use case mana yang default? (Biasanya ditangani oleh logika atau seleksi).

> **Tips**: Tidak menetapkan peran mungkin membuatnya menjadi "Fallback Global" atau tidak terlihat. Periksa detail implementasi.

## Contoh

### Skenario A: Asisten Koding (Dev Internal)
- **Role**: `Developer`
- **Model**: `Claude 3.5 Sonnet` (Bagus untuk kode)
- **Prompt**: "Anda adalah pakar full-stack engineer. Tulis kode yang rapi dan modular."
- **Temp**: `0.3` (Presisi)

### Skenario B: Dukungan Pelanggan (Tim CS)
- **Role**: `Support`
- **Model**: `GPT-4o` (Cepat dan simpatik)
- **Prompt**: "Anda adalah agen support. Mohon maaf atas masalah dan tawarkan solusi berdasarkan FAQ."
- **Temp**: `0.6` (Percakapan)

## Pemecahan Masalah (Troubleshooting)

| Masalah | Penyebab | Perbaikan |
|---------|----------|-----------|
| **Use Case Tidak Muncul** | Ketidakcocokan Role | Periksa apakah peran Anda saat ini dipilih dalam Use Case. |
| **Error Model** | Model Tidak Aktif | Model yang ditautkan di `/admin/ai_models` mungkin tidak aktif atau dihapus. |
| **Respons Buruk** | Prompt Lemah | Tingkatkan System Prompt. Tambahkan contoh output yang diinginkan. |

## Lanjutan: Injeksi Konteks
Omniflow secara otomatis menyuntikkan:
- **Konteks Pengguna**: Nama, Peran, Email.
- **Waktu/Tanggal**: Timestamp saat ini.
- **Konteks Halaman**: Di mana pengguna sedang menavigasi (misal: melihat "Profil User").

Anda dapat merujuk ini dalam prompt Anda: "Selalu panggil pengguna dengan nama mereka."
