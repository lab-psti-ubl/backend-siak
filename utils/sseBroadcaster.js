/**
 * SSE Broadcaster utility
 * Manages SSE connections and broadcasts events to connected clients
 */

// Store SSE connections
const sseClients = new Set();

/**
 * Add a client connection
 */
export const addSSEClient = (res) => {
  sseClients.add(res);
};

/**
 * Remove a client connection
 */
export const removeSSEClient = (res) => {
  sseClients.delete(res);
};

/**
 * Broadcast event to all connected SSE clients
 */
export const broadcastSSEEvent = (type, data) => {
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  sseClients.forEach((client) => {
    try {
      client.write(`data: ${message}\n\n`);
    } catch (error) {
      // Remove dead connections
      sseClients.delete(client);
    }
  });
};

/**
 * Get number of connected clients
 */
export const getConnectedClientsCount = () => {
  return sseClients.size;
};




