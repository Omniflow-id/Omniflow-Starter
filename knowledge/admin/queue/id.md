# Queue Management ([/admin/queue](/admin/queue))

Sistem **Queue Management** menyediakan monitoring dan kontrol atas RabbitMQ job queue dan pemrosesan background task di sistem Omniflow.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat statistik queue | Ke [/admin/queue](/admin/queue) |
| Kirim test job | Klik tombol **"Send Test Job"** |
| Lihat semua jobs | Ke [/admin/queue/jobs](/admin/queue/jobs) |
| Lihat failed jobs | Ke [/admin/queue/failed](/admin/queue/failed) |
| Retry failed jobs | Ke [/admin/queue/failed](/admin/queue/failed) → Tombol **Retry** |

## Dashboard Statistik Queue

### Ikhtisar Status Job

| Status | Deskripsi | Badge Warna |
|--------|-----------|-------------|
| **Pending** | Jobs menunggu untuk diproses | Yellow |
| **Processing** | Jobs sedang dikerjakan | Blue |
| **Completed** | Jobs selesai dengan sukses | Green |
| **Failed** | Jobs yang error | Red |

### Status Koneksi RabbitMQ

- **🟢 Connected**: RabbitMQ operasional, jobs diproses
- **🔴 Disconnected**: Fallback ke mode database-only
- **⚙️ Circuit Breaker States**:
  - **CLOSED**: Operasi normal, semua jobs diproses
  - **OPEN**: Proteksi service aktif, jobs hanya disimpan ke database
  - **HALF_OPEN**: Testing recovery, pemrosesan job terbatas

## Sistem Circuit Breaker

Circuit breaker melindungi sistem dari kegagalan RabbitMQ:

### States

**CLOSED (Normal)**
- Semua jobs dikirim ke RabbitMQ
- Workers memproses jobs
- Fungsionalitas queue penuh

**OPEN (Protected)**
- Jobs hanya disimpan ke database
- Tidak ada percobaan koneksi RabbitMQ
- Mencegah cascade failures
- **Durasi**: 1 menit sebelum retry

**HALF_OPEN (Testing)**
- Pemrosesan job terbatas
- Testing apakah RabbitMQ sudah pulih
- Auto-close jika berhasil
- Re-open jika gagal

### Kondisi Trigger

Circuit breaker terbuka setelah:
- 5 kegagalan RabbitMQ berturut-turut
- Error timeout koneksi
- Kegagalan autentikasi

### Recovery

1. Tunggu periode cooldown (1 menit)
2. Circuit breaker masuk HALF_OPEN
3. Kirim test job
4. **Jika sukses**: Circuit tutup, lanjutkan operasi normal
5. **Jika gagal**: Circuit buka lagi, tunggu siklus lagi

## Fitur Test Job

Kirim test job untuk verifikasi fungsionalitas queue:

### Cara Kirim Test Job

1. Ke [/admin/queue](/admin/queue)
2. Klik tombol **"Send Test Job"**
3. Job dikirim ke `test_queue`
4. **Sukses**: Job muncul di [/admin/queue/jobs](/admin/queue/jobs)
5. **Worker logs**: Cek console untuk "Processing job from test_queue"

### Apa yang Dilakukan Test Jobs

- Verifikasi koneksi RabbitMQ
- Test pemrosesan worker
- Validasi lifecycle job
- Cek recovery circuit breaker

**Data Test Job:**
```json
{
  "type": "test_job",
  "message": "Hello from admin panel",
  "timestamp": "2025-01-04T10:30:00.000Z",
  "triggeredBy": "admin@omniflow.id"
}
```

## Job Management

### Lihat Semua Jobs

Navigasi ke [/admin/queue/jobs](/admin/queue/jobs) untuk management job komprehensif:

- **Status Filtering**: All, Pending, Processing, Completed, Failed
- **Detail Job**: ID, queue, status, attempts, timestamps
- **JSON Data Viewer**: Klik untuk expand data job
- **Pagination**: Navigasi melalui daftar job besar
- **Retry Failed**: Retry langsung dari job listing

### Struktur Data Job

Setiap job berisi:
- **ID**: Identifier job unik
- **Queue**: Nama target queue (`test_queue`, `email_queue`, dll.)
- **Data**: Payload JSON dengan instruksi job
- **Status**: State job saat ini
- **Attempts**: Jumlah retry vs max attempts
- **Timestamps**: Waktu created, started, completed
- **Error**: Detail kegagalan (untuk failed jobs)

## Navigasi

### Route Queue Management

| Route | Tujuan |
|-------|--------|
| `/admin/queue` | Dashboard statistik utama |
| `/admin/queue/jobs` | Interface management semua jobs |
| `/admin/queue/failed` | Failed jobs dengan fungsionalitas retry |

### Halaman Terkait

- **Activity Logs**: [/admin/log](/admin/log) - Lihat log operasi queue
- **Cache Stats**: [/admin/cache/stats](/admin/cache/stats) - Queue stats di-cache di sini

