# Failed Jobs Management ([/admin/queue/failed](/admin/queue/failed))

Interface **Failed Jobs Management** menyediakan tools untuk melihat, menganalisis, dan retry jobs yang error saat processing.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat failed jobs | Ke [/admin/queue/failed](/admin/queue/failed) |
| Retry single job | Klik tombol **"Retry"** di row job |
| Retry multiple jobs | Klik **"Retry Failed Jobs"** (batch) |
| Lihat detail error | Klik untuk expand pesan error |
| Cek semua jobs | Ke [/admin/queue/jobs](/admin/queue/jobs) |

## Ikhtisar Failed Jobs

### Apa itu Failed Jobs?

Jobs yang error saat processing:
- **Worker Errors**: Code exceptions, crashes
- **Network Errors**: External service timeouts
- **Data Errors**: Payload invalid, field hilang
- **Resource Errors**: Memory limits, masalah database

### Kapan Jobs Gagal

Jobs ditandai "failed" ketika:
1. Worker throw unhandled exception
2. Network timeout terjadi
3. External service return error
4. Validasi data gagal
5. Max attempts exceeded (3 retries)

## Display Informasi Job

### Daftar Failed Jobs

| Kolom | Deskripsi |
|-------|-----------|
| **ID** | Identifier job unik |
| **Queue** | Queue asal (email_queue, test_queue) |
| **Data** | Payload JSON job (expandable) |
| **Attempts** | Jumlah retry (contoh: 3/3 = max reached) |
| **Error** | Pesan error detail (expandable) |
| **Created** | Waktu pembuatan job awal |
| **Started** | Waktu percobaan processing terakhir |
| **Actions** | Tombol retry |

### Display Pesan Error

**Detail Error Expandable:**
1. Klik pada teks error untuk expand
2. Lihat pesan error lengkap dan stack trace
3. Identifikasi root cause
4. Klik lagi untuk collapse

**Tipe Error:**

| Pattern Error | Kemungkinan Penyebab |
|---------------|----------------------|
| `Connection timeout` | Masalah network/external service |
| `Validation error` | Data job invalid |
| `Cannot read property` | Code bug, field data hilang |
| `ECONNREFUSED` | External service down |
| `SMTP error` | Masalah email server |
| `Database error` | Masalah koneksi/query database |

## Fungsionalitas Retry

### Single Job Retry

**Kapan Digunakan:**
- Setelah fix root cause
- Untuk investigasi job individual
- Testing error resolution

**Cara Retry:**
1. Identifikasi job untuk retry
2. Klik tombol **"Retry"** di row job
3. Status job berubah ke "Pending"
4. Worker mengambil job
5. Cek [/admin/queue/jobs](/admin/queue/jobs) untuk hasil

### Batch Retry

**Kapan Digunakan:**
- Setelah masalah sistemik resolved (contoh: external service kembali online)
- Network restored setelah outage
- Code bug fixed dan deployed

**Cara Batch Retry:**
1. Klik tombol **"Retry Failed Jobs"** (atas halaman)
2. Masukkan jumlah jobs untuk retry (contoh: 10, 50, 100)
3. Konfirmasi aksi
4. Sistem retry oldest failed jobs dulu
5. **Hasil**: Jobs pindah dari "Failed" ke "Pending"

**Limit Batch Retry:**
- Maksimum 100 jobs per batch (default)
- Mencegah queue overload
- Dapat retry multiple batches secara sequential

## Dead Letter Queue (DLQ)

### Apa itu DLQ?

**Dead Letter Queue** menyimpan jobs yang:
- Gagal 3+ kali
- Exceeded max retry attempts
- Ditandai sebagai "unrecoverable"

### Konfigurasi DLQ

| Setting | Nilai | Tujuan |
|---------|-------|--------|
| **TTL** | 24 jam | Auto-delete setelah 1 hari |
| **Max Attempts** | 3 | Threshold untuk DLQ |
| **Storage** | RabbitMQ DLQ | Queue terpisah dari main |

### Perilaku DLQ

**Routing Otomatis:**
1. Job gagal 3 kali
2. Dipindah ke DLQ otomatis
3. Masih visible di [/admin/queue/failed](/admin/queue/failed)
4. Dapat di-retry manual
5. Expires setelah 24 jam jika tidak di-retry

**Manfaat TTL 24 Jam:**
- Mencegah DLQ buildup
- Cleanup otomatis
- Force resolution dalam 24 jam
- Mengurangi kebutuhan storage

## Skenario Umum

### Skenario 1: Email Service Outage

**Masalah:** 50 email jobs gagal karena SMTP timeout

**Diagnosis:**
1. Ke [/admin/queue/failed](/admin/queue/failed)
2. Review pesan error: "SMTP connection timeout"
3. Semua error identik → Masalah external service

**Resolution:**
1. Verifikasi email service (SMTP) kembali online
2. Test dengan single job: Kirim test email
3. Jika sukses: Klik **"Retry Failed Jobs"**
4. Masukkan 50 → Retry semua failed email jobs
5. Monitor [/admin/queue/jobs](/admin/queue/jobs) untuk completion

### Skenario 2: Bad Job Data

**Masalah:** Individual jobs gagal dengan "Validation error"

**Diagnosis:**
1. Klik row job untuk expand kolom **Data**
2. Review payload JSON
3. Identifikasi field hilang/invalid
4. Pesan error: "Missing required field: recipient"

**Resolution:**
1. **Tidak bisa fix data**: Hapus job (jika fitur tersedia)
2. **Bisa fix data**: Update database langsung (advanced)
3. **Prevention**: Fix validasi data sebelum pembuatan job
4. **Jangan retry**: Akan gagal lagi dengan data sama

