let socket = null;
let reconnectInterval = null;

export function connectWebSocket(onMessage, url = 'ws://localhost:8000/ws') {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return socket;
    }

    socket = new WebSocket(url);

    socket.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (onMessage) {
                onMessage(data);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        if (!reconnectInterval) {
            reconnectInterval = setTimeout(() => {
                console.log('Attempting to reconnect...');
                connectWebSocket(onMessage, url);
            }, 5000);
        }
    };

    return socket;
}

export function disconnectWebSocket() {
    if (socket) {
        socket.close();
        socket = null;
    }
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
    }
}

export function sendWebSocketMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not connected');
    }
}
