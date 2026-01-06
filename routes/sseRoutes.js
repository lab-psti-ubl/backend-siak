import express from 'express';
import jwt from 'jsonwebtoken';
import { addSSEClient, removeSSEClient } from '../utils/sseBroadcaster.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware untuk authenticate SSE connection
 * EventSource tidak support custom headers, jadi kita gunakan query parameter
 */
const authenticateSSE = (req, res, next) => {
  // Get token from query parameter (EventSource doesn't support custom headers)
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request object
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token telah kedaluwarsa. Silakan login kembali.',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid. Silakan login kembali.',
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Gagal memverifikasi token.',
      });
    }
  }
};

/**
 * SSE endpoint untuk real-time updates absensi
 * Client dapat subscribe untuk mendapatkan notifikasi ketika ada auto-alfa
 * Usage: /api/sse/events?token=YOUR_JWT_TOKEN
 */
router.get('/events', authenticateSSE, (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Add client to set
  addSSEClient(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection-status',
    data: { status: 'connected' },
    timestamp: new Date().toISOString(),
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    removeSSEClient(res);
    res.end();
  });
});

export default router;