### Skenario 3: Code Bug Fixed

**Masalah:** Worker code punya bug menyebabkan 100 jobs gagal

**Proses Resolution:**
1. Developer fix bug di worker code
2. Deploy worker version baru
3. Restart worker processes
4. Ke [/admin/queue/failed](/admin/queue/failed)
5. **Retry Failed Jobs** → Masukkan 100
6. Monitor processing di [/admin/queue/jobs](/admin/queue/jobs)
7. Verifikasi successful completion

### Skenario 4: DLQ Threshold Reached

**Masalah:** Job di 3/3 attempts, di DLQ

**Pemahaman:**
- Job sudah gagal 3 kali
- Dipindah ke Dead Letter Queue
- Akan expire dalam 24 jam
- Kesempatan terakhir untuk retry

**Keputusan:**
1. **Retry**: Jika root cause fixed
2. **Ignore**: Jika job tidak lagi relevan
3. **Log & Delete**: Untuk audit trail

### Skenario 5: Network Sementara Down

**Masalah:** 20 jobs gagal saat network outage

**Quick Recovery:**
1. Verifikasi network restored
2. Test dengan ping/curl ke external services
3. Kirim test job di [/admin/queue](/admin/queue)
4. Jika test pass: **Retry Failed Jobs** → 20
5. Semua jobs harus complete sukses

## Strategi Bulk Retry

### Checklist Pre-Retry

Sebelum bulk retry:
- [ ] Root cause identified
- [ ] Issue resolved/fixed
- [ ] Test job successful
- [ ] Workers running
- [ ] Network/services available

### Ukuran Batch Retry

| Ukuran Batch | Use Case |
|--------------|----------|
| 1-10 | Testing setelah fix, investigasi individual |
| 11-50 | Small outage recovery, targeted retry |
| 51-100 | Large outage, network restoration |
| 100+ | Sequential batches, careful monitoring |

### Monitoring Setelah Retry

1. Navigasi ke [/admin/queue/jobs](/admin/queue/jobs)
2. Filter berdasarkan **"Processing"** → Cek active jobs
3. Filter berdasarkan **"Failed"** → Watch untuk re-failures
4. Filter berdasarkan **"Completed"** → Verifikasi success
5. Review error patterns jika re-failures terjadi

## Troubleshooting

| Masalah | Diagnosis | Solusi |
|---------|-----------|--------|
| Retry tidak bekerja | Worker tidak berjalan | Cek status worker, restart workers |
| Jobs re-failing segera | Root cause tidak fixed | Identifikasi dan fix underlying issue |
| Tidak bisa lihat failed jobs | Masalah database query | Cek [/admin/cache/stats](/admin/cache/stats), clear cache |
| Tombol retry disabled | Job sudah retrying | Tunggu current retry selesai |
| Jumlah DLQ tinggi | Systemic failures | Review error patterns, fix root causes |
| DLQ TTL expired | Jobs auto-deleted | Tidak bisa recover, harus resend jobs |

## Analisis Error

### Pattern Error Umum

**Network Errors:**
```
ECONNREFUSED, ETIMEDOUT, ENOTFOUND
```
- **Penyebab**: External service unavailable
- **Solusi**: Tunggu service recovery, lalu retry

**Validation Errors:**
```
Missing required field, Invalid email format
```
- **Penyebab**: Bad job data
- **Solusi**: Fix data source, jangan retry bad data

**Worker Errors:**
```
TypeError, ReferenceError, Cannot read property
```
- **Penyebab**: Code bug
- **Solusi**: Fix code, deploy, lalu retry

**Resource Errors:**
```
Out of memory, Database connection lost
```
- **Penyebab**: Resource exhaustion
- **Solusi**: Scale resources, optimize code

### Langkah Investigasi Error

1. **Group by error message** - Temukan patterns
2. **Cek timestamps** - Identifikasi outage windows
3. **Review job data** - Cari common attributes
4. **Cek external services** - Verifikasi connectivity
5. **Review worker logs** - Temukan detailed traces
6. **Correlate dengan activity logs** - System-wide view

## Titik Integrasi

### Halaman Terkait

| Halaman | Tujuan |
|---------|--------|
| **Queue Dashboard** | [/admin/queue](/admin/queue) - Overview stats |
| **All Jobs** | [/admin/queue/jobs](/admin/queue/jobs) - Complete job listing |
| **Activity Logs** | [/admin/log](/admin/log) - Retry operations audit |
| **Cache Stats** | [/admin/cache/stats](/admin/cache/stats) - Performance monitoring |

### Invalidasi Cache

Setelah operasi retry:
- `admin:queue:*` - Queue stats cache
- `datatable:jobs:*` - Jobs DataTable cache
- `datatable:failed-jobs:*` - Failed jobs DataTable cache

**Otomatis**: Sistem invalidate caches setelah retry actions

## Best Practices

### Monitoring Rutin

✅ **Harian:**
- Cek failed job count
- Review pesan error
- Identifikasi patterns

✅ **Mingguan:**
- Analisis failure trends
- Review DLQ expiration count
- Audit retry operations

### Panduan Retry

✅ **Lakukan Retry:**
- Setelah fix root cause
- Network/service restored
- Code bug patched
- Test job successful

❌ **Jangan Retry:**
- Tanpa fix cause
- Bad/corrupted data
- Obsolete jobs
- Sebelum investigasi

### Management DLQ

✅ **Praktik Bagus:**
- Monitor DLQ count
- Investigasi sebelum 24h expiration
- Dokumentasi unrecoverable failures
- Log keputusan untuk audit

❌ **Hindari:**
- Mengabaikan DLQ jobs
- Membiarkan jobs expire
- Retry tanpa analisis
- Tidak ada dokumentasi error
