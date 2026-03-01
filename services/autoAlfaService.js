import Absensi from '../models/Absensi.js';
import AbsensiGuru from '../models/AbsensiGuru.js';
import PengaturanAbsen from '../models/PengaturanAbsen.js';
import TahunAjaran from '../models/TahunAjaran.js';
import { broadcastSSEEvent } from '../utils/sseBroadcaster.js';
import { getTodayIndonesia, getCurrentTimeIndonesia } from '../utils/dateUtils.js';

/**
 * Service untuk AUTO-ALFA absen pulang murid dan guru
 * Logika: Jika murid/guru sudah absen masuk (tepat_waktu/terlambat) 
 * tapi belum absen pulang hingga +X menit dari jamPulang, 
 * maka otomatis beri AUTO-ALFA untuk absen pulang
 * 
 * WAKTU AUTO-ALFA DIATUR DI: this.autoAlfaDelayMinutes
 * - 1 = 1 menit (untuk testing)
 * - 60 = 1 jam (untuk production)
 * - Ubah nilai ini sesuai kebutuhan
 */
class AutoAlfaService {
  constructor() {
    // ============================================
    // KONFIGURASI WAKTU AUTO-ALFA
    // ============================================
    // Ubah nilai ini untuk mengatur delay auto-alfa dari jam pulang
    // Contoh: 2 = 2 menit, 60 = 1 jam, 30 = 30 menit
    this.autoAlfaDelayMinutes = 1; // ⚙️ UBAH NILAI INI UNTUK MENGATUR WAKTU AUTO-ALFA
    // ============================================
    
    this.checkInterval = null;
    this.schedulerTimeout = null; // Timeout untuk check tepat pada jamPulang + delay
    this.schedulerInterval = null; // Fallback interval jika timeout tidak tepat
    this.isRunning = false;
    this.isActive = false; // Apakah service sedang aktif (sudah lewat jamPulang + delay)
    this.checkIntervalMs = 800000; // Check setiap 10 menit saat sudah aktif (lebih efisien)
    this.schedulerIntervalMs = 3600000; // Check setiap 1 jam apakah sudah waktunya (lebih efisien)
    this.lastProcessedDate = null; // Tanggal terakhir diproses
  }

  /**
   * Menambahkan menit ke waktu (format HH:MM)
   */
  addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  /**
   * Membandingkan waktu (format HH:MM)
   * Returns: true jika time1 >= time2 (lebih besar atau sama dengan)
   */
  isTimeAfter(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes1 >= minutes2; // Ubah dari > menjadi >= agar termasuk waktu yang sama
  }

  /**
   * Mendapatkan waktu saat ini dalam format HH:MM (WIB/Indonesia)
   */
  getCurrentTime() {
    return getCurrentTimeIndonesia();
  }

  /**
   * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD (WIB/Indonesia)
   */
  getToday() {
    return getTodayIndonesia();
  }

