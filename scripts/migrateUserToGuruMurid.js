import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Import models
import User from '../models/User.js';
import Guru from '../models/Guru.js';
import Murid from '../models/Murid.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/siak_db';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Migration function
const migrateData = async () => {
  try {
    console.log('\n🚀 Starting migration from User collection to Guru and Murid collections...\n');

    // Get all users with role 'guru' or 'murid'
    // Note: We need to query directly from MongoDB collection because schema now only allows admin/kepala_sekolah
    const UserCollection = mongoose.connection.collection('users');
    const usersToMigrate = await UserCollection.find({
      role: { $in: ['guru', 'murid'] }
    }).toArray();

    console.log(`📊 Found ${usersToMigrate.length} users to migrate`);
    console.log(`   - Guru: ${usersToMigrate.filter(u => u.role === 'guru').length}`);
    console.log(`   - Murid: ${usersToMigrate.filter(u => u.role === 'murid').length}\n`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No data to migrate. Migration complete!');
      return;
    }

    // Separate users by role
    const gurus = usersToMigrate.filter(u => u.role === 'guru');
    const murids = usersToMigrate.filter(u => u.role === 'murid');

    let guruMigrated = 0;
    let guruSkipped = 0;
    let muridMigrated = 0;
    let muridSkipped = 0;
    let guruDeleted = 0;
    let muridDeleted = 0;

    // Migrate Gurus
    if (gurus.length > 0) {
      console.log('📝 Migrating Gurus...');
      for (const guru of gurus) {
        try {
          // Check if guru already exists in Guru collection
          const existingGuru = await Guru.findOne({ id: guru.id });
          if (existingGuru) {
            console.log(`   ⚠️  Guru with ID ${guru.id} (${guru.name}) already exists in Guru collection. Skipping...`);
            guruSkipped++;
            continue;
          }

          // Check if email already exists in Guru collection
          const existingEmail = await Guru.findOne({ email: guru.email });
          if (existingEmail) {
            console.log(`   ⚠️  Guru with email ${guru.email} already exists in Guru collection. Skipping...`);
            guruSkipped++;
            continue;
          }

          // Create new Guru document
          const guruData = {
            id: guru.id,
            name: guru.name,
            email: guru.email,
            phone: guru.phone,
            password: guru.password,
            avatar: guru.avatar,
            profileImage: guru.profileImage,
            nip: guru.nip,
            subject: guru.subject,
            isWaliKelas: guru.isWaliKelas,
            kelasWali: guru.kelasWali,
            isActive: guru.isActive,
            rfidGuid: guru.rfidGuid,
            riwayatKelasWali: guru.riwayatKelasWali || [],
            createdAt: guru.createdAt,
          };

          await Guru.create(guruData);
          console.log(`   ✅ Migrated guru: ${guru.name} (${guru.email})`);
          guruMigrated++;

          // Delete from User collection after successful migration
          await UserCollection.deleteOne({ id: guru.id });
          guruDeleted++;
        } catch (error) {
          console.error(`   ❌ Error migrating guru ${guru.id} (${guru.name}):`, error.message);
        }
      }
      console.log(`\n   📊 Guru migration summary: ${guruMigrated} migrated, ${guruSkipped} skipped, ${guruDeleted} deleted from User\n`);
    }

    // Migrate Murids
    if (murids.length > 0) {
      console.log('📝 Migrating Murids...');
      for (const murid of murids) {
        try {
          // Check if murid already exists in Murid collection
          const existingMurid = await Murid.findOne({ id: murid.id });
          if (existingMurid) {
            console.log(`   ⚠️  Murid with ID ${murid.id} (${murid.name}) already exists in Murid collection. Skipping...`);
            muridSkipped++;
            continue;
          }

          // Check if email already exists in Murid collection
          const existingEmail = await Murid.findOne({ email: murid.email });
          if (existingEmail) {
            console.log(`   ⚠️  Murid with email ${murid.email} already exists in Murid collection. Skipping...`);
            muridSkipped++;
            continue;
          }

          // Create new Murid document
          const muridData = {
            id: murid.id,
            name: murid.name,
            email: murid.email,
            password: murid.password,
            avatar: murid.avatar,
            profileImage: murid.profileImage,
            nisn: murid.nisn,
            kelasId: murid.kelasId,
            qrCode: murid.qrCode,
            whatsappOrtu: murid.whatsappOrtu,
            isActive: murid.isActive,
            rfidGuid: murid.rfidGuid,
            createdAt: murid.createdAt,
          };

          await Murid.create(muridData);
          console.log(`   ✅ Migrated murid: ${murid.name} (${murid.email})`);
          muridMigrated++;

          // Delete from User collection after successful migration
          await UserCollection.deleteOne({ id: murid.id });
          muridDeleted++;
        } catch (error) {
          console.error(`   ❌ Error migrating murid ${murid.id} (${murid.name}):`, error.message);
        }
      }
      console.log(`\n   📊 Murid migration summary: ${muridMigrated} migrated, ${muridSkipped} skipped, ${muridDeleted} deleted from User\n`);
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Gurus migrated: ${guruMigrated}`);
    console.log(`⚠️  Gurus skipped: ${guruSkipped}`);
    console.log(`🗑️  Gurus deleted from User: ${guruDeleted}`);
    console.log(`✅ Murids migrated: ${muridMigrated}`);
    console.log(`⚠️  Murids skipped: ${muridSkipped}`);
    console.log(`🗑️  Murids deleted from User: ${muridDeleted}`);
    console.log(`\n📝 Total processed: ${usersToMigrate.length}`);
    console.log(`✅ Total migrated: ${guruMigrated + muridMigrated}`);
    console.log(`⚠️  Total skipped: ${guruSkipped + muridSkipped}`);
    console.log(`🗑️  Total deleted from User: ${guruDeleted + muridDeleted}`);
    console.log('='.repeat(60));
    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration error:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await migrateData();
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
main();

