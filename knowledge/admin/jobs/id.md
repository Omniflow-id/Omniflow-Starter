# All Jobs Management ([/admin/queue/jobs](/admin/queue/jobs))

Interface **All Jobs Management** menyediakan visibilitas dan kontrol komprehensif atas semua queue jobs di sistem, dengan filtering lanjutan dan informasi detail job.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat semua jobs | Ke [/admin/queue/jobs](/admin/queue/jobs) |
| Filter berdasarkan status | Klik tombol status (All, Pending, Processing, Completed, Failed) |
| Lihat detail job | Klik row untuk expand data JSON |
| Retry failed job | Ke [/admin/queue/failed](/admin/queue/failed) |
| Navigasi pages | Gunakan kontrol pagination di bawah |

## Filtering Status

### Filter yang Tersedia

| Filter | Menampilkan | Warna Badge |
|--------|-------------|-------------|
| **All** | Setiap job di sistem | Mixed |
| **Pending** | Jobs menunggu untuk diproses | Yellow (warning) |
| **Processing** | Jobs sedang berjalan | Blue (info) |
| **Completed** | Jobs selesai dengan sukses | Green (success) |
| **Failed** | Jobs yang error | Red (danger) |

### Cara Filter

1. Navigasi ke [/admin/queue/jobs](/admin/queue/jobs)
2. Klik tombol status yang diinginkan di button group
3. Halaman reload dengan hasil filtered
4. Pagination reset ke page 1

## Display Informasi Job

### Kolom Job List

| Kolom | Deskripsi | Detail |
|-------|-----------|--------|
| **ID** | Identifier job unik | Nomor auto-increment |
| **Status** | State job saat ini | Badge berwarna |
| **Queue** | Nama target queue | `test_queue`, `email_queue`, dll. |
| **Data** | Payload JSON job | Klik untuk expand |
| **Attempts** | Jumlah retry | `current / max` (contoh: 1/3) |
| **Created** | Waktu pembuatan job | Timestamp |
| **Started** | Waktu mulai processing | Null jika belum mulai |
| **Completed** | Waktu selesai | Null jika belum selesai |
| **Error** | Detail kegagalan | Hanya untuk failed jobs |

### Badge Status Job

**Pending (Yellow):**
- Job dalam antrian, menunggu worker
- Belum dikirim ke RabbitMQ atau di queue
- State normal sebelum processing

**Processing (Blue):**
- Worker sedang mengeksekusi job
- Database ditandai sebagai "processing"
- Harus selesai dalam menit

**Completed (Green):**
- Job selesai dengan sukses
- Worker return success
- Tidak ada error ditemukan

**Failed (Red):**
- Job error saat processing
- Mungkin retry tergantung attempts
- Detail error di kolom "Error"

## JSON Data Viewer

### Melihat Data Job

1. Klik pada row job di tabel
2. Kolom **Data** expand untuk menampilkan JSON terformat
3. Lihat payload job lengkap
4. Klik lagi untuk collapse

### Contoh Struktur Data

**Test Queue Job:**
```json
{
  "type": "test_job",
  "message": "Hello from admin panel",
  "timestamp": "2025-01-04T10:30:00.000Z",
  "triggeredBy": "admin@omniflow.id"
}
```

