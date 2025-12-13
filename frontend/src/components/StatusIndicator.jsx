function StatusIndicator({ status = 'ready', message = null }) {
    const statusConfig = {
        ready: { text: 'Ready', color: '#4CAF50', icon: '●' },
        processing: { text: 'Processing...', color: '#2196F3', icon: '●' },
        complete: { text: 'Complete', color: '#4CAF50', icon: '✓' },
        success: { text: 'Success', color: '#4CAF50', icon: '✓' },
        error: { text: 'Error', color: '#f44336', icon: '✕' },
    };

    const currentStatus = statusConfig[status] || statusConfig.ready;
    const displayText = message || currentStatus.text;

    return (
        <div className="status-indicator">
            <div
                className="status-dot"
                style={{ backgroundColor: currentStatus.color }}
            >
                {currentStatus.icon}
            </div>
            <span className="status-text">{displayText}</span>
        </div>
    );
}

export default StatusIndicator;
