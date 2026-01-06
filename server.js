import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import activationRoutes from "./routes/activationRoutes.js";
import jenjangRoutes from "./routes/jenjangRoutes.js";
import guruRoutes from "./routes/guruRoutes.js";
import jurusanRoutes from "./routes/jurusanRoutes.js";
import kelasRoutes from "./routes/kelasRoutes.js";
import muridRoutes from "./routes/muridRoutes.js";
import tahunAjaranRoutes from "./routes/tahunAjaranRoutes.js";
import mataPelajaranRoutes from "./routes/mataPelajaranRoutes.js";
import guruMapelRoutes from "./routes/guruMapelRoutes.js";
import jadwalPelajaranRoutes from "./routes/jadwalPelajaranRoutes.js";
import pengaturanAbsenRoutes from "./routes/pengaturanAbsenRoutes.js";
import pengaturanSKSRoutes from "./routes/pengaturanSKSRoutes.js";
import pengaturanIstirahatRoutes from "./routes/pengaturanIstirahatRoutes.js";
import profilSekolahRoutes from "./routes/profilSekolahRoutes.js";
import backgroundKTARoutes from "./routes/backgroundKTARoutes.js";
import dataKepsekRoutes from "./routes/dataKepsekRoutes.js";
import pengaturanKomponenNilaiRoutes from "./routes/pengaturanKomponenNilaiRoutes.js";
import pengaturanGradeRoutes from "./routes/pengaturanGradeRoutes.js";
import pengaturanNilaiMinimalRoutes from "./routes/pengaturanNilaiMinimalRoutes.js";
import sesiAbsensiRoutes from "./routes/sesiAbsensiRoutes.js";
import izinGuruRoutes from "./routes/izinGuruRoutes.js";
import suratIzinRoutes from "./routes/suratIzinRoutes.js";
import absensiGuruRoutes from "./routes/absensiGuruRoutes.js";
import absensiRoutes from "./routes/absensiRoutes.js";
import riwayatKelasMuridRoutes from "./routes/riwayatKelasMuridRoutes.js";
import alatRFIDRoutes from "./routes/alatRFIDRoutes.js";
import pengaturanSistemRoutes from "./routes/pengaturanSistemRoutes.js";
import waliKelasSettingsRoutes from "./routes/waliKelasSettingsRoutes.js";
import alumniRoutes from "./routes/alumniRoutes.js";
import nilaiRoutes from "./routes/nilaiRoutes.js";
import statusKenaikanKelasRoutes from "./routes/statusKenaikanKelasRoutes.js";
import statusBagiRaportRoutes from "./routes/statusBagiRaportRoutes.js";
import riwayatWaliKelasRoutes from "./routes/riwayatWaliKelasRoutes.js";
import infoSekolahRoutes from "./routes/infoSekolahRoutes.js";
import pengumumanKelulusanRoutes from "./routes/pengumumanKelulusanRoutes.js";
import readNotificationRoutes from "./routes/readNotificationRoutes.js";
import raportRoutes from "./routes/raportRoutes.js";
import hasGivenKenaikanKelasInfoRoutes from "./routes/hasGivenKenaikanKelasInfoRoutes.js";
import capaianPembelajaranRoutes from "./routes/capaianPembelajaranRoutes.js";
import ekstrakulikulerRoutes from "./routes/ekstrakulikulerRoutes.js";
import nilaiEkstrakulikulerRoutes from "./routes/nilaiEkstrakulikulerRoutes.js";
import kokulikulerRoutes from "./routes/kokulikulerRoutes.js";
import eraportRoutes from "./routes/eraportRoutes.js";
import jurnalRoutes from "./routes/jurnalRoutes.js";
import autoAlfaService from "./services/autoAlfaService.js";
import sseRoutes from "./routes/sseRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: true, limit: "50mb"}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/activation", activationRoutes);
app.use("/api/jenjang", jenjangRoutes);
app.use("/api/guru", guruRoutes);
app.use("/api/jurusan", jurusanRoutes);
app.use("/api/kelas", kelasRoutes);
app.use("/api/murid", muridRoutes);
app.use("/api/tahun-ajaran", tahunAjaranRoutes);
app.use("/api/mata-pelajaran", mataPelajaranRoutes);
app.use("/api/guru-mapel", guruMapelRoutes);
app.use("/api/jadwal-pelajaran", jadwalPelajaranRoutes);
app.use("/api/pengaturan-absen", pengaturanAbsenRoutes);
app.use("/api/pengaturan-sks", pengaturanSKSRoutes);
app.use("/api/pengaturan-istirahat", pengaturanIstirahatRoutes);
app.use("/api/profil-sekolah", profilSekolahRoutes);
app.use("/api/background-kta", backgroundKTARoutes);
app.use("/api/data-kepsek", dataKepsekRoutes);
app.use("/api/pengaturan-komponen-nilai", pengaturanKomponenNilaiRoutes);
app.use("/api/pengaturan-grade", pengaturanGradeRoutes);
app.use("/api/pengaturan-nilai-minimal", pengaturanNilaiMinimalRoutes);
app.use("/api/sesi-absensi", sesiAbsensiRoutes);
app.use("/api/izin-guru", izinGuruRoutes);
app.use("/api/surat-izin", suratIzinRoutes);
app.use("/api/absensi-guru", absensiGuruRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/riwayat-kelas-murid", riwayatKelasMuridRoutes);
app.use("/api/alat-rfid", alatRFIDRoutes);
app.use("/api/pengaturan-sistem", pengaturanSistemRoutes);
app.use("/api/wali-kelas-settings", waliKelasSettingsRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/nilai", nilaiRoutes);
app.use("/api/status-kenaikan-kelas", statusKenaikanKelasRoutes);
app.use("/api/status-bagi-raport", statusBagiRaportRoutes);
app.use("/api/riwayat-wali-kelas", riwayatWaliKelasRoutes);
app.use("/api/info-sekolah", infoSekolahRoutes);
app.use("/api/pengumuman-kelulusan", pengumumanKelulusanRoutes);
app.use("/api/read-notifications", readNotificationRoutes);
app.use("/api/raport", raportRoutes);
app.use("/api/has-given-kenaikan-kelas-info", hasGivenKenaikanKelasInfoRoutes);
app.use("/api/capaian-pembelajaran", capaianPembelajaranRoutes);
app.use("/api/ekstrakulikuler", ekstrakulikulerRoutes);
app.use("/api/nilai-ekstrakulikuler", nilaiEkstrakulikulerRoutes);
app.use("/api/kokulikuler", kokulikulerRoutes);
app.use("/api/e-raport", eraportRoutes);
app.use("/api/jurnal", jurnalRoutes);
app.use("/api/sse", sseRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);

    // Start AUTO-ALFA service untuk murid dan guru
    autoAlfaService.start();
  });
});

export default app;