**Email Queue Job:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to Omniflow",
  "template": "welcome",
  "data": {
    "username": "jsmith",
    "loginUrl": "https://app.omniflow.id"
  }
}
```

### Handling Data Corrupt

Jika data JSON corrupt atau invalid:
- **Display**: Menampilkan pesan error daripada JSON
- **Expandable**: Masih bisa diklik untuk lihat raw data
- **Troubleshooting**: Cek worker logs untuk parsing errors

## Lifecycle Job

### Flow Job Normal

```
1. Created (Pending) → Job dikirim ke queue
2. Processing → Worker mengambil job
3. Completed → Job selesai dengan sukses
```

**Timeline:**
- **Pending**: Detik sampai menit (tergantung kedalaman queue)
- **Processing**: Detik sampai menit (tergantung tipe job)
- **Completed**: State permanen

### Flow Failed Job

```
1. Created (Pending)
2. Processing → Error ditemukan
3. Failed → Retry (jika attempts < max)
4. Processing → Retry gagal
5. Failed (Final) → Dipindah ke DLQ
```

**Logika Retry:**
- **Max Attempts**: 3 (default)
- **Retry Delay**: Exponential backoff
- **DLQ Threshold**: 3+ kegagalan

## Pagination

### Kontrol Navigasi

- **Previous**: Ke halaman sebelumnya
- **Page Numbers**: Navigasi halaman langsung
- **Next**: Ke halaman berikutnya
- **Results Per Page**: 25 jobs per halaman (default)

### Total Records

Ditampilkan di bawah:
```
Showing 1-25 of 1,250 total jobs
```

### Navigasi Halaman

1. Lihat halaman jobs saat ini
2. Klik nomor halaman atau Previous/Next
3. Halaman reload dengan set job baru
4. Filter persist di seluruh pagination

## Skenario Umum

### Skenario 1: Monitor Jobs Terbaru

**Cara Cek:**
1. Ke [/admin/queue/jobs](/admin/queue/jobs)
2. Biarkan filter di **"All"**
3. Jobs diurutkan berdasarkan ID descending (terbaru dulu)
4. Review status jobs terbaru
5. Cari failure pattern yang tidak biasa

### Skenario 2: Investigasi Processing Jobs

**Kapan Cek:**
- Jobs stuck di state "Processing"
- Dugaan worker hang
- Investigasi performa

**Cara Investigasi:**
1. Klik filter **"Processing"**
2. Cek timestamp **Started**
3. Jika > 10 menit: kemungkinan stuck
4. Review kolom **Data** untuk petunjuk
5. Cek worker logs
6. Pertimbangkan restart workers

### Skenario 3: Analisis Failed Jobs

**Proses Diagnosis:**
1. Klik filter **"Failed"**
2. Review pesan **Error**
3. Cari pattern:
   - Error sama berulang → Masalah sistemik
   - Error berbeda → Masalah kualitas data
   - Network errors → External service down
4. Klik **Data** untuk lihat job payload
5. Navigasi ke [/admin/queue/failed](/admin/queue/failed) untuk retry

### Skenario 4: Audit Job History

**Use Case:** Verifikasi job completion untuk compliance

**Proses:**
1. Filter berdasarkan **"Completed"**
2. Navigasi melalui pages
3. Review timestamp **Created** dan **Completed**
4. Hitung processing times
5. Export ke activity logs di [/admin/log](/admin/log)

### Skenario 5: Clear Jobs Lama

**Tugas Maintenance:** Hapus completed jobs lebih dari 30 hari

**Proses:**
1. Filter berdasarkan **"Completed"**
2. Review jobs terlama (halaman terakhir)
3. Catat job IDs untuk deletion
4. **Admin Action**: Database cleanup (manual)
5. **Alternatif**: Implementasi auto-cleanup cron job

## Troubleshooting

| Masalah | Diagnosis | Solusi |
|---------|-----------|--------|
| Tidak ada jobs muncul | Queue kosong atau masalah filter | Cek filter "All", verifikasi jobs exist |
| Jobs stuck di Pending | Workers tidak berjalan | Cek status worker, restart jika perlu |
| Jobs stuck di Processing | Worker hang atau operasi lama | Review worker logs, restart workers |
| Jumlah failed job tinggi | Error sistemik | Cek [/admin/queue/failed](/admin/queue/failed) untuk errors |
| JSON tidak expand | Error JavaScript browser | Refresh halaman, cek console |
| Pagination tidak bekerja | Masalah cache atau session | Clear browser cache, refresh |

## Pertimbangan Performa

### Implementasi DataTable

- **Server-Side Processing**: Menangani jutaan jobs
- **Pagination**: Load hanya 25 jobs per halaman
- **Database Indexing**: Query cepat pada status, queue, created_at
- **Cache Integration**: Hasil di-cache selama 2 menit

### Perilaku Cache

**Pattern Cache Key:**
```
datatable:jobs:{base64_query}
```

**TTL**: 2 menit

**Invalidation:** Otomatis setelah:
- Perubahan status job
- Jobs baru dibuat
- Failed job retries

### Lihat Cache Stats

Cek performa cache di [/admin/cache/stats](/admin/cache/stats):
- Hit rate untuk job queries
- Penggunaan memory
- Response times

## Titik Integrasi

### Halaman Terkait

| Halaman | Tujuan | Link |
|---------|--------|------|
| **Queue Dashboard** | Statistik ikhtisar | [/admin/queue](/admin/queue) |
| **Failed Jobs** | Management retry | [/admin/queue/failed](/admin/queue/failed) |
| **Activity Logs** | Audit operasi job | [/admin/log](/admin/log) |
| **Cache Stats** | Monitoring performa | [/admin/cache/stats](/admin/cache/stats) |

### Sistem Worker

**Lokasi Worker:** direktori `workers/`

**Active Workers:**
- `EmailWorker` - Pemrosesan email queue
- `TestWorker` - Pemrosesan test queue

**Worker Manager:** Mengatur semua workers saat startup

### Skema Database

**Tabel jobs:**
```sql
- id (primary key, auto-increment)
- queue (string, indexed)
- data (JSON payload)
- status (enum: pending, processing, completed, failed)
- attempts (integer)
- max_attempts (integer, default 3)
- error (text, nullable)
- available_at (timestamp)
- started_at (timestamp, nullable)
- completed_at (timestamp, nullable)
- created_at, updated_at
```

## Best Practices

### Monitoring Rutin

✅ **Cek Harian:**
- Review failed job count
- Cek processing job ages
- Monitor pending queue depth
- Verifikasi worker connectivity

### Job Cleanup

✅ **Maintenance:**
- Archive completed jobs bulanan
- Hapus failed jobs setelah resolution
- Pertahankan 90 hari terakhir untuk audit
- Export ke long-term storage jika perlu

### Optimasi Performa

✅ **Optimasi:**
- Pertahankan total job count < 1 juta
- Index kolom yang sering di-query
- Gunakan cache TTL yang sesuai
- Monitor performa database query
