import Alumni from '../models/Alumni.js';

// Helper function to flatten alumni data for backward compatibility
const flattenAlumniData = (alumniData) => {
  const flattened = [];
  
  if (alumniData.jenjang === 'SMA/SMK' && alumniData.jurusan) {
    alumniData.jurusan.forEach(jurusan => {
      jurusan.kelas.forEach(kelas => {
        kelas.murid.forEach(murid => {
          flattened.push({
            id: `${alumniData.id}-${murid.muridId}`,
            muridId: murid.muridId,
            nama: murid.nama,
            nisn: murid.nisn,
            kelasId: kelas.kelasId,
            namaKelas: kelas.namaKelas,
            jurusanId: jurusan.jurusanId,
            namaJurusan: jurusan.namaJurusan,
            tahunLulus: alumniData.tahunLulus,
            nilaiAkhir: murid.nilaiAkhir,
            tingkatKehadiran: murid.tingkatKehadiran,
            peringkatKelas: murid.peringkatKelas,
            peringkatSekolah: murid.peringkatSekolah,
            tanggalLulus: murid.tanggalLulus,
            waliKelasSebelumnya: murid.waliKelasSebelumnya,
            namaWaliKelasSebelumnya: murid.namaWaliKelasSebelumnya,
            nipWaliKelasSebelumnya: murid.nipWaliKelasSebelumnya,
            createdAt: alumniData.createdAt,
          });
        });
      });
    });
  } else if ((alumniData.jenjang === 'SD' || alumniData.jenjang === 'SMP') && alumniData.kelas) {
    alumniData.kelas.forEach(kelas => {
      kelas.murid.forEach(murid => {
        flattened.push({
          id: `${alumniData.id}-${murid.muridId}`,
          muridId: murid.muridId,
          nama: murid.nama,
          nisn: murid.nisn,
          kelasId: kelas.kelasId,
          namaKelas: kelas.namaKelas,
          tahunLulus: alumniData.tahunLulus,
          nilaiAkhir: murid.nilaiAkhir,
          tingkatKehadiran: murid.tingkatKehadiran,
          peringkatKelas: murid.peringkatKelas,
          peringkatSekolah: murid.peringkatSekolah,
          tanggalLulus: murid.tanggalLulus,
          waliKelasSebelumnya: murid.waliKelasSebelumnya,
          namaWaliKelasSebelumnya: murid.namaWaliKelasSebelumnya,
          nipWaliKelasSebelumnya: murid.nipWaliKelasSebelumnya,
          createdAt: alumniData.createdAt,
        });
      });
    });
  }
  
  return flattened;
};

// Helper function to find murid in alumni data
const findMuridInAlumni = (alumniData, muridId) => {
  if (alumniData.jenjang === 'SMA/SMK' && alumniData.jurusan) {
    for (const jurusan of alumniData.jurusan) {
      for (const kelas of jurusan.kelas) {
        const murid = kelas.murid.find(m => m.muridId === muridId);
        if (murid) {
          return {
            ...murid,
            kelasId: kelas.kelasId,
            namaKelas: kelas.namaKelas,
            jurusanId: jurusan.jurusanId,
            namaJurusan: jurusan.namaJurusan,
            tahunLulus: alumniData.tahunLulus,
          };
        }
      }
    }
  } else if ((alumniData.jenjang === 'SD' || alumniData.jenjang === 'SMP') && alumniData.kelas) {
    for (const kelas of alumniData.kelas) {
      const murid = kelas.murid.find(m => m.muridId === muridId);
      if (murid) {
        return {
          ...murid,
          kelasId: kelas.kelasId,
          namaKelas: kelas.namaKelas,
          tahunLulus: alumniData.tahunLulus,
        };
      }
    }
  }
  return null;
};

