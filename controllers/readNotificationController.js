import InfoSekolah from '../models/InfoSekolah.js';
import mongoose from 'mongoose';

// Special identifier for read notifications document (for non-info-sekolah notifications)
const READ_NOTIFICATIONS_IDENTIFIER = '__READ_NOTIFICATIONS__';

// Helper function to get or create read notifications document (for non-info-sekolah notifications)
const getReadNotificationsDoc = async () => {
  let doc = await InfoSekolah.findOne({ judul: READ_NOTIFICATIONS_IDENTIFIER });
  
  if (!doc) {
    // Create new document for read notifications (non-info-sekolah)
    doc = new InfoSekolah({
      judul: READ_NOTIFICATIONS_IDENTIFIER,
      konten: 'Read Notifications Storage',
      jenis: 'umum',
      target: 'semua',
      isActive: false, // Hidden from normal info sekolah list
      createdBy: 'system',
      readNotifications: {}
    });
    await doc.save();
  }
  
  return doc;
};

// Helper function to get all read notification IDs for a user
const getUserReadNotificationIds = async (userId) => {
  const readNotificationIds = [];

  // 1. Get read notifications from info sekolah documents (using readBy field)
  const allInfoSekolah = await InfoSekolah.find({ 
    judul: { $ne: READ_NOTIFICATIONS_IDENTIFIER } 
  });
  
  allInfoSekolah.forEach(info => {
    const infoId = info._id.toString();
    const readBy = info.readBy || [];
    if (Array.isArray(readBy) && readBy.includes(userId)) {
      readNotificationIds.push(`info-${infoId}`);
    }
  });

  // 2. Get read notifications from separate document (for non-info-sekolah notifications)
  const doc = await getReadNotificationsDoc();
  const readNotifications = doc.readNotifications || {};
  const nonInfoReadIds = readNotifications[userId] || [];
  
  if (Array.isArray(nonInfoReadIds)) {
    readNotificationIds.push(...nonInfoReadIds);
  }

  return readNotificationIds;
};

// Get read notifications for a user
export const getByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID wajib diisi' 
      });
    }

    const readNotificationIds = await getUserReadNotificationIds(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        readNotificationIds: readNotificationIds
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or update read notifications for a user
export const upsert = async (req, res) => {
  try {
    const { userId, readNotificationIds } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID wajib diisi' 
      });
    }

    if (!Array.isArray(readNotificationIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'readNotificationIds harus berupa array' 
      });
    }

    // Remove duplicates
    const uniqueIds = [...new Set(readNotificationIds)];

    // Separate info sekolah notifications from others
    const infoSekolahIds = [];
    const otherNotificationIds = [];

    uniqueIds.forEach(id => {
      if (id.startsWith('info-')) {
        infoSekolahIds.push(id.replace('info-', ''));
      } else {
        otherNotificationIds.push(id);
      }
    });

    // Update info sekolah documents using $addToSet to avoid version conflicts
    if (infoSekolahIds.length > 0) {
      const validObjectIds = infoSekolahIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      if (validObjectIds.length > 0) {
        // Use updateMany with $addToSet to add userId to readBy array
        await InfoSekolah.updateMany(
          { _id: { $in: validObjectIds } },
          { $addToSet: { readBy: userId } }
        );
      }
    }

    // Update non-info-sekolah notifications
    const doc = await getReadNotificationsDoc();
    const readNotifications = doc.readNotifications || {};
    readNotifications[userId] = otherNotificationIds;
    
    doc.readNotifications = readNotifications;
    await doc.save();

    // Return updated read notifications
    const updatedReadNotificationIds = await getUserReadNotificationIds(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        readNotificationIds: updatedReadNotificationIds
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a notification ID to read list
export const markAsRead = async (req, res) => {
  try {
    const { userId, notificationId } = req.body;
    
    if (!userId || !notificationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID dan Notification ID wajib diisi' 
      });
    }

    // Check if this is an info sekolah notification (format: info-{infoId})
    if (notificationId.startsWith('info-')) {
      const infoId = notificationId.replace('info-', '');
      
      // Use findByIdAndUpdate with $addToSet to avoid version conflicts
      if (mongoose.Types.ObjectId.isValid(infoId)) {
        await InfoSekolah.findByIdAndUpdate(
          infoId,
          { $addToSet: { readBy: userId } },
          { new: true }
        );
      }
    } else {
      // For non-info-sekolah notifications, use separate document
      const doc = await getReadNotificationsDoc();
      const readNotifications = doc.readNotifications || {};
      const userReadIds = readNotifications[userId] || [];
      
      // Add notificationId if not already in the list
      if (!userReadIds.includes(notificationId)) {
        userReadIds.push(notificationId);
        readNotifications[userId] = userReadIds;
        doc.readNotifications = readNotifications;
        await doc.save();
      }
    }

    // Return updated read notifications
    const readNotificationIds = await getUserReadNotificationIds(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        readNotificationIds: readNotificationIds
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark multiple notifications as read
export const markMultipleAsRead = async (req, res) => {
  try {
    const { userId, notificationIds } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID wajib diisi' 
      });
    }

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'notificationIds harus berupa array' 
      });
    }

    // Separate info sekolah notifications from others
    const infoSekolahIds = [];
    const otherNotificationIds = [];

    notificationIds.forEach(id => {
      if (id.startsWith('info-')) {
        infoSekolahIds.push(id.replace('info-', ''));
      } else {
        otherNotificationIds.push(id);
      }
    });

    // Update info sekolah documents using $addToSet to avoid version conflicts
    if (infoSekolahIds.length > 0) {
      const validObjectIds = infoSekolahIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      if (validObjectIds.length > 0) {
        // Use updateMany with $addToSet to add userId to readBy array
        await InfoSekolah.updateMany(
          { _id: { $in: validObjectIds } },
          { $addToSet: { readBy: userId } }
        );
      }
    }

    // Update non-info-sekolah notifications
    if (otherNotificationIds.length > 0) {
      const doc = await getReadNotificationsDoc();
      const readNotifications = doc.readNotifications || {};
      const userReadIds = readNotifications[userId] || [];
      
      // Add new notificationIds to existing list (avoid duplicates)
      const existingIds = new Set(userReadIds);
      otherNotificationIds.forEach(id => existingIds.add(id));
      readNotifications[userId] = Array.from(existingIds);
      
      doc.readNotifications = readNotifications;
      await doc.save();
    }

    // Return updated read notifications
    const readNotificationIds = await getUserReadNotificationIds(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        readNotificationIds: readNotificationIds
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