  /**
   * Memeriksa dan melakukan AUTO-ALFA untuk murid yang belum absen pulang
   */
  async checkAndAutoAlfaMurid() {
    try {
      const today = this.getToday();
      const currentTime = this.getCurrentTime();

      // Ambil pengaturan absen aktif
      const pengaturanAbsen = await PengaturanAbsen.findOne({ isActive: true });
      if (!pengaturanAbsen) {
        return;
      }

      const jamPulang = pengaturanAbsen.jamPulang || '16:00';
      // Hitung waktu auto-alfa berdasarkan delay yang dikonfigurasi
      const jamPulangPlusDelay = this.addMinutes(jamPulang, this.autoAlfaDelayMinutes);

      // Hanya proses jika sudah lewat jamPulang + delay
      if (!this.isTimeAfter(currentTime, jamPulangPlusDelay)) {
        return; // Belum waktunya untuk auto-alfa
      }

      // Ambil tahun ajaran aktif
      const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
      if (!activeTahunAjaran) {
        return;
      }

      // Cari semua absensi hari ini
      const absensiDocs = await Absensi.find({
        tanggal: today,
        tahunAjaranId: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
      });

      let totalUpdated = 0;

      for (const absensiDoc of absensiDocs) {
        if (!absensiDoc.kelas || !Array.isArray(absensiDoc.kelas)) {
          continue;
        }

        for (const kelasItem of absensiDoc.kelas) {
          if (!kelasItem.murid || !Array.isArray(kelasItem.murid)) {
            continue;
          }

          for (const muridItem of kelasItem.murid) {
            // Cek kondisi:
            // 1. Sudah absen masuk (statusMasuk = 'tepat_waktu' atau 'terlambat')
            // 2. Belum absen pulang (tidak ada jamKeluar atau statusKeluar)
            const hasMasuk = muridItem.statusMasuk === 'tepat_waktu' || muridItem.statusMasuk === 'terlambat';
            const hasPulang = muridItem.jamKeluar || muridItem.statusKeluar;

            // Skip jika sudah ada absen pulang
            if (hasPulang) {
              continue;
            }

            // Skip jika belum absen masuk atau statusMasuk bukan tepat_waktu/terlambat
            if (!hasMasuk) {
              continue;
            }

            // Skip jika statusKeluar sudah 'alfa' (sudah pernah di-auto-alfa)
            if (muridItem.statusKeluar === 'alfa') {
              continue;
            }

            // Auto-alfa untuk absen pulang
            const now = new Date().toISOString();
            const delayText = this.autoAlfaDelayMinutes === 60 ? '1 jam' : `${this.autoAlfaDelayMinutes} menit`;
            const newKeterangan = muridItem.keterangan 
              ? `${muridItem.keterangan} | AUTO-ALFA: Tidak melakukan absen pulang hingga +${delayText} dari jam pulang`
              : `AUTO-ALFA: Tidak melakukan absen pulang hingga +${delayText} dari jam pulang`;

            // Gunakan MongoDB update operator untuk memastikan data tersimpan
            try {
              // Cari index kelas dan murid
              const kelasIndex = absensiDoc.kelas.findIndex(k => k.kelasId === kelasItem.kelasId);
              const muridIndex = absensiDoc.kelas[kelasIndex].murid.findIndex(m => m.muridId === muridItem.muridId);

              if (kelasIndex === -1 || muridIndex === -1) {
                continue;
              }

              // Update menggunakan MongoDB updateOne dengan path langsung
              const updateResult = await Absensi.updateOne(
                { 
                  _id: absensiDoc._id
                },
                {
                  $set: {
                    [`kelas.${kelasIndex}.murid.${muridIndex}.statusKeluar`]: 'alfa',
                    [`kelas.${kelasIndex}.murid.${muridIndex}.jamKeluar`]: now,
                    [`kelas.${kelasIndex}.murid.${muridIndex}.keterangan`]: newKeterangan,
                    [`kelas.${kelasIndex}.murid.${muridIndex}.method`]: muridItem.method || 'auto-alfa',
                    'updatedAt': new Date().toISOString()
                  }
                }
              );

              if (updateResult.modifiedCount > 0) {
                totalUpdated++;
              }
            } catch (error) {
              console.error(`[AutoAlfa] ❌ Error update murid ${muridItem.muridId}:`, error.message);
            }
          }
        }
      }

      if (totalUpdated > 0) {
        console.log(`[AutoAlfa] ✅ Berhasil melakukan AUTO-ALFA untuk ${totalUpdated} murid pada ${today} ${currentTime}`);
        
        // Broadcast SSE event untuk notifikasi real-time ke frontend
        try {
          broadcastSSEEvent('absen-auto-alfa', {
            message: `AUTO-ALFA: ${totalUpdated} murid otomatis ditandai alfa untuk absen pulang`,
            totalUpdated,
            tanggal: today,
            waktu: currentTime,
          });
        } catch (error) {
          console.error('[AutoAlfa] ❌ Error broadcasting SSE event:', error);
        }
      }

      return totalUpdated;
    } catch (error) {
      console.error('[AutoAlfa] Error saat melakukan auto-alfa murid:', error);
      return 0;
    }
  }

  /**
   * Memeriksa dan melakukan AUTO-ALFA untuk guru yang belum absen pulang
   */
  async checkAndAutoAlfaGuru() {
    try {
      const today = this.getToday();
      const currentTime = this.getCurrentTime();

      // Ambil pengaturan absen aktif
      const pengaturanAbsen = await PengaturanAbsen.findOne({ isActive: true });
      if (!pengaturanAbsen) {
        return 0;
      }

      const jamPulang = pengaturanAbsen.jamPulang || '16:00';
      // Hitung waktu auto-alfa berdasarkan delay yang dikonfigurasi
      const jamPulangPlusDelay = this.addMinutes(jamPulang, this.autoAlfaDelayMinutes);

      // Hanya proses jika sudah lewat jamPulang + delay
      if (!this.isTimeAfter(currentTime, jamPulangPlusDelay)) {
        return 0; // Belum waktunya untuk auto-alfa
      }

      // Ambil tahun ajaran aktif
      const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
      if (!activeTahunAjaran) {
        return 0;
      }

      // Cari semua absensi guru hari ini
      const absensiGuruDocs = await AbsensiGuru.find({
        tanggal: today,
        tahunAjaranId: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
      });

      let totalUpdated = 0;

      for (const absensiGuruDoc of absensiGuruDocs) {
        if (!absensiGuruDoc.guru || !Array.isArray(absensiGuruDoc.guru)) {
          continue;
        }

        for (const guruItem of absensiGuruDoc.guru) {
          // Cek kondisi:
          // 1. Sudah absen masuk (statusMasuk = 'tepat_waktu' atau 'terlambat')
          // 2. Belum absen pulang (tidak ada jamKeluar atau statusKeluar yang bukan 'tidak_keluar')
          const hasMasuk = guruItem.statusMasuk === 'tepat_waktu' || guruItem.statusMasuk === 'terlambat';
          // hasPulang = true jika ada jamKeluar ATAU statusKeluar yang bukan 'tidak_keluar' atau undefined
          const hasPulang = guruItem.jamKeluar || (guruItem.statusKeluar && guruItem.statusKeluar !== 'tidak_keluar');

          // Skip jika sudah ada absen pulang
          if (hasPulang) {
            continue;
          }

          // Skip jika belum absen masuk atau statusMasuk bukan tepat_waktu/terlambat
          if (!hasMasuk) {
            continue;
          }

          // Skip jika statusKeluar sudah 'alfa' (sudah pernah di-auto-alfa)
          if (guruItem.statusKeluar === 'alfa') {
            continue;
          }

          // Skip jika statusKeluar = 'tidak_keluar' tapi sudah ada jamKeluar (inconsistent data)
          if (guruItem.statusKeluar === 'tidak_keluar' && guruItem.jamKeluar) {
            continue;
          }

          // Auto-alfa untuk absen pulang
          const now = new Date().toISOString();
          const delayText = this.autoAlfaDelayMinutes === 60 ? '1 jam' : `${this.autoAlfaDelayMinutes} menit`;
          const newKeterangan = guruItem.keterangan 
            ? `${guruItem.keterangan} | AUTO-ALFA: Tidak melakukan absen pulang hingga +${delayText} dari jam pulang`
            : `AUTO-ALFA: Tidak melakukan absen pulang hingga +${delayText} dari jam pulang`;

          // Gunakan MongoDB update operator untuk memastikan data tersimpan
          try {
            // Cari index guru
            const guruIndex = absensiGuruDoc.guru.findIndex(g => g.guruId === guruItem.guruId);

            if (guruIndex === -1) {
              continue;
            }

            // Update menggunakan MongoDB updateOne dengan path langsung
            const updateResult = await AbsensiGuru.updateOne(
              { 
                _id: absensiGuruDoc._id
              },
              {
                $set: {
                  [`guru.${guruIndex}.statusKeluar`]: 'alfa',
                  [`guru.${guruIndex}.jamKeluar`]: now,
                  [`guru.${guruIndex}.keterangan`]: newKeterangan,
                  'updatedAt': new Date().toISOString()
                }
              }
            );

            if (updateResult.modifiedCount > 0) {
              totalUpdated++;
            }
          } catch (error) {
            console.error(`[AutoAlfa] ❌ Error update guru ${guruItem.guruId}:`, error.message);
          }
        }
      }

      if (totalUpdated > 0) {
        console.log(`[AutoAlfa] ✅ Berhasil melakukan AUTO-ALFA untuk ${totalUpdated} guru pada ${today} ${currentTime}`);
        
        // Broadcast SSE event untuk notifikasi real-time ke frontend
        try {
          broadcastSSEEvent('absen-guru-auto-alfa', {
            message: `AUTO-ALFA: ${totalUpdated} guru otomatis ditandai alfa untuk absen pulang`,
            totalUpdated,
            tanggal: today,
            waktu: currentTime,
          });
        } catch (error) {
          console.error('[AutoAlfa] ❌ Error broadcasting SSE event:', error);
        }
      }

      return totalUpdated;
    } catch (error) {
      console.error('[AutoAlfa] Error saat melakukan auto-alfa guru:', error);
      return 0;
    }
  }

