import mongoose from 'mongoose';
import User from '../models/User.js';
import SystemActivation from '../models/SystemActivation.js';
import { hashPassword, comparePassword, isPasswordHashed } from '../utils/passwordUtils.js';

/**
 * Reset database - menghapus semua data kecuali data default yang diperlukan
 * Data yang dipertahankan:
 * - SystemActivation (status aktivasi sistem)
 * - User admin default (akan dibuat ulang jika tidak ada)
 * 
 * Data yang akan dihapus dan diinisialisasi ulang:
 * - Semua collections lainnya akan dihapus
 * - Data default akan dibuat ulang melalui fungsi initialize di database.js
 */
// Hash default untuk kode aktivasi awal (berpasangan dengan sandi 'gst')
const DEFAULT_ACTIVATION_CODE_HASH = '$2a$10$WXO7BLwVGiq6kQzmGa4heeHhm4B0GQbke1Vl8L4pUWne71jVdw6lq';

export const resetDatabase = async (req, res) => {
  try {
    // Pastikan hanya admin yang bisa reset database
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat mereset database',
      });
    }

    // Verifikasi sandi aktivasi
    const { activationPassword } = req.body;
    if (!activationPassword) {
      return res.status(400).json({
        success: false,
        message: 'Sandi aktivasi diperlukan untuk mereset database',
      });
    }

    // Verify activation password berdasarkan SystemActivation (hash bcrypt)
    const activation = await SystemActivation.findOne();
    let isValidActivationPassword = false;

    if (activation && activation.activationCode) {
      if (isPasswordHashed(activation.activationCode)) {
        isValidActivationPassword = await comparePassword(
          activationPassword,
          activation.activationCode
        );
      } else {
        const expectedCode = activation.activationCode;
        isValidActivationPassword = activationPassword === expectedCode;
        if (isValidActivationPassword) {
          const hashedCode = await hashPassword(expectedCode);
          activation.activationCode = hashedCode;
          await activation.save();
        }
      }
    } else {
      // Fallback ke hash default jika belum ada data aktivasi
      isValidActivationPassword = await comparePassword(
        activationPassword,
        DEFAULT_ACTIVATION_CODE_HASH
      );
    }

    if (!isValidActivationPassword) {
      return res.status(401).json({
        success: false,
        message: 'Sandi aktivasi salah. Silakan coba lagi.',
      });
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    // Daftar collections yang akan dihapus
    // Catatan: SystemActivation (systemactivations) TIDAK dihapus untuk menjaga status aktivasi sistem
    const collectionsToDelete = [
      'users',
      'murids',
      'gurus',
      'jurusans',
      'kelas',
      'tahunajarans',
      'matapelajarans',
      'gurumapels',
      'jadwalpelajarans',
      'pengaturanabsens',
      'pengaturansks',
      'pengaturanistirahats',
      'profsekolahs',
      'backgroundktas',
      'datakepseks',
      'pengaturankomponennilais',
      'pengaturangrades',
      'pengaturannilaiminimals',
      'sesiabsensis',
      'izingurus',
      'suratizins',
      'absensigurus',
      'absensis',
      'riwayatkelasmurids',
      'alatrfids',
      'pengaturansistems',
      'walikelassettings',
      'alumnis',
      'nilais',
      'statuskenaikankelass',
      'statusbagiraports',
      'riwayatwalikelass',
      'infosekolahs',
      'pengumumankelulusans',
      'readnotifications',
      'raports',
      'hasgivenkenaikankelasinfos',
      'capaianpembelajarans',
      'ekstrakulikulers',
      'nilaiekstrakulikulers',
      'kokulikulers',
      'eraports',
      'jurnals',
      'pengaturanjenjangpendidikans',
      // Tahfiz-related collections
      'santris',
      'ustadzs',
      'kelastahfizs',
      'jadwaltahfizs',
      'jurnaltahfizs',
      'sesiabsensitahfizs',
      'progresshafalans',
    ];

    // Hapus collections yang ada
    for (const collectionName of collectionsToDelete) {
      const collectionExists = collections.find(c => c.name === collectionName);
      if (collectionExists) {
        await db.collection(collectionName).deleteMany({});
        console.log(`✅ Deleted all documents from ${collectionName}`);
      }
    }

    // Reinitialize default admin user
    const adminExists = await User.findOne({ email: 'admin@sekolah.com' });
    if (!adminExists) {
      const hashedPassword = await hashPassword('admin123');
      const adminUser = new User({
        id: 'admin1',
        name: 'Administrator',
        email: 'admin@sekolah.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
      await adminUser.save();
      console.log('✅ Default admin user recreated');
    } else {
      // Reset admin password to default
      const hashedPassword = await hashPassword('admin123');
      adminExists.password = hashedPassword;
      await adminExists.save();
      console.log('✅ Admin password reset to default');
    }

    // Import dan jalankan fungsi initialize dari database.js
    const dbModule = await import('../config/database.js');

    // Reinitialize default settings
    await dbModule.initializeDefaultPengaturan();
    await dbModule.initializeDefaultPengaturanNilai();
    await dbModule.initializeDefaultWaliKelasSettings();
    
    // SystemActivation tidak perlu diinisialisasi ulang karena sudah dipertahankan
    // PengaturanSistem TIDAK diinisialisasi ulang - akan dibuat saat user memilih sistem sekolah
    // Ini memastikan aplikasi kembali ke flow setup awal (pilih sistem -> pilih jenjang)
    // PengaturanSistem collection sudah dihapus di atas, jadi tidak akan ada default value

    return res.json({
      success: true,
      message: 'Database berhasil direset. Semua data telah dihapus dan data default telah dibuat ulang.',
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mereset database',
      error: error.message,
    });
  }
};

