import { useState, useEffect } from 'react';

function CountdownTimer({ duration = 30, onComplete }) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (onComplete) {
                onComplete();
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, onComplete]);

    const handleStart = () => {
        setIsActive(true);
    };

    const handleReset = () => {
        setIsActive(false);
        setTimeLeft(duration);
    };

    return (
        <div className="countdown-timer">
            <div className="timer-display">
                <span className="time">{timeLeft}s</span>
            </div>
            <div className="timer-controls">
                {!isActive && timeLeft === duration && (
                    <button onClick={handleStart}>Start Timer</button>
                )}
                {timeLeft !== duration && (
                    <button onClick={handleReset}>Reset</button>
                )}
            </div>
        </div>
    );
}

export default CountdownTimer;