  /**
   * Memeriksa dan melakukan AUTO-ALFA untuk murid dan guru yang belum absen pulang
   */
  async checkAndAutoAlfa() {
    try {
      const today = this.getToday();
      const currentTime = this.getCurrentTime();

      // Ambil pengaturan absen aktif
      const pengaturanAbsen = await PengaturanAbsen.findOne({ isActive: true });
      if (!pengaturanAbsen) {
        return;
      }

      const jamPulang = pengaturanAbsen.jamPulang || '16:00';
      // Hitung waktu auto-alfa berdasarkan delay yang dikonfigurasi
      const jamPulangPlusDelay = this.addMinutes(jamPulang, this.autoAlfaDelayMinutes);

      // Hanya proses jika sudah lewat jamPulang + delay
      if (!this.isTimeAfter(currentTime, jamPulangPlusDelay)) {
        return; // Belum waktunya untuk auto-alfa
      }

      // Proses auto-alfa untuk murid dan guru secara parallel
      const [totalUpdatedMurid, totalUpdatedGuru] = await Promise.all([
        this.checkAndAutoAlfaMurid(),
        this.checkAndAutoAlfaGuru()
      ]);

      // Tandai sudah diproses hari ini jika ada yang diupdate
      if (totalUpdatedMurid > 0 || totalUpdatedGuru > 0) {
        this.lastProcessedDate = today;
      } else {
        // Jika tidak ada yang diupdate tapi belum diproses hari ini, tandai sudah diproses
        // (untuk menghindari check berulang jika tidak ada data)
        if (this.lastProcessedDate !== today) {
          this.lastProcessedDate = today;
        }
      }
    } catch (error) {
      console.error('[AutoAlfa] Error saat melakukan auto-alfa:', error);
    }
  }

  /**
   * Menghitung delay dalam milliseconds sampai jamPulang + delay yang dikonfigurasi
   */
  calculateDelayToActivation(jamPulangPlus1Hour) {
    const now = new Date();
    const [targetHour, targetMin] = jamPulangPlus1Hour.split(':').map(Number);
    
    const targetTime = new Date();
    targetTime.setHours(targetHour, targetMin, 0, 0);
    
    // Jika target time sudah lewat hari ini, set untuk besok
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime.getTime() - now.getTime();
  }