// Get all alumni (returns flattened data for backward compatibility)
export const getAllAlumni = async (req, res) => {
  try {
    const { tahunLulus, kelasId, search } = req.query;
    
    let query = {};
    
    if (tahunLulus) {
      query.tahunLulus = tahunLulus;
    }
    
    // Build search query for nested fields
    if (search) {
      query.$or = [
        { 'jurusan.kelas.murid.nama': { $regex: search, $options: 'i' } },
        { 'jurusan.kelas.murid.nisn': { $regex: search, $options: 'i' } },
        { 'jurusan.kelas.namaKelas': { $regex: search, $options: 'i' } },
        { 'kelas.murid.nama': { $regex: search, $options: 'i' } },
        { 'kelas.murid.nisn': { $regex: search, $options: 'i' } },
        { 'kelas.namaKelas': { $regex: search, $options: 'i' } },
      ];
    }
    
    const alumniRecords = await Alumni.find(query).sort({ tahunLulus: -1 });
    
    // Flatten all alumni data
    let allAlumni = [];
    alumniRecords.forEach(record => {
      const flattened = flattenAlumniData(record.toObject());
      allAlumni = allAlumni.concat(flattened);
    });
    
    // Filter by kelasId if provided
    if (kelasId) {
      allAlumni = allAlumni.filter(a => a.kelasId === kelasId);
    }
    
    // Sort by peringkatSekolah
    allAlumni.sort((a, b) => a.peringkatSekolah - b.peringkatSekolah);
    
    return res.json({
      success: true,
      alumni: allAlumni,
      count: allAlumni.length,
    });
  } catch (error) {
    console.error('Get all alumni error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data alumni',
    });
  }
};

// Get alumni by ID
export const getAlumniById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const alumni = await Alumni.findOne({ id });
    
    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      alumni: alumni.toObject(),
    });
  } catch (error) {
    console.error('Get alumni by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data alumni',
    });
  }
};

// Get alumni by muridId
export const getAlumniByMuridId = async (req, res) => {
  try {
    const { muridId } = req.params;
    
    // Search in both jurusan.kelas.murid and kelas.murid
    const alumniRecords = await Alumni.find({
      $or: [
        { 'jurusan.kelas.murid.muridId': muridId },
        { 'kelas.murid.muridId': muridId }
      ]
    });
    
    // Find the murid in the records
    for (const record of alumniRecords) {
      const muridData = findMuridInAlumni(record.toObject(), muridId);
      if (muridData) {
        return res.json({
          success: true,
          alumni: muridData,
        });
      }
    }
    
    return res.status(404).json({
      success: false,
      message: 'Alumni tidak ditemukan',
    });
  } catch (error) {
    console.error('Get alumni by muridId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data alumni',
    });
  }
};

