# Statistik Cache ([/admin/cache/stats](/admin/cache/stats))

Halaman **Statistik Cache** menyediakan dashboard Redis cache yang komprehensif untuk monitoring dan mengelola performa sistem melalui operasi caching.

## Aksi Cepat

| Aksi | Cara |
|------|------|
| Lihat statistik cache | Ke [/admin/cache/stats](/admin/cache/stats) |
| Test performa cache | Klik tombol **"Test Cache Performance"** |
| Cek kesehatan | Klik tombol **"Check Health"** |
| Flush semua cache | Klik tombol **"Flush All Cache"** (⚠️ perlu konfirmasi) |
| Invalidate pattern | Masukkan pattern → Klik **"Invalidate Cache"** |

## Ikhtisar Dashboard

### Status Koneksi

- **🟢 Connected**: Redis operasional, caching aktif
- **🟡 Disconnected**: Fallback ke query database
- **Connection Info**: Host, port, nomor database
- **Uptime**: Berapa lama Redis sudah berjalan

### Statistik Cache

| Metrik | Deskripsi | Nilai Bagus |
|--------|-----------|-------------|
| **Total Keys** | Jumlah item yang di-cache | Bervariasi sesuai penggunaan |
| **Memory Used** | Konsumsi memory Redis | < 80% dari max |
| **Hit Rate** | Persentase keberhasilan cache | > 80% |
| **Hits** | Retrieval cache yang berhasil | Meningkat |
| **Misses** | Cache miss (query DB) | Rendah relatif terhadap hits |

## Operasi Cache

### Test Cache Performance

Mengukur kecepatan baca/tulis cache:

1. Klik tombol **"Test Cache Performance"**
2. Lihat hasil:
   - **Write Time**: Waktu untuk menyimpan data di cache
   - **Read Time**: Waktu untuk mengambil data dari cache
   - **Total Time**: Waktu operasi gabungan
3. **Performa Bagus**: < 10ms per operasi
4. **Performa Lambat**: > 50ms (investigasi kesehatan Redis)

### Check Health

Verifikasi koneksi dan responsivitas Redis:

1. Klik tombol **"Check Health"**
2. Respons menunjukkan:
   - ✅ **Healthy**: Redis merespons PING
   - ❌ **Unhealthy**: Masalah koneksi

### Flush All Cache ⚠️

**Peringatan:** Ini menghapus SEMUA data cache di seluruh sistem.

**Kapan Digunakan:**
- Setelah perubahan skema database
- Setelah update konfigurasi besar
- Saat debugging masalah cache
- Sebelum deployment (opsional)

**Cara Flush:**
1. Klik tombol **"Flush All Cache"**
2. Konfirmasi aksi di modal
3. Semua cache key dihapus segera
4. **Hasil**: Request berikutnya akan lebih lambat (rebuild cache)

### Invalidate Cache by Pattern

Hapus entry cache secara selektif yang cocok dengan pattern:

**Pattern Umum:**

| Pattern | Yang Dihapus | Use Case |
|---------|--------------|----------|
| `admin:users:*` | Semua cache terkait user admin | Setelah operasi CRUD user |
| `user:123:*` | Cache user tertentu | Setelah update profil user |
| `datatable:*` | Semua cache DataTable | Setelah perubahan data bulk |
| `admin:logs:*` | Cache log aktivitas | Setelah cleanup log |
| `admin:queue:*` | Cache statistik queue | Setelah operasi queue |
| `admin:permissions:*` | Cache permission/role | Setelah perubahan RBAC |

**Cara Invalidate:**
1. Masukkan pattern di text field (contoh: `admin:users:*`)
2. Klik tombol **"Invalidate Cache"**
3. **Hasil**: Hanya key yang cocok yang dihapus

**Aturan Wildcard:**
- `*` cocok dengan karakter apapun
- `user:*` menghapus `user:123`, `user:456:profile`, dll.
- `admin:*:list` menghapus `admin:users:list`, `admin:logs:list`, dll.

## Pattern Cache Key

### Memahami Cache Key

Semua cache key mengikuti pattern terstruktur:

```
{scope}:{resource}:{identifier}:{sub-resource}
```

### Pattern Key Umum

**Admin Panel:**
- `admin:users:list` - Halaman daftar user
- `admin:users:metadata` - Jumlah user dan filter
- `admin:logs:filters` - Opsi filter log
- `admin:permissions:roles` - Roles dengan permissions
- `admin:queue:stats` - Statistik queue
- `admin:ai:*` - Konfigurasi dan metadata AI
- `ai_analysis_settings:*` - Pengaturan global AI

**DataTables:**
- `datatable:users:{base64_query}` - Hasil DataTable user
- `datatable:logs:{base64_query}` - Hasil DataTable log
- `datatable:jobs:{base64_query}` - Hasil DataTable jobs

**User-Specific:**
- `user:{userId}:permissions` - Cache permissions user
- `user:{userId}:profile` - Data profil user
- `user:{userId}:settings` - Preferensi user

### Cache TTL (Time-To-Live)

