/**
 * WebSocket Service Layer
 * UI-agnostic service for managing WebSocket connections to the backend
 */

// Message types expected from backend
export const MESSAGE_TYPES = {
    IMU_STREAM: 'imu_stream',
    POSTURE_STATUS: 'posture_status',
    CALIBRATION_STATUS: 'calibration_status',
    FLEXION_CALIBRATION_STATUS: 'flexion_calibration_status',
    CALIBRATION_DONE: 'calibration_done',
    TASK_STATUS: 'task_status',
    TASK_PROGRESS: 'task_progress',
    TASK_RESULT: 'task_result',
    SESSION_REPORT: 'session_report',
    PROGRESS: 'progress',
    ERROR: 'error'
};

let socket = null;
let reconnectInterval = null;
let messageCallbacks = [];
let connectionCallbacks = [];
let disconnectionCallbacks = [];
let errorCallbacks = [];

const DEFAULT_WS_URL = 'ws://localhost:8000/ws/{user_id}';
const RECONNECT_DELAY = 5000;

/**
 * Connect to WebSocket server
 * @param {string} url - WebSocket server URL (optional)
 * @returns {WebSocket} The WebSocket instance
 */
/**
 * Connect to WebSocket server
 * @param {string} userId - User ID for the WebSocket connection
 * @param {string} baseUrl - Base WebSocket URL (optional, will use DEFAULT_WS_URL if not provided)
 * @returns {WebSocket} The WebSocket instance
 */
export function connect(userId = 'anonymous', baseUrl = null) {
    // If already connected, close the existing connection first
    if (socket) {
        socket.close();
        socket = null;
    }

    // Build the WebSocket URL
    let wsUrl = baseUrl || DEFAULT_WS_URL;
    wsUrl = wsUrl.replace('{user_id}', userId || 'anonymous');

    console.log(`[WebSocket] Connecting to ${wsUrl}...`);
    socket = new WebSocket(wsUrl);

    socket.onopen = handleOpen;
    socket.onmessage = handleMessage;
    socket.onerror = handleError;
    socket.onclose = handleClose;

    return socket;
}

/**
 * Send a command to the backend
 * @param {string} type - Command type
 * @param {Object} payload - Command payload
 */
export function sendCommand(type, payload = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('[WebSocket] Cannot send command: Not connected');
        return false;
    }

    const message = {
        type,
        payload,
        timestamp: new Date().toISOString()
    };

    try {
        socket.send(JSON.stringify(message));
        console.log(`[WebSocket] Sent command:`, message);
        return true;
    } catch (error) {
        console.error('[WebSocket] Error sending command:', error);
        return false;
    }
}

/**
 * Register a callback for incoming messages
 * @param {Function} callback - Function to call on message (receives data object)
 * @returns {Function} Unsubscribe function
 */
export function onMessage(callback) {
    if (typeof callback !== 'function') {
        console.error('[WebSocket] onMessage callback must be a function');
        return () => { };
    }

    messageCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
        messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
    };
}

/**
 * Register a callback for connection events
 * @param {Function} callback - Function to call when connected
 * @returns {Function} Unsubscribe function
 */
export function onConnect(callback) {
    if (typeof callback !== 'function') {
        console.error('[WebSocket] onConnect callback must be a function');
        return () => { };
    }

    connectionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
        connectionCallbacks = connectionCallbacks.filter(cb => cb !== callback);
    };
}

/**
 * Register a callback for disconnection events
 * @param {Function} callback - Function to call when disconnected
 * @returns {Function} Unsubscribe function
 */
export function onDisconnect(callback) {
    if (typeof callback !== 'function') {
        console.error('[WebSocket] onDisconnect callback must be a function');
        return () => { };
    }

    disconnectionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
        disconnectionCallbacks = disconnectionCallbacks.filter(cb => cb !== callback);
    };
}

/**
 * Register a callback for error events
 * @param {Function} callback - Function to call on error
 * @returns {Function} Unsubscribe function
 */
