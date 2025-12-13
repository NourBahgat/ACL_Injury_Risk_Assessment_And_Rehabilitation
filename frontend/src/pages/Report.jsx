import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Report.css';

function Report() {
    const navigate = useNavigate();
    const location = useLocation();
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        // Get report data from location state or fetch from backend
        const data = location.state?.reportData || {
            // Mock data for demonstration
            movements: [
                {
                    name: 'Jump Landing',
                    leftKneeFlexion: 45.2,
                    leftKneeValgus: 12.5,
                    leftKneeRisk: 35,
                    rightKneeFlexion: 42.8,
                    rightKneeValgus: 8.3,
                    rightKneeRisk: 25
                }
            ],
            overallRisk: 30,
            timestamp: new Date().toISOString()
        };

        setReportData(data);
    }, [location.state]);

    // Risk classification function
    const getRiskLevel = (riskPercentage) => {
        if (riskPercentage < 30) return 'Low';
        if (riskPercentage <= 70) return 'Moderate';
        return 'High';
    };

    // Get risk color
    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'Low':
                return '#51CF66';
            case 'Moderate':
                return '#FFD43B';
            case 'High':
                return '#FF6B6B';
            default:
                return '#9E9E9E';
        }
    };

    // Download report stub
    const handleDownloadReport = () => {
        // TODO: Implement PDF generation or backend download
        alert('Download functionality will be implemented. Report data ready for export.');
        console.log('Report data:', reportData);
    };

    const handleNewAssessment = () => {
        navigate('/program-select');
    };

    if (!reportData) {
        return (
            <div className="page report">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading report...</p>
                </div>
            </div>
        );
    }

    const overallRiskLevel = getRiskLevel(reportData.overallRisk);

    return (
        <div className="page report">
            <div className="report-container">
                <header className="report-header">
                    <h1>ACL Risk Assessment Report</h1>
                    <p className="report-date">
                        {new Date(reportData.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </header>

                {/* Final Verdict - Prominent Display */}
                <div
                    className="verdict-card"
                    style={{
                        borderColor: getRiskColor(overallRiskLevel),
                        background: `linear-gradient(135deg, ${getRiskColor(overallRiskLevel)}15, ${getRiskColor(overallRiskLevel)}05)`
                    }}
                >
                    <h2>Final Verdict</h2>
                    <div
                        className="verdict-level"
                        style={{ color: getRiskColor(overallRiskLevel) }}
                    >
                        {overallRiskLevel} Risk
                    </div>
                    <div className="verdict-percentage">
                        {reportData.overallRisk.toFixed(0)}% Risk Score
                    </div>
                </div>

                {/* Risk Classification Legend */}
                <div className="risk-legend">
                    <h3>Risk Classification</h3>
                    <div className="legend-items">
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: '#51CF66' }}></div>
                            <span className="legend-label">Low</span>
                            <span className="legend-range">&lt; 30%</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: '#FFD43B' }}></div>
                            <span className="legend-label">Moderate</span>
                            <span className="legend-range">30 – 70%</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: '#FF6B6B' }}></div>
                            <span className="legend-label">High</span>
                            <span className="legend-range">&gt; 70%</span>
                        </div>
                    </div>
                </div>

                {/* Movement Summary Tables */}
                <div className="movements-section">
                    <h3>Movement Analysis</h3>

                    {reportData.movements.map((movement, index) => (
                        <div key={index} className="movement-table-container">
                            <h4>{movement.name}</h4>

                            <table className="summary-table">
                                <thead>
                                    <tr>
                                        <th>Knee</th>
                                        <th>Peak Flexion</th>
                                        <th>Peak Valgus</th>
                                        <th>Risk %</th>
                                        <th>Classification</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="knee-label">Left</td>
                                        <td>{movement.leftKneeFlexion.toFixed(1)}°</td>
                                        <td>{movement.leftKneeValgus.toFixed(1)}°</td>
                                        <td className="risk-percentage">{movement.leftKneeRisk}%</td>
                                        <td>
                                            <span
                                                className="risk-badge"
                                                style={{
                                                    background: getRiskColor(getRiskLevel(movement.leftKneeRisk)),
                                                    color: getRiskLevel(movement.leftKneeRisk) === 'Moderate' ? '#333' : 'white'
                                                }}
                                            >
                                                {getRiskLevel(movement.leftKneeRisk)}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="knee-label">Right</td>
                                        <td>{movement.rightKneeFlexion.toFixed(1)}°</td>
                                        <td>{movement.rightKneeValgus.toFixed(1)}°</td>
                                        <td className="risk-percentage">{movement.rightKneeRisk}%</td>
                                        <td>
                                            <span
                                                className="risk-badge"
                                                style={{
                                                    background: getRiskColor(getRiskLevel(movement.rightKneeRisk)),
                                                    color: getRiskLevel(movement.rightKneeRisk) === 'Moderate' ? '#333' : 'white'
                                                }}
                                            >
                                                {getRiskLevel(movement.rightKneeRisk)}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="report-actions">
                    <button
                        className="btn-download"
                        onClick={handleDownloadReport}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Report
                    </button>

                    <button
                        className="btn-new-assessment"
                        onClick={handleNewAssessment}
                    >
                        Start New Assessment
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Report;
