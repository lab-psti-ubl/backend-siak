# Script Migrasi Data User ke Guru dan Murid

## Deskripsi

Script ini digunakan untuk memindahkan data dari collection `User` ke collection terpisah:
- Data dengan `role: 'guru'` → dipindahkan ke collection `Guru`
- Data dengan `role: 'murid'` → dipindahkan ke collection `Murid`
- Data dengan `role: 'admin'` atau `'kepala_sekolah'` → tetap di collection `User`

## Cara Menjalankan

### Opsi 1: Menggunakan npm script (Recommended)

```bash
cd server
npm run migrate:user
```

### Opsi 2: Langsung menggunakan node

```bash
cd server
node scripts/migrateUserToGuruMurid.js
```

## Fitur Script

1. **Validasi Data**: 
   - Mengecek apakah data sudah ada di collection tujuan (berdasarkan ID atau email)
   - Skip data yang sudah ada untuk menghindari duplikasi

2. **Migrasi Aman**:
   - Hanya menghapus data dari collection `User` setelah berhasil dipindahkan
   - Jika terjadi error, data tetap ada di collection asal

3. **Progress Tracking**:
   - Menampilkan progress migrasi real-time
   - Menampilkan summary lengkap setelah migrasi selesai

4. **Error Handling**:
   - Menangani error per record tanpa menghentikan seluruh proses
   - Menampilkan pesan error yang jelas

## Output

Script akan menampilkan:
- Jumlah data yang ditemukan untuk dimigrasi
- Progress migrasi per record
- Summary lengkap:
  - Jumlah data yang berhasil dimigrasi
  - Jumlah data yang di-skip (sudah ada)
  - Jumlah data yang dihapus dari collection User

## Catatan Penting

⚠️ **BACKUP DATA SEBELUM MENJALANKAN MIGRASI!**

1. Script ini akan **menghapus** data dari collection `User` setelah berhasil dipindahkan
2. Pastikan database sudah di-backup sebelum menjalankan script
3. Script ini **idempotent** - bisa dijalankan berkali-kali tanpa masalah (data yang sudah ada akan di-skip)
4. Pastikan koneksi database sudah benar di file `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/siak_db
   ```

## Troubleshooting

### Error: "Cannot find module"
Pastikan Anda menjalankan script dari folder `server`:
```bash
cd server
npm run migrate:user
```

### Error: "MongoDB Connection Error"
Pastikan:
1. MongoDB sudah berjalan
2. `MONGODB_URI` di file `.env` sudah benar
3. Database sudah ada

### Data tidak terhapus dari User
Jika data tidak terhapus, kemungkinan:
1. Migrasi gagal untuk record tersebut (cek error message)
2. Data sudah dihapus sebelumnya
3. Ada masalah dengan koneksi database

## Verifikasi Setelah Migrasi

Setelah migrasi selesai, verifikasi dengan:

1. Cek collection `Guru`:
   ```javascript
   db.gurus.find().count()
   ```

2. Cek collection `Murid`:
   ```javascript
   db.murids.find().count()
   ```

3. Cek collection `User` (seharusnya hanya admin dan kepala_sekolah):
   ```javascript
   db.users.find({ role: { $in: ['guru', 'murid'] } }).count()
   // Seharusnya return 0
   ```

