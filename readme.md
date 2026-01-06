# SIAK Backend API

Backend Express.js dengan MongoDB untuk aplikasi SIAK (Sistem Informasi Absensi & Akademik).

## Fitur

- ✅ Authentication (Login)
- ✅ System Activation
- ✅ Pengaturan Jenjang Pendidikan
- ✅ Auto-creation default admin user

## Persyaratan

- Node.js (v18 atau lebih baru)
- MongoDB (local atau remote)

## Instalasi

1. Install dependencies:
```bash
cd server
npm install
```

2. Buat file `.env` dari `.env.example`:
```bash
cp .env.example .env
```

3. Edit file `.env` dan sesuaikan konfigurasi:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/siak_db
NODE_ENV=development
```

4. Pastikan MongoDB berjalan:
```bash
# Untuk MongoDB lokal
mongod
```

5. Jalankan server:
```bash
npm start
# atau untuk development dengan auto-reload
npm run dev
```

Server akan berjalan di `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/current-user` - Get current user info

### System Activation
- `GET /api/activation` - Get system activation status
- `GET /api/activation/check` - Check if system is active
- `POST /api/activation/activate` - Activate system
- `POST /api/activation/initialize` - Initialize system activation

### Jenjang Pendidikan
- `GET /api/jenjang/active` - Get active jenjang
- `GET /api/jenjang` - Get all jenjang settings
- `POST /api/jenjang` - Set jenjang pendidikan

## Default Admin Account

Saat backend pertama kali dijalankan, akun admin default akan otomatis dibuat:
- Email: `admin@sekolah.com`
- Password: `admin123`

## Struktur Database

### Collections:
- `users` - Data pengguna (admin, guru, murid, kepala_sekolah)
- `systemactivations` - Status aktivasi sistem
- `pengaturanjenjangpendidikans` - Pengaturan jenjang pendidikan
- `datakepseks` - Data kepala sekolah

## Development

Backend menggunakan:
- Express.js untuk web framework
- Mongoose untuk MongoDB ODM
- CORS untuk cross-origin requests