export function onError(callback) {
    if (typeof callback !== 'function') {
        console.error('[WebSocket] onError callback must be a function');
        return () => { };
    }

    errorCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
        errorCallbacks = errorCallbacks.filter(cb => cb !== callback);
    };
}

/**
 * Disconnect from WebSocket server
 */
export function disconnect() {
    console.log('[WebSocket] Disconnecting...');

    // Clear reconnect interval
    if (reconnectInterval) {
        clearTimeout(reconnectInterval);
        reconnectInterval = null;
    }

    // Close socket
    if (socket) {
        socket.close();
        socket = null;
    }

    // Clear all callbacks
    messageCallbacks = [];
    connectionCallbacks = [];
    disconnectionCallbacks = [];
    errorCallbacks = [];
}

/**
 * Get connection status
 * @returns {string} Connection status ('connected', 'connecting', 'disconnected')
 */
export function getConnectionStatus() {
    if (!socket) return 'disconnected';

    switch (socket.readyState) {
        case WebSocket.CONNECTING:
            return 'connecting';
        case WebSocket.OPEN:
            return 'connected';
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
            return 'disconnected';
        default:
            return 'disconnected';
    }
}

/**
 * Check if WebSocket is connected
 * @returns {boolean}
 */
export function isConnected() {
    return socket && socket.readyState === WebSocket.OPEN;
}

// ============================================================================
// Internal Event Handlers
// ============================================================================

function handleOpen() {
    console.log('[WebSocket] Connected successfully');

    // Clear reconnect interval
    if (reconnectInterval) {
        clearTimeout(reconnectInterval);
        reconnectInterval = null;
    }

    // Notify all connection callbacks
    connectionCallbacks.forEach(callback => {
        try {
            callback();
        } catch (error) {
            console.error('[WebSocket] Error in connection callback:', error);
        }
    });
}

function handleMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received message:', data);

        // Validate message type
        if (data.type && Object.values(MESSAGE_TYPES).includes(data.type)) {
            // Notify all message callbacks
            messageCallbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[WebSocket] Error in message callback:', error);
                }
            });
        } else {
            console.warn('[WebSocket] Received unknown message type:', data.type);
            // Still notify callbacks for unknown types
            messageCallbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[WebSocket] Error in message callback:', error);
                }
            });
        }
    } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
    }
}

function handleError(error) {
    console.error('[WebSocket] Error:', error);

    // Notify all error callbacks
    errorCallbacks.forEach(callback => {
        try {
            callback(error);
        } catch (err) {
            console.error('[WebSocket] Error in error callback:', err);
        }
    });
}

function handleClose(event) {
    console.log('[WebSocket] Connection closed', event);

    // Notify all disconnection callbacks
    disconnectionCallbacks.forEach(callback => {
        try {
            callback(event);
        } catch (error) {
            console.error('[WebSocket] Error in disconnection callback:', error);
        }
    });

    // Attempt to reconnect if this wasn't a clean close
    if (!event.wasClean && !reconnectInterval) {
        console.log(`[WebSocket] Connection lost. Reconnecting in ${RECONNECT_DELAY}ms...`);
        reconnectInterval = setTimeout(() => {
            reconnectInterval = null;
            connect();
        }, RECONNECT_DELAY);
    }
}

// ============================================================================
// Legacy API Support (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use connect() and onMessage() instead
 */
export function connectWebSocket(onMessageCallback, url) {
    console.warn('connectWebSocket() is deprecated. Use connect(userId) and onMessage() instead');
    const ws = connect('anonymous', url);
    onMessage(onMessageCallback);
    return ws;
}

/**
 * @deprecated Use disconnect() instead
 */
export function disconnectWebSocket() {
    disconnect();
}

/**
 * @deprecated Use sendCommand() instead
 */
export function sendWebSocketMessage(message) {
    if (typeof message === 'object' && message.type) {
        return sendCommand(message.type, message.payload || message);
    } else {
        console.warn('[WebSocket] sendWebSocketMessage called with invalid message format');
        return false;
    }
}