  /**
   * Memeriksa apakah sudah waktunya untuk menjalankan service (sudah lewat jamPulang + delay yang dikonfigurasi)
   */
  async checkIfTimeToActivate() {
    try {
      const today = this.getToday();
      const currentTime = this.getCurrentTime();

      // Jika sudah diproses hari ini, tidak perlu check lagi
      if (this.lastProcessedDate === today && this.isActive) {
        return;
      }

      // Ambil pengaturan absen aktif
      const pengaturanAbsen = await PengaturanAbsen.findOne({ isActive: true });
      if (!pengaturanAbsen) {
        return;
      }

      const jamPulang = pengaturanAbsen.jamPulang || '16:00';
      // Hitung waktu auto-alfa berdasarkan delay yang dikonfigurasi
      const jamPulangPlusDelay = this.addMinutes(jamPulang, this.autoAlfaDelayMinutes);

      // Cek apakah sudah lewat jamPulang + delay
      if (this.isTimeAfter(currentTime, jamPulangPlusDelay)) {
        // Reset jika tanggal berbeda
        if (this.lastProcessedDate !== today) {
          this.lastProcessedDate = null;
          this.isActive = false;
        }

        // Aktifkan service jika belum aktif
        if (!this.isActive) {
          this.isActive = true;
          
          // Jalankan sekali langsung
          await this.checkAndAutoAlfa();

          // Set interval untuk check secara berkala (setiap 10 menit - lebih efisien)
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
          }
          this.checkInterval = setInterval(() => {
            this.checkAndAutoAlfa();
          }, this.checkIntervalMs);
        }
      } else {
        // Belum waktunya, nonaktifkan jika sedang aktif
        if (this.isActive) {
          this.isActive = false;
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
          }
        }
      }
    } catch (error) {
      console.error('[AutoAlfa] Error checking activation time:', error);
    }
  }

  /**
   * Schedule check tepat pada jamPulang + delay yang dikonfigurasi (lebih efisien)
   */
  async scheduleNextActivation() {
    try {
      // Clear existing timeout
      if (this.schedulerTimeout) {
        clearTimeout(this.schedulerTimeout);
      }

      // Ambil pengaturan absen aktif
      const pengaturanAbsen = await PengaturanAbsen.findOne({ isActive: true });
      if (!pengaturanAbsen) {
        return;
      }

      const jamPulang = pengaturanAbsen.jamPulang || '16:00';
      // Hitung waktu auto-alfa berdasarkan delay yang dikonfigurasi
      const jamPulangPlusDelay = this.addMinutes(jamPulang, this.autoAlfaDelayMinutes);
      
      // Hitung delay sampai jamPulang + delay yang dikonfigurasi
      const delay = this.calculateDelayToActivation(jamPulangPlusDelay);
      
      const delayText = this.autoAlfaDelayMinutes === 60 ? '1 jam' : `${this.autoAlfaDelayMinutes} menit`;
      console.log(`[AutoAlfa] Scheduled check pada ${jamPulangPlusDelay} (dalam ${Math.round(delay / 60000)} menit) - Auto-alfa akan aktif +${delayText} dari jam pulang`);
      
      // Set timeout untuk check tepat pada jamPulang + delay yang dikonfigurasi
      this.schedulerTimeout = setTimeout(async () => {
        // Langsung jalankan checkAndAutoAlfa karena waktu sudah tepat
        await this.checkAndAutoAlfa();
        // Juga check untuk aktivasi service
        await this.checkIfTimeToActivate();
        // Schedule untuk besok
        await this.scheduleNextActivation();
      }, delay);
    } catch (error) {
      console.error('[AutoAlfa] Error scheduling activation:', error);
    }
  }

  /**
   * Memulai service AUTO-ALFA
   * Service akan menggunakan scheduled timeout untuk check tepat pada jamPulang + delay yang dikonfigurasi
   * Hanya akan aktif setelah lewat jamPulang + delay yang dikonfigurasi
   * Lebih efisien karena tidak check database terus menerus
   */
  start() {
    if (this.isRunning) {
      console.log('[AutoAlfa] Service sudah berjalan');
      return;
    }

    this.isRunning = true;
    const delayText = this.autoAlfaDelayMinutes === 60 ? '1 jam' : `${this.autoAlfaDelayMinutes} menit`;
    console.log(`[AutoAlfa] Service AUTO-ALFA dimulai (optimized scheduler - check tepat pada jamPulang + ${delayText})`);

    // Jalankan sekali saat start untuk check apakah sudah waktunya
    this.checkIfTimeToActivate();

    // Schedule check tepat pada jamPulang + delay yang dikonfigurasi (lebih efisien)
    this.scheduleNextActivation();

    // Set fallback interval (setiap 1 jam) untuk memastikan tidak terlewat
    // Hanya sebagai backup jika timeout tidak tepat
    this.schedulerInterval = setInterval(() => {
      this.checkIfTimeToActivate();
      // Re-schedule jika perlu
      if (!this.isActive) {
        this.scheduleNextActivation();
      }
    }, this.schedulerIntervalMs);
  }

  /**
   * Menghentikan service AUTO-ALFA
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.isActive = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    console.log('[AutoAlfa] Service AUTO-ALFA dihentikan');
  }

  /**
   * Mendapatkan status service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
    };
  }
}

// Export singleton instance
const autoAlfaService = new AutoAlfaService();
export default autoAlfaService;