// Create alumni (adds a murid to the alumni structure)
export const createAlumni = async (req, res) => {
  try {
    const {
      muridId,
      nama,
      nisn,
      kelasId,
      namaKelas,
      jurusanId,
      namaJurusan,
      tahunLulus,
      jenjang,
      nilaiAkhir,
      tingkatKehadiran,
      peringkatKelas,
      peringkatSekolah,
      tanggalLulus,
      waliKelasSebelumnya,
      namaWaliKelasSebelumnya,
      nipWaliKelasSebelumnya,
    } = req.body;

    // Validate required fields
    if (!muridId || !nama || !nisn || !kelasId || !namaKelas || !tahunLulus || !jenjang ||
        nilaiAkhir === undefined || tingkatKehadiran === undefined || 
        peringkatKelas === undefined || peringkatSekolah === undefined || !tanggalLulus) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib harus diisi',
      });
    }

    // Check if murid already exists in alumni
    const existingRecords = await Alumni.find({
      $or: [
        { 'jurusan.kelas.murid.muridId': muridId },
        { 'kelas.murid.muridId': muridId }
      ]
    });
    
    for (const record of existingRecords) {
      const muridData = findMuridInAlumni(record.toObject(), muridId);
      if (muridData) {
        return res.status(400).json({
          success: false,
          message: 'Alumni sudah terdaftar untuk murid ini',
        });
      }
    }

    // Prepare murid data
    const muridData = {
      muridId,
      nama,
      nisn,
      nilaiAkhir,
      tingkatKehadiran,
      peringkatKelas,
      peringkatSekolah,
      tanggalLulus,
    };

    if (waliKelasSebelumnya) muridData.waliKelasSebelumnya = waliKelasSebelumnya;
    if (namaWaliKelasSebelumnya) muridData.namaWaliKelasSebelumnya = namaWaliKelasSebelumnya;
    if (nipWaliKelasSebelumnya) muridData.nipWaliKelasSebelumnya = nipWaliKelasSebelumnya;

    // Find or create alumni record for this tahunLulus and jenjang
    const alumniId = `alumni-${tahunLulus}-${jenjang}`;
    let alumniRecord = await Alumni.findOne({ id: alumniId });

    if (!alumniRecord) {
      // Create new alumni record
      alumniRecord = new Alumni({
        id: alumniId,
        tahunLulus,
        jenjang,
        jurusan: jenjang === 'SMA/SMK' ? [] : undefined,
        kelas: (jenjang === 'SD' || jenjang === 'SMP') ? [] : undefined,
        createdAt: new Date().toISOString(),
      });
    }

    // Add murid to the appropriate structure
    if (jenjang === 'SMA/SMK') {
      if (!jurusanId || !namaJurusan) {
        return res.status(400).json({
          success: false,
          message: 'Jurusan wajib diisi untuk jenjang SMA/SMK',
        });
      }

      // Find or create jurusan
      let jurusanIndex = alumniRecord.jurusan.findIndex(j => j.jurusanId === jurusanId);
      if (jurusanIndex === -1) {
        alumniRecord.jurusan.push({
          jurusanId,
          namaJurusan,
          kelas: [],
        });
        jurusanIndex = alumniRecord.jurusan.length - 1;
      }

      // Find or create kelas in jurusan
      let kelasIndex = alumniRecord.jurusan[jurusanIndex].kelas.findIndex(k => k.kelasId === kelasId);
      if (kelasIndex === -1) {
        alumniRecord.jurusan[jurusanIndex].kelas.push({
          kelasId,
          namaKelas,
          murid: [],
        });
        kelasIndex = alumniRecord.jurusan[jurusanIndex].kelas.length - 1;
      }

      // Add murid to kelas
      alumniRecord.jurusan[jurusanIndex].kelas[kelasIndex].murid.push(muridData);
    } else {
      // SD or SMP
      // Find or create kelas
      let kelasIndex = alumniRecord.kelas.findIndex(k => k.kelasId === kelasId);
      if (kelasIndex === -1) {
        alumniRecord.kelas.push({
          kelasId,
          namaKelas,
          murid: [],
        });
        kelasIndex = alumniRecord.kelas.length - 1;
      }

      // Add murid to kelas
      alumniRecord.kelas[kelasIndex].murid.push(muridData);
    }

    await alumniRecord.save();

    // Return flattened data for backward compatibility
    const flattened = flattenAlumniData(alumniRecord.toObject());
    const createdAlumni = flattened.find(a => a.muridId === muridId);

    return res.json({
      success: true,
      message: 'Alumni berhasil dibuat',
      alumni: createdAlumni,
    });
  } catch (error) {
    console.error('Create alumni error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat alumni',
    });
  }
};

// Update alumni (updates a murid's data in the structure)
export const updateAlumni = async (req, res) => {
  try {
    const { id } = req.params; // This is the alumni record id (alumni-{tahunLulus}-{jenjang})
    const { muridId, ...updateData } = req.body;

    if (!muridId) {
      return res.status(400).json({
        success: false,
        message: 'muridId wajib diisi',
      });
    }

    const alumniRecord = await Alumni.findOne({ id });
    if (!alumniRecord) {
      return res.status(404).json({
        success: false,
        message: 'Alumni tidak ditemukan',
      });
    }

    // Find and update the murid
    let found = false;
    const alumniObj = alumniRecord.toObject();

    if (alumniObj.jenjang === 'SMA/SMK' && alumniObj.jurusan) {
      for (let i = 0; i < alumniRecord.jurusan.length; i++) {
        for (let j = 0; j < alumniRecord.jurusan[i].kelas.length; j++) {
          const muridIndex = alumniRecord.jurusan[i].kelas[j].murid.findIndex(m => m.muridId === muridId);
          if (muridIndex !== -1) {
            // Update murid data
            Object.keys(updateData).forEach(key => {
              if (updateData[key] !== undefined) {
                alumniRecord.jurusan[i].kelas[j].murid[muridIndex][key] = updateData[key];
              }
            });
            found = true;
            break;
          }
        }
        if (found) break;
      }
    } else if ((alumniObj.jenjang === 'SD' || alumniObj.jenjang === 'SMP') && alumniObj.kelas) {
      for (let i = 0; i < alumniRecord.kelas.length; i++) {
        const muridIndex = alumniRecord.kelas[i].murid.findIndex(m => m.muridId === muridId);
        if (muridIndex !== -1) {
          // Update murid data
          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
              alumniRecord.kelas[i].murid[muridIndex][key] = updateData[key];
            }
          });
          found = true;
          break;
        }
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Murid tidak ditemukan dalam data alumni',
      });
    }

    await alumniRecord.save();

    // Return updated flattened data
    const flattened = flattenAlumniData(alumniRecord.toObject());
    const updatedAlumni = flattened.find(a => a.muridId === muridId);

    return res.json({
      success: true,
      message: 'Alumni berhasil diperbarui',
      alumni: updatedAlumni,
    });
  } catch (error) {
    console.error('Update alumni error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui alumni',
    });
  }
};