## Skenario Umum

### Skenario 1: Test Fungsionalitas Queue

**Cara Verifikasi:**
1. Ke [/admin/queue](/admin/queue)
2. Cek status koneksi (harus 🟢 Connected)
3. Klik **"Send Test Job"**
4. Navigasi ke [/admin/queue/jobs](/admin/queue/jobs)
5. Verifikasi job muncul dengan status "Completed"

### Skenario 2: Koneksi RabbitMQ Hilang

**Gejala:**
- Status koneksi menunjukkan 🔴 Disconnected
- Circuit breaker state: OPEN
- Jobs baru pending (tidak diproses)

**Langkah Recovery:**
1. Cek status service RabbitMQ
2. Restart RabbitMQ jika perlu
3. Tunggu circuit breaker masuk HALF_OPEN (1 menit)
4. Kirim test job untuk verifikasi recovery
5. Circuit harus tutup otomatis

### Skenario 3: Jobs Stuck di Processing

**Diagnosis:**
1. Ke [/admin/queue/jobs](/admin/queue/jobs)
2. Filter berdasarkan status "Processing"
3. Cek timestamp - jika > 10 menit, kemungkinan stuck
4. Review log worker untuk error

**Solusi:**
- Restart proses worker
- Cek kesehatan worker
- Review data job untuk corruption
- Jika persisten: restart RabbitMQ

### Skenario 4: Jumlah Failed Job Tinggi

**Diagnosis:**
1. Ke [/admin/queue/failed](/admin/queue/failed)
2. Review pesan error
3. Cari pattern:
   - Network errors → Masalah external service
   - Validation errors → Data job buruk
   - Timeout errors → Worker overload

**Solusi:**
- Fix masalah underlying (code, config, external service)
- Retry failed jobs dalam batch
- Jika tidak recoverable: Hapus failed jobs setelah logging

## Troubleshooting

| Masalah | Cek | Solusi |
|---------|-----|--------|
| Jobs tidak diproses | Status koneksi | Verifikasi service RabbitMQ berjalan |
| Circuit breaker open | Pesan error terakhir | Fix koneksi RabbitMQ, tunggu recovery |
| Pending count tinggi | Status worker | Pastikan workers berjalan |
| Jobs gagal berulang | Error failed jobs | Review data job dan logika worker |
| Test job tidak selesai | Log worker | Cek proses worker aktif |
| Tidak ada stats muncul | Redis cache | Verifikasi koneksi Redis |

## Arsitektur Sistem Queue

### Workers

**Active Workers:**
- `EmailWorker`: Memproses email queue jobs
- `TestWorker`: Menangani test queue jobs (development)

**Lokasi Worker:** direktori `workers/`

**Worker Management:** `WorkerManager` mengatur semua workers

### Integrasi Database

**Tabel jobs** menyimpan semua jobs:
- Penyimpanan persisten untuk durability
- Tracking dan monitoring job
- Analisis failed job
- Management retry

### Dead Letter Queue (DLQ)

**Tujuan:** Menyimpan jobs yang gagal 3+ kali

**Konfigurasi:**
- **TTL**: 24 jam (jobs auto-expire)
- **Manual Recovery**: Admin dapat melihat dan retry
- **Akses**: [/admin/queue/failed](/admin/queue/failed)

**Kapan Jobs Masuk DLQ:**
- Setelah 3 percobaan gagal
- Error tidak recoverable
- Data job invalid

## Monitoring Performa

### Metrik Kunci

- **Pending Jobs**: Harus rendah (< 100)
- **Processing Jobs**: Menandakan aktivitas worker
- **Completed Jobs**: Total jobs sukses
- **Failed Jobs**: Harus < 5% dari total

### Integrasi Cache

Statistik queue di-cache selama 2 menit:
- **Cache Key**: `admin:queue:stats`
- **Invalidation**: Setelah operasi job
- **Lihat Cache**: [/admin/cache/stats](/admin/cache/stats)

### Activity Logging

Semua operasi queue di-log:
- Pembuatan job
- Penyelesaian job
- Kegagalan job
- Operasi retry
- Perubahan state circuit breaker

**Lihat Logs:** [/admin/log](/admin/log)

## Best Practices

### Monitoring

✅ **Cek Rutin:**
- Monitor pending count harian
- Review failed jobs mingguan
- Test queue bulanan
- Cek circuit breaker state

### Strategi Job Retry

✅ **Praktik Bagus:**
- Retry failed jobs setelah fix root cause
- Review error pattern sebelum bulk retry
- Pertahankan DLQ TTL di 24 jam

❌ **Hindari:**
- Retry semua failed jobs tanpa analisis
- Mengabaikan failure pattern
- Membiarkan DLQ tumbuh tanpa batas

### Deployment Production

✅ **Checklist:**
- Verifikasi koneksi RabbitMQ
- Pastikan workers berjalan
- Cek circuit breaker CLOSED
- Kirim test job untuk verifikasi
- Monitor selama jam pertama
