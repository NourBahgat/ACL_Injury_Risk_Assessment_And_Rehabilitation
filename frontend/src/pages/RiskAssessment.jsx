import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HumanModel from '../components/HumanModel';
import StepInstructions from '../components/StepInstructions';
import StatusIndicator from '../components/StatusIndicator';
import CountdownTimer from '../components/CountdownTimer';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';

function RiskAssessment() {
    const location = useLocation();
    const navigate = useNavigate();

    // Session state machine with defined steps
    const STEPS = {
        CONNECT: 'connect',
        UPRIGHT_CHECK: 'upright_check',
        CALIBRATION: 'calibration',
        TASK_JUMP_LANDING: 'task_jump_landing',
        COMPLETE: 'complete'
    };

    const [currentStep, setCurrentStep] = useState(STEPS.CONNECT);
    const [assessmentData, setAssessmentData] = useState(null);
    const [status, setStatus] = useState('ready');

    // Handle step progression
    useEffect(() => {
        // You can add automatic step transitions or validations here
        // based on assessmentData or other conditions
    }, [currentStep, assessmentData]);

    useEffect(() => {
        // Initialize WebSocket connection
        const ws = connectWebSocket((data) => {
            // Handle incoming WebSocket data
            setAssessmentData(data);

            // Auto-advance from connect step when connected
            if (currentStep === STEPS.CONNECT && data?.connected) {
                setCurrentStep(STEPS.UPRIGHT_CHECK);
            }
        });

        return () => {
            disconnectWebSocket();
        };
    }, [currentStep, STEPS.CONNECT, STEPS.UPRIGHT_CHECK]);

    const handleNextStep = () => {
        switch (currentStep) {
            case STEPS.CONNECT:
                setCurrentStep(STEPS.UPRIGHT_CHECK);
                break;
            case STEPS.UPRIGHT_CHECK:
                setCurrentStep(STEPS.CALIBRATION);
                break;
            case STEPS.CALIBRATION:
                setCurrentStep(STEPS.TASK_JUMP_LANDING);
                break;
            case STEPS.TASK_JUMP_LANDING:
                setCurrentStep(STEPS.COMPLETE);
                break;
            case STEPS.COMPLETE:
                navigate('/report');
                break;
            default:
                break;
        }
    };

    const handleComplete = () => {
        navigate('/report');
    };

    // Render UI based on current step
    const renderStepContent = () => {
        switch (currentStep) {
            case STEPS.CONNECT:
                return (
                    <div className="step-content">
                        <h2>Connecting to Sensor System</h2>
                        <p>Please wait while we establish connection...</p>
                        <StatusIndicator status={status} />
                    </div>
                );

            case STEPS.UPRIGHT_CHECK:
                return (
                    <div className="step-content">
                        <h2>Upright Position Check</h2>
                        <p>Please stand in an upright position for calibration.</p>
                        <StepInstructions step="upright_check" />
                        <CountdownTimer duration={10} onComplete={handleNextStep} />
                    </div>
                );

            case STEPS.CALIBRATION:
                return (
                    <div className="step-content">
                        <h2>Calibration</h2>
                        <p>Calibrating sensors... Please remain still.</p>
                        <StepInstructions step="calibration" />
                        <CountdownTimer duration={15} onComplete={handleNextStep} />
                    </div>
                );

            case STEPS.TASK_JUMP_LANDING:
                return (
                    <div className="step-content">
                        <h2>Jump Landing Assessment</h2>
                        <p>Follow the instructions to perform the jump landing task.</p>
                        <StepInstructions step="task_jump_landing" />
                        <CountdownTimer duration={30} onComplete={handleNextStep} />
                    </div>
                );

            case STEPS.COMPLETE:
                return (
                    <div className="step-content">
                        <h2>Assessment Complete</h2>
                        <p>Processing results... You will be redirected to the report.</p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="page risk-assessment">
            <h1>Risk Assessment in Progress</h1>
            <div className="step-indicator">
                Current Step: <strong>{currentStep}</strong>
            </div>

            <div className="assessment-content">
                <div className="left-panel">
                    <HumanModel highlightedJoint="knee" />
                </div>

                <div className="right-panel">
                    {renderStepContent()}

                    <div className="controls">
                        {currentStep !== STEPS.COMPLETE && (
                            <button onClick={handleNextStep}>Next Step</button>
                        )}
                        {currentStep === STEPS.COMPLETE && (
                            <button onClick={handleComplete}>View Report</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RiskAssessment;
