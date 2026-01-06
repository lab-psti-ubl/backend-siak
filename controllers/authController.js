import User from '../models/User.js';
import Guru from '../models/Guru.js';
import Murid from '../models/Murid.js';
import DataKepsek from '../models/DataKepsek.js';
import SystemActivation from '../models/SystemActivation.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { comparePassword, isPasswordHashed, hashPassword } from '../utils/passwordUtils.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi',
      });
    }

    // Hardcoded admin credentials
    if (email === 'garnusa@gmail.com' && password === 'garnusa123') {
      const hardcodedAdmin = {
        id: 'admin-hardcoded',
        name: 'Admin Garnusa',
        email: 'garnusa@gmail.com',
        role: 'admin',
        createdAt: new Date(),
      };

      // Check if admin needs activation
      const systemActivation = await SystemActivation.findOne();
      const requiresActivation = !systemActivation || !systemActivation.isSystemActive;

      // Generate JWT token
      const token = generateToken(hardcodedAdmin);

      return res.json({
        success: true,
        user: hardcodedAdmin,
        token,
        requiresActivation,
      });
    }

    // Check users collection first (admin and kepala_sekolah)
    let foundUser = await User.findOne({ email });
    let userRole = null;
    let userCollection = null;

    // If not found in users, check Guru collection
    if (!foundUser) {
      const foundGuru = await Guru.findOne({ email });
      if (foundGuru) {
        foundUser = foundGuru;
        userRole = 'guru';
        userCollection = 'guru';
      }
    }

    // If still not found, check Murid collection
    if (!foundUser) {
      const foundMurid = await Murid.findOne({ email });
      if (foundMurid) {
        foundUser = foundMurid;
        userRole = 'murid';
        userCollection = 'murid';
      }
    }

    // If still not found, check dataKepsek
    if (!foundUser) {
      const foundKepsek = await DataKepsek.findOne({ email });

      if (foundKepsek) {
        // Check if password is hashed, if not, hash it and update
        let isValidPassword = false;
        if (isPasswordHashed(foundKepsek.password)) {
          isValidPassword = await comparePassword(password, foundKepsek.password);
        } else {
          // Legacy: compare plain text, then hash and update
          isValidPassword = password === foundKepsek.password;
          if (isValidPassword) {
            foundKepsek.password = await hashPassword(password);
            await foundKepsek.save();
          }
        }

        if (isValidPassword) {
          // Create user object from dataKepsek for kepala_sekolah role
          const userObj = {
            id: foundKepsek.id,
            name: foundKepsek.nama,
            email: foundKepsek.email,
            role: 'kepala_sekolah',
            createdAt: foundKepsek.createdAt,
          };

          // Generate JWT token
          const token = generateToken(userObj);

          return res.json({
            success: true,
            user: userObj,
            token,
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Email atau password salah',
          });
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    // Determine role if not already set
    if (!userRole) {
      userRole = foundUser.role || 'admin';
      userCollection = foundUser.role === 'admin' || foundUser.role === 'kepala_sekolah' ? 'user' : null;
    }

    // Check if account is active
    // For guru (teachers), block login if inactive
    if (userRole === 'guru' && foundUser.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda tidak aktif. Silakan hubungi bagian akademik untuk informasi lebih lanjut.',
      });
    }

    // For murid (students), check if they are inactive due to graduation (alumni) or truly deactivated
    // Note: Alumni can still login, so we allow it

    // Check password based on role
    let isValidPassword = false;

    if (userRole === 'admin') {
      // Check if password is hashed
      if (foundUser.password && isPasswordHashed(foundUser.password)) {
        isValidPassword = await comparePassword(password, foundUser.password);
      } else {
        // Legacy: compare with default admin password
        isValidPassword = password === 'admin123';
        // If password matches and not hashed, hash it and update
        if (isValidPassword && foundUser.password !== 'admin123') {
          foundUser.password = await hashPassword('admin123');
          await foundUser.save();
        }
      }
    } else if (userRole === 'kepala_sekolah') {
      if (foundUser.password) {
        if (isPasswordHashed(foundUser.password)) {
          isValidPassword = await comparePassword(password, foundUser.password);
        } else {
          // Legacy: compare plain text, then hash and update
          isValidPassword = password === foundUser.password;
          if (isValidPassword) {
            foundUser.password = await hashPassword(password);
            await foundUser.save();
          }
        }
      } else {
        // Fallback to default admin password
        isValidPassword = password === 'admin123';
      }
    } else if (userRole === 'guru' || userRole === 'murid') {
      // Check system activation status for guru and murid
      const systemActivation = await SystemActivation.findOne();
      if (!systemActivation || !systemActivation.isSystemActive) {
        return res.status(403).json({
          success: false,
          message: 'Sistem aplikasi belum diaktifkan. Silakan hubungi administrator untuk mengaktifkan sistem.',
        });
      }

      // Check if user has password field
      if (foundUser.password) {
        if (isPasswordHashed(foundUser.password)) {
          isValidPassword = await comparePassword(password, foundUser.password);
        } else {
          // Legacy: compare plain text, then hash and update
          isValidPassword = password === foundUser.password;
          if (isValidPassword) {
            foundUser.password = await hashPassword(password);
            await foundUser.save();
          }
        }
      } else {
        // Fallback to default password
        isValidPassword = password === 'abc1234';
      }
    }

    if (isValidPassword) {
      // Convert mongoose document to plain object
      const userObj = foundUser.toObject();
      // Ensure role is set correctly
      if (!userObj.role) {
        userObj.role = userRole;
      }
      
      // Check if admin needs activation
      const systemActivation = await SystemActivation.findOne();
      const requiresActivation = userObj.role === 'admin' && 
        (!systemActivation || !systemActivation.isSystemActive);

      // Generate JWT token
      const token = generateToken(userObj);

      return res.json({
        success: true,
        user: userObj,
        token,
        requiresActivation,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Email atau password salah',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login',
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // If user is authenticated via token, return user from token
    if (req.user) {
      const { userId, email } = req.query;
      const userRole = req.user.role;
      
      // If query params provided, use them; otherwise use token data
      let user;
      if (userId) {
        // Search based on role from token
        if (userRole === 'guru') {
          user = await Guru.findOne({ id: userId });
        } else if (userRole === 'murid') {
          user = await Murid.findOne({ id: userId });
        } else {
          user = await User.findOne({ id: userId });
        }
      } else if (email) {
        // Search in all collections
        user = await User.findOne({ email });
        if (!user) {
          user = await Guru.findOne({ email });
        }
        if (!user) {
          user = await Murid.findOne({ email });
        }
      } else {
        // Use user from token - search based on role
        if (userRole === 'guru') {
          user = await Guru.findOne({ id: req.user.id });
        } else if (userRole === 'murid') {
          user = await Murid.findOne({ id: req.user.id });
        } else {
          user = await User.findOne({ id: req.user.id });
        }
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan',
        });
      }

      const userObj = user.toObject();
      // Ensure role is set
      if (!userObj.role) {
        userObj.role = userRole;
      }

      return res.json({
        success: true,
        user: userObj,
      });
    }

    // Fallback to query params if no token
    const { userId, email } = req.query;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID atau email diperlukan',
      });
    }

    let user;
    if (userId) {
      // Try all collections
      user = await User.findOne({ id: userId });
      if (!user) {
        user = await Guru.findOne({ id: userId });
      }
      if (!user) {
        user = await Murid.findOne({ id: userId });
      }
    } else {
      // Search by email in all collections
      user = await User.findOne({ email });
      if (!user) {
        user = await Guru.findOne({ email });
      }
      if (!user) {
        user = await Murid.findOne({ email });
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    const userObj = user.toObject();
    // Determine role based on which collection it came from
    if (!userObj.role) {
      if (user instanceof Guru || user.constructor.modelName === 'Guru') {
        userObj.role = 'guru';
      } else if (user instanceof Murid || user.constructor.modelName === 'Murid') {
        userObj.role = 'murid';
      } else {
        userObj.role = 'admin'; // Default
      }
    }

    return res.json({
      success: true,
      user: userObj,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data user',
    });
  }
};

