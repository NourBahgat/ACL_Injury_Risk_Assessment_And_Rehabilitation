import { useNavigate } from 'react-router-dom';

function ProgramSelect() {
    const navigate = useNavigate();

    const handleCardClick = (route) => {
        if (route) {
            navigate(route);
        }
    };

    return (
        <div className="program-select-page">
            <div className="program-select-container">
                <h1 className="platform-title">ACL Performance Platform</h1>

                <div className="program-cards">
                    <div
                        className="program-card enabled"
                        onClick={() => handleCardClick('/risk')}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && handleCardClick('/risk')}
                        aria-label="ACL Injury Risk Assessment"
                    >
                        <div className="card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                            </svg>
                        </div>
                        <h2>ACL Injury Risk Assessment</h2>
                        <p>Evaluate biomechanical risk factors for ACL injuries using motion analysis</p>
                        <div className="card-status enabled-badge">Available</div>
                    </div>

                    <div
                        className="program-card disabled"
                        role="button"
                        tabIndex={-1}
                        aria-label="ACL Rehabilitation - Coming Soon"
                        aria-disabled="true"
                    >
                        <div className="card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <h2>ACL Rehabilitation</h2>
                        <p>Guided post-surgery rehabilitation programs and progress tracking</p>
                        <div className="card-status disabled-badge">Coming Soon</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProgramSelect;
