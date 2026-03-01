import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Import model
import DataFaceRecognition from '../models/DataFaceRecognition.js';

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

/**
 * Convert array of floats to base64 string (Node.js compatible)
 * Matches the browser implementation: Float32Array -> Uint8Array -> base64
 * @param {number[]} floatArray - Array of float numbers
 * @returns {string} Base64 encoded string
 */
const floatArrayToBase64 = (floatArray) => {
  // Convert array to Float32Array
  const float32Array = new Float32Array(floatArray);
  // Convert Float32Array buffer to Uint8Array (matching browser implementation)
  const uint8Array = new Uint8Array(float32Array.buffer);
  // Convert Uint8Array to Buffer and then to base64 string
  const buffer = Buffer.from(uint8Array);
  return buffer.toString('base64');
};

/**
 * Migration function
 * Migrates data from old collection 'datafacerecognition' to new collection 'datafacerecognation'
 */
const migrateData = async () => {
  try {
    console.log('\n🚀 Starting migration from datafacerecognition to datafacerecognation...\n');
    console.log('   Source collection: datafacerecognition (old format)');
    console.log('   Target collection: datafacerecognation (new format)\n');

    // Get old collection (datafacerecognition - with "i")
    const oldCollection = mongoose.connection.collection('datafacerecognition');
    
    // Get new collection (datafacerecognation - without "i")
    const newCollection = mongoose.connection.collection('datafacerecognation');

    // Query all documents from old collection
    const oldFormatDocs = await oldCollection.find({}).toArray();

    console.log(`📊 Found ${oldFormatDocs.length} documents in old collection to migrate\n`);

    if (oldFormatDocs.length === 0) {
      console.log('✅ No data to migrate. Migration complete!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const doc of oldFormatDocs) {
      try {
        const { _id, guruId, faceEmbeddings, registeredAt, method } = doc;

        console.log(`🔄 Migrating document for guruId: ${guruId}`);

        // Check if document already exists in new collection
        const existingDoc = await newCollection.findOne({ guruId });
        if (existingDoc) {
          console.log(`   ⚠️  Document already exists in new collection, skipping...`);
          skippedCount++;
          continue;
        }

        // Validate guruId
        if (!guruId) {
          console.log(`   ⚠️  Skipping: guruId is missing`);
          errorCount++;
          continue;
        }

        // Validate faceEmbeddings
        if (!Array.isArray(faceEmbeddings) || faceEmbeddings.length === 0) {
          console.log(`   ⚠️  Skipping: faceEmbeddings is empty or invalid`);
          errorCount++;
          continue;
        }

        // Limit to maximum 3 embeddings
        const maxEmbeddings = 3;
        const embeddingsToProcess = faceEmbeddings.slice(0, maxEmbeddings);
        const totalEmbeddings = faceEmbeddings.length;
        
        if (totalEmbeddings > maxEmbeddings) {
          console.log(`   ℹ️  Found ${totalEmbeddings} embeddings, migrating only first ${maxEmbeddings}`);
        }

        // Convert each faceEmbedding array to base64 string (max 3)
        const faceDescriptors = [];
        for (let i = 0; i < embeddingsToProcess.length; i++) {
          const embedding = embeddingsToProcess[i];
          
          if (!Array.isArray(embedding) || embedding.length === 0) {
            console.log(`   ⚠️  Skipping empty embedding at index ${i}`);
            continue;
          }

          try {
            const base64String = floatArrayToBase64(embedding);
            faceDescriptors.push(base64String);
            console.log(`   ✓ Converted embedding ${i + 1}/${embeddingsToProcess.length} (${embedding.length} floats)`);
          } catch (error) {
            console.log(`   ✗ Error converting embedding ${i + 1}: ${error.message}`);
          }
        }

        if (faceDescriptors.length === 0) {
          console.log(`   ⚠️  No valid descriptors created, skipping document`);
          errorCount++;
          continue;
        }

        // Prepare new document data
        const newDoc = {
          guruId,
          faceDescriptors,
          createdAt: registeredAt || new Date(),
          updatedAt: registeredAt || new Date(),
        };

        // Insert into new collection
        await newCollection.insertOne(newDoc);

        console.log(`   ✅ Successfully migrated ${faceDescriptors.length} descriptors to new collection`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating document ${doc._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount} documents`);
    console.log(`   ⏭️  Skipped (already exists): ${skippedCount} documents`);
    console.log(`   ❌ Errors/Skipped: ${errorCount} documents`);
    console.log(`   📝 Total processed: ${oldFormatDocs.length} documents\n`);

    if (successCount > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('\n💡 Note: Old collection "datafacerecognition" still exists.');
      console.log('   You can delete it manually after verifying the migration.\n');
    } else {
      console.log('⚠️  Migration completed with no successful migrations.');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await migrateData();
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
main();