| Tipe Cache | TTL | Alasan |
|------------|-----|--------|
| User permissions | 5 menit | Sensitif keamanan |
| Activity logs | 2 menit | Sering diupdate |
| User list | 5 menit | Perubahan sedang |
| Queue stats | 2 menit | Monitoring real-time |
| Role permissions | 5 menit | Jarang berubah |
| DataTable queries | 2 menit | Pencarian user-specific |

## Interpretasi Stats

### Hit Rate Tinggi (> 80%)

✅ **Tanda Bagus:**
- Cache efektif
- Beban database berkurang
- Response time cepat
- Sistem perform baik

### Hit Rate Rendah (< 50%)

⚠️ **Tanda Peringatan:**
- Cache TTL terlalu pendek
- Data sangat dinamis
- User membuat query unik
- Cache di-flush terlalu sering

**Solusi:**
- Tingkatkan TTL untuk data stabil
- Review logika invalidasi cache
- Tambah lebih banyak pattern cache
- Pertimbangkan limit memory Redis

### Penggunaan Memory Tinggi (> 80%)

⚠️ **Aksi Diperlukan:**
- Review jumlah cache key
- Identifikasi objek cache besar
- Pertimbangkan TTL lebih pendek
- Flush pattern cache yang tidak digunakan
- Upgrade alokasi memory Redis

## Pattern Cache Umum

### Cache-Aside Pattern (Implementasi Saat Ini)

1. **Check cache** dulu untuk data
2. **Jika miss**: Query database
3. **Simpan di cache** untuk request berikutnya
4. **Jika hit**: Return data yang di-cache

**Manfaat:**
- Lazy loading (cache on demand)
- Resilient (bekerja jika Redis down)
- Automatic cache warming

### Strategi Invalidasi Cache

Aplikasi menggunakan **smart invalidation**:

```javascript
// Setelah pembuatan user
await invalidateCache("admin:users:*", true);
await invalidateCache("datatable:users:*", true);

// Setelah perubahan permission
await invalidateCache(`user:${userId}:permissions`, false);
await invalidateCache("admin:permissions:*", true);
```

## Skenario Umum

### Skenario 1: Halaman Loading Lambat

**Masalah:** Halaman admin terlalu lama untuk load

**Diagnosis:**
1. Ke [/admin/cache/stats](/admin/cache/stats)
2. Cek **Hit Rate** - jika < 50%, cache tidak efektif
3. Klik **"Test Cache Performance"** - cek response time
4. Review **Total Keys** - jika sangat rendah, cache tidak digunakan

**Solusi:**
- Jika Redis disconnected: Cek service Redis
- Jika high miss rate: Tingkatkan cache TTL
- Jika slow performance: Cek memory/CPU Redis

### Skenario 2: Data Lama Muncul

**Masalah:** Data yang diupdate tidak muncul segera

**Penyebab:** Data cache tidak diinvalidasi setelah update

**Solusi:**
1. **Segera**: Invalidate pattern spesifik:
   - Untuk users: `admin:users:*`
   - Untuk logs: `admin:logs:*`
   - Untuk permissions: `user:*:permissions`
2. **Opsi nuklir**: Flush semua cache (⚠️ impact performa)
3. **Fix code**: Pastikan controller memanggil `invalidateCache()` setelah update

### Skenario 3: Memory Overflow

**Masalah:** Redis kehabisan memory

**Diagnosis:**
1. Cek metrik **Memory Used**
2. Review jumlah **Total Keys**
3. Cari pertumbuhan cache yang tidak biasa

**Solusi:**
1. **Segera**: Flush pattern cache lama
2. **Jangka pendek**: Kurangi cache TTL
3. **Jangka panjang**:
   - Tingkatkan limit memory Redis
   - Implementasi policy expiration cache key
   - Review apa yang di-cache (hindari objek besar)

## Troubleshooting

| Masalah | Diagnosis | Solusi |
|---------|-----------|--------|
| Cache tidak bekerja | Redis disconnected | Cek service Redis, restart jika perlu |
| Performa cache lambat | Penggunaan memory tinggi | Flush cache, cek resource Redis |
| Data lama | Cache tidak diinvalidasi | Gunakan pattern invalidation atau flush |
| Terlalu banyak keys | Tidak ada expiration policy | Review cache TTL, implementasi cleanup |
| Hit rate rendah | Pattern cache salah | Review strategi cache aplikasi |
| Memory tinggi | Objek cache besar | Kurangi ukuran data cache, tingkatkan memory |

## Best Practice Monitoring Cache

### Cek Rutin

- Monitor hit rate harian
- Review penggunaan memory mingguan
- Test performa bulanan
- Flush cache setelah deployment (opsional)

### Benchmark Performa

- **Write operation**: < 5ms
- **Read operation**: < 2ms
- **Hit rate**: > 80%
- **Memory usage**: < 70%

### Kapan Flush

✅ **Waktu Bagus:**
- Setelah migrasi database
- Setelah perubahan struktur RBAC
- Saat deployment (opsional)
- Saat debugging masalah cache

❌ **Hindari Flush:**
- Saat jam sibuk
- Sebagai tugas maintenance rutin
- Tanpa memahami masalahnya
- Saat invalidation spesifik sudah bekerja
