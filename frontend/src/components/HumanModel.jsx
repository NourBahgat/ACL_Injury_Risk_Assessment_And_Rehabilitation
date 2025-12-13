import { useState } from 'react';

function HumanModel({ highlightedJoint = null }) {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    return (
        <div className="human-model">
            <h3>Body Model</h3>
            <div className="model-container">
                <svg viewBox="0 0 200 400" className="body-diagram">
                    {/* Simple human body representation */}
                    <circle cx="100" cy="40" r="20" fill="#ddd" />
                    <line x1="100" y1="60" x2="100" y2="150" stroke="#333" strokeWidth="3" />
                    <line x1="100" y1="80" x2="60" y2="120" stroke="#333" strokeWidth="3" />
                    <line x1="100" y1="80" x2="140" y2="120" stroke="#333" strokeWidth="3" />
                    <line x1="100" y1="150" x2="70" y2="220" stroke="#333" strokeWidth="3" />
                    <line x1="100" y1="150" x2="130" y2="220" stroke="#333" strokeWidth="3" />
                    <line x1="70" y1="220" x2="60" y2="300" stroke="#333" strokeWidth="3" />
                    <line x1="130" y1="220" x2="140" y2="300" stroke="#333" strokeWidth="3" />

                    {/* Highlight knee joints */}
                    {highlightedJoint === 'knee' && (
                        <>
                            <circle cx="70" cy="220" r="8" fill="red" opacity="0.6" />
                            <circle cx="130" cy="220" r="8" fill="red" opacity="0.6" />
                        </>
                    )}
                </svg>
            </div>
        </div>
    );
}

export default HumanModel;
