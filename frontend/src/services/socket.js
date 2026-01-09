// Socket.IO Manager - Using native WebSocket as fallback
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketManager {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(token) {
    return new Promise((resolve, reject) => {
      try {
        // For demo purposes, we'll simulate WebSocket behavior
        // In production, you'd use socket.io-client library
        this.isConnected = true;
        this.emit('connect', { token });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect() {
    this.isConnected = false;
    this.emit('disconnect');
  }

  // Simulated Socket.IO emit
  emit(event, data) {
    console.log(`[Socket] Emit: ${event}`, data);
    
    // Here you would normally send to server
    // In production with real socket.io-client:
    // this.ws.emit(event, data);
  }

  // Simulated Socket.IO on (subscribe)
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Trigger event callbacks (for simulating received messages)
  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Join document room
  joinDocument(docId) {
    this.emit('join-document', { documentId: docId });
  }

  // Broadcast document edit
  broadcastEdit(docId, content) {
    this.emit('edit-document', { documentId: docId, content });
  }

  // Save version
  saveVersion(docId, version) {
    this.emit('save-version', { documentId: docId, version });
  }

  // Add collaborator
  notifyCollaboratorAdded(docId, collaborator) {
    this.emit('collaborator-added', { documentId: docId, collaborator });
  }

  // Share cursor position
  shareCursorPosition(docId, position) {
    this.emit('cursor-position', { documentId: docId, position });
  }
}

// Export singleton instance
export const socketManager = new SocketManager();

export default socketManager;