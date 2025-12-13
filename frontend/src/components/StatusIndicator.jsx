function StatusIndicator({ status = 'ready' }) {
    const statusConfig = {
        ready: { text: 'Ready', color: '#4CAF50' },
        processing: { text: 'Processing...', color: '#2196F3' },
        complete: { text: 'Complete', color: '#4CAF50' },
        error: { text: 'Error', color: '#f44336' },
    };

    const currentStatus = statusConfig[status] || statusConfig.ready;

    return (
        <div className="status-indicator">
            <div
                className="status-dot"
                style={{ backgroundColor: currentStatus.color }}
            />
            <span className="status-text">{currentStatus.text}</span>
        </div>
    );
}

export default StatusIndicator;
