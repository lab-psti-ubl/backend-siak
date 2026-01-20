import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      "mongodb://s1Ak_psTI133231231:123sdasdSiAk_dbPsTI@10.8.0.1:27017/siak_db";

    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected Successfully");

    // Initialize default admin user
    await initializeDefaultAdmin();

    // Initialize system activation
    await initializeSystemActivation();

    // Initialize default pengaturan
    await initializeDefaultPengaturan();

    // Initialize default pengaturan nilai
    await initializeDefaultPengaturanNilai();

    // Initialize default wali kelas settings
    await initializeDefaultWaliKelasSettings();
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

const initializeDefaultAdmin = async () => {
  try {
    const User = (await import("../models/User.js")).default;
    const {hashPassword} = await import("../utils/passwordUtils.js");

    const adminExists = await User.findOne({email: "admin@sekolah.com"});

    if (!adminExists) {
      // Hash default admin password
      const hashedPassword = await hashPassword("admin123");

      const adminUser = new User({
        id: "admin1",
        name: "Administrator",
        email: "admin@sekolah.com",
        password: hashedPassword,
        role: "admin",
        createdAt: new Date().toISOString(),
      });

      await adminUser.save();
      console.log("✅ Default admin user created");
    } else {
      // Update existing admin password if it's not hashed
      const {isPasswordHashed} = await import("../utils/passwordUtils.js");
      if (adminExists.password && !isPasswordHashed(adminExists.password)) {
        const hashedPassword = await hashPassword(adminExists.password);
        adminExists.password = hashedPassword;
        await adminExists.save();
        console.log("✅ Admin password hashed");
      }
    }
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
};

const initializeSystemActivation = async () => {
  try {
    const SystemActivation = (await import("../models/SystemActivation.js"))
      .default;

    const activationExists = await SystemActivation.findOne();

    if (!activationExists) {
      const systemActivation = new SystemActivation({
        id: "system-activation-1",
        isSystemActive: false,
        createdAt: new Date().toISOString(),
      });

      await systemActivation.save();
      console.log("✅ System activation initialized");
    }
  } catch (error) {
    console.error("Error initializing system activation:", error);
  }
};

export const initializeDefaultPengaturan = async () => {
  try {
    const PengaturanAbsen = (await import("../models/PengaturanAbsen.js"))
      .default;
    const PengaturanSKS = (await import("../models/PengaturanSKS.js")).default;
    const PengaturanIstirahat = (
      await import("../models/PengaturanIstirahat.js")
    ).default;

    // Initialize Pengaturan Absen
    const pengaturanAbsenExists = await PengaturanAbsen.findOne();
    if (!pengaturanAbsenExists) {
      const defaultPengaturanAbsen = new PengaturanAbsen({
        id: "pengaturan-absen-1",
        jamMasuk: "08:00",
        toleransiMasuk: 15,
        jamPulang: "16:00",
        toleransiPulang: 15,
        hariSekolah: [1, 2, 3, 4, 5], // Senin sampai Jumat
        hariKerja: [1, 2, 3, 4, 5], // Senin sampai Jumat
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      await defaultPengaturanAbsen.save();
      console.log("✅ Default pengaturan absen created");
    }

    // Initialize Pengaturan SKS
    const pengaturanSKSExists = await PengaturanSKS.findOne();
    if (!pengaturanSKSExists) {
      const defaultPengaturanSKS = new PengaturanSKS({
        id: "pengaturan-sks-1",
        durasiPerSKS: 45,
        istirahatAntarSKS: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      await defaultPengaturanSKS.save();
      console.log("✅ Default pengaturan SKS created");
    }

    // Initialize Pengaturan Istirahat
    const pengaturanIstirahatExists = await PengaturanIstirahat.findOne();
    if (!pengaturanIstirahatExists) {
      const defaultPengaturanIstirahat = new PengaturanIstirahat({
        id: "pengaturan-istirahat-1",
        jamMulai: "12:00",
        jamSelesai: "13:00",
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      await defaultPengaturanIstirahat.save();
      console.log("✅ Default pengaturan istirahat created");
    }
  } catch (error) {
    console.error("Error initializing default pengaturan:", error);
  }
};

export const initializeDefaultPengaturanNilai = async () => {
  try {
    const PengaturanKomponenNilai = (
      await import("../models/PengaturanKomponenNilai.js")
    ).default;
    const PengaturanGrade = (await import("../models/PengaturanGrade.js"))
      .default;
    const PengaturanNilaiMinimal = (
      await import("../models/PengaturanNilaiMinimal.js")
    ).default;

    // Initialize Komponen Nilai
    const komponenNilaiExists = await PengaturanKomponenNilai.findOne();
    if (!komponenNilaiExists) {
      const defaultKomponenNilai = [
        {
          id: "1",
          nama: "UTS",
          persentase: 25,
          isDefault: true,
          hasNilai: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          nama: "UAS",
          persentase: 25,
          isDefault: true,
          hasNilai: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          nama: "Tugas",
          persentase: 30,
          isDefault: true,
          hasNilai: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          nama: "Kehadiran",
          persentase: 20,
          isDefault: true,
          hasNilai: false,
          createdAt: new Date().toISOString(),
        },
      ];
      await PengaturanKomponenNilai.insertMany(defaultKomponenNilai);
      console.log("✅ Default komponen nilai created");
    }

    // Initialize Grade
    const gradeExists = await PengaturanGrade.findOne();
    if (!gradeExists) {
      const defaultGrades = [
        {
          id: "1",
          grade: "A",
          minNilai: 85,
          maxNilai: 100,
          deskripsi: "Sangat Baik",
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          grade: "B",
          minNilai: 70,
          maxNilai: 84,
          deskripsi: "Baik",
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          grade: "C",
          minNilai: 55,
          maxNilai: 69,
          deskripsi: "Cukup",
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          grade: "D",
          minNilai: 40,
          maxNilai: 54,
          deskripsi: "Kurang",
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "5",
          grade: "E",
          minNilai: 0,
          maxNilai: 39,
          deskripsi: "Sangat Kurang",
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ];
      await PengaturanGrade.insertMany(defaultGrades);
      console.log("✅ Default grade created");
    }

    // Initialize Nilai Minimal
    const nilaiMinimalExists = await PengaturanNilaiMinimal.findOne();
    if (!nilaiMinimalExists) {
      const defaultNilaiMinimal = new PengaturanNilaiMinimal({
        id: "pengaturan-nilai-minimal-1",
        nilaiAkhirMinimal: 70,
        tingkatKehadiranMinimal: 75,
        createdAt: new Date().toISOString(),
      });
      await defaultNilaiMinimal.save();
      console.log("✅ Default pengaturan nilai minimal created");
    }
  } catch (error) {
    console.error("Error initializing default pengaturan nilai:", error);
  }
};

export const initializeDefaultWaliKelasSettings = async () => {
  try {
    const WaliKelasSettings = (await import("../models/WaliKelasSettings.js"))
      .default;

    const settingsExists = await WaliKelasSettings.findOne();
    if (!settingsExists) {
      const defaultSettings = new WaliKelasSettings({
        id: "wali-kelas-settings-1",
        system: "otomatis",
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      await defaultSettings.save();
      console.log("✅ Default wali kelas settings created");
    }
  } catch (error) {
    console.error("Error initializing default wali kelas settings:", error);
  }
};

export default connectDB;
