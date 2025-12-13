import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Report() {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        // Fetch report data
        // This would typically come from your backend
        setReportData({
            overallRisk: 'Low',
            score: 85,
            recommendations: [
                'Continue current rehabilitation protocol',
                'Focus on balance exercises',
                'Increase strength training gradually'
            ]
        });
    }, []);

    const handleNewAssessment = () => {
        navigate('/program-select');
    };

    if (!reportData) {
        return <div className="page report">Loading report...</div>;
    }

    return (
        <div className="page report">
            <h1>Assessment Report</h1>

            <div className="report-summary">
                <h2>Overall Risk Level: {reportData.overallRisk}</h2>
                <p>Score: {reportData.score}/100</p>
            </div>

            <div className="recommendations">
                <h3>Recommendations</h3>
                <ul>
                    {reportData.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                    ))}
                </ul>
            </div>

            <button onClick={handleNewAssessment}>Start New Assessment</button>
        </div>
    );
}

export default Report;