// Delete alumni (removes a murid from the structure, or deletes entire record if empty)
export const deleteAlumni = async (req, res) => {
  try {
    const { id } = req.params; // This is the alumni record id
    const { muridId } = req.query; // Optional: if provided, only delete this murid

    const alumniRecord = await Alumni.findOne({ id });
    if (!alumniRecord) {
      return res.status(404).json({
        success: false,
        message: 'Alumni tidak ditemukan',
      });
    }

    // If muridId is provided, only remove that murid
    if (muridId) {
      let found = false;
      const alumniObj = alumniRecord.toObject();

      if (alumniObj.jenjang === 'SMA/SMK' && alumniObj.jurusan) {
        for (let i = 0; i < alumniRecord.jurusan.length; i++) {
          for (let j = 0; j < alumniRecord.jurusan[i].kelas.length; j++) {
            const muridIndex = alumniRecord.jurusan[i].kelas[j].murid.findIndex(m => m.muridId === muridId);
            if (muridIndex !== -1) {
              alumniRecord.jurusan[i].kelas[j].murid.splice(muridIndex, 1);
              found = true;
              
              // Remove kelas if empty
              if (alumniRecord.jurusan[i].kelas[j].murid.length === 0) {
                alumniRecord.jurusan[i].kelas.splice(j, 1);
              }
              
              // Remove jurusan if empty
              if (alumniRecord.jurusan[i].kelas.length === 0) {
                alumniRecord.jurusan.splice(i, 1);
              }
              break;
            }
          }
          if (found) break;
        }
      } else if ((alumniObj.jenjang === 'SD' || alumniObj.jenjang === 'SMP') && alumniObj.kelas) {
        for (let i = 0; i < alumniRecord.kelas.length; i++) {
          const muridIndex = alumniRecord.kelas[i].murid.findIndex(m => m.muridId === muridId);
          if (muridIndex !== -1) {
            alumniRecord.kelas[i].murid.splice(muridIndex, 1);
            found = true;
            
            // Remove kelas if empty
            if (alumniRecord.kelas[i].murid.length === 0) {
              alumniRecord.kelas.splice(i, 1);
            }
            break;
          }
        }
      }

      if (!found) {
        return res.status(404).json({
          success: false,
          message: 'Murid tidak ditemukan dalam data alumni',
        });
      }

      // If record is now empty, delete it
      const hasData = (alumniObj.jenjang === 'SMA/SMK' && alumniRecord.jurusan.length > 0) ||
                      ((alumniObj.jenjang === 'SD' || alumniObj.jenjang === 'SMP') && alumniRecord.kelas.length > 0);

      if (hasData) {
        await alumniRecord.save();
      } else {
        await Alumni.deleteOne({ id });
      }

      return res.json({
        success: true,
        message: 'Alumni berhasil dihapus',
      });
    } else {
      // Delete entire record
      await Alumni.deleteOne({ id });
      return res.json({
        success: true,
        message: 'Alumni berhasil dihapus',
      });
    }
  } catch (error) {
    console.error('Delete alumni error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus alumni',
    });
  }
};
