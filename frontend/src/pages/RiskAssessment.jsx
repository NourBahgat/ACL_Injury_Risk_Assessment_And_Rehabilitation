import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HumanModel from '../components/HumanModel';
import StepInstructions from '../components/StepInstructions';
import StatusIndicator from '../components/StatusIndicator';
import CountdownTimer from '../components/CountdownTimer';
import { connect, onMessage, disconnect, MESSAGE_TYPES } from '../services/websocket';
import './RiskAssessment.css';

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

    // Upright posture detection state
    const [isUpright, setIsUpright] = useState(false);
    const [uprightStartTime, setUprightStartTime] = useState(null);
    const [uprightDuration, setUprightDuration] = useState(0);

    // Calibration state
    const [calibrationStartTime, setCalibrationStartTime] = useState(null);
    const [calibrationTimeRemaining, setCalibrationTimeRemaining] = useState(10);
    const CALIBRATION_DURATION = 10; // seconds

    // Jump landing task state
    const [taskStatus, setTaskStatus] = useState('idle'); // 'idle', 'running', 'processing', 'results'
    const [jumpAnimationPhase, setJumpAnimationPhase] = useState('stance'); // 'stance', 'jump', 'land'
    const [taskResultData, setTaskResultData] = useState(null);

    // Handle upright posture continuous detection (3 seconds)
    useEffect(() => {
        if (currentStep !== STEPS.UPRIGHT_CHECK) {
            // Reset upright state when not in upright check step
            setIsUpright(false);
            setUprightStartTime(null);
            setUprightDuration(0);
            return;
        }

        if (!isUpright) {
            // Reset timer if not upright
            setUprightStartTime(null);
            setUprightDuration(0);
            return;
        }

        // Start timer when upright is first detected
        if (isUpright && !uprightStartTime) {
            setUprightStartTime(Date.now());
        }

        // Update duration every 100ms
        const interval = setInterval(() => {
            if (uprightStartTime) {
                const duration = (Date.now() - uprightStartTime) / 1000;
                setUprightDuration(duration);

                // Auto-advance after 3 seconds of continuous upright posture
                if (duration >= 3) {
                    clearInterval(interval);
                    setCurrentStep(STEPS.CALIBRATION);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [currentStep, isUpright, uprightStartTime, STEPS.UPRIGHT_CHECK, STEPS.CALIBRATION]);

    // Handle calibration countdown
    useEffect(() => {
        if (currentStep !== STEPS.CALIBRATION) {
            // Reset calibration state when not in calibration step
            setCalibrationStartTime(null);
            setCalibrationTimeRemaining(CALIBRATION_DURATION);
            return;
        }

        // Send start_calibration command when entering calibration step
        if (!calibrationStartTime) {
            const { sendCommand } = require('../services/websocket');
            sendCommand('start_calibration');
            setCalibrationStartTime(Date.now());
        }

        // Update countdown every 100ms
        const interval = setInterval(() => {
            if (calibrationStartTime) {
                const elapsed = (Date.now() - calibrationStartTime) / 1000;
                const remaining = Math.max(0, CALIBRATION_DURATION - elapsed);
                setCalibrationTimeRemaining(remaining);

                // Note: Step advancement is handled by calibration_done message
                // not by timer completion
            }
        }, 100);

        return () => clearInterval(interval);
    }, [currentStep, calibrationStartTime, CALIBRATION_DURATION, STEPS.CALIBRATION]);

    // Initialize WebSocket connection
    useEffect(() => {
        const ws = connect();

        // Subscribe to WebSocket messages
        const unsubscribe = onMessage((data) => {
            setAssessmentData(data);

            // Handle different message types
            switch (data.type) {
                case MESSAGE_TYPES.POSTURE_STATUS:
                    // Update upright status from backend
                    if (data.payload && typeof data.payload.upright === 'boolean') {
                        setIsUpright(data.payload.upright);
                    }
                    break;

                case MESSAGE_TYPES.CALIBRATION_DONE:
                    if (currentStep === STEPS.CALIBRATION) {
                        setCurrentStep(STEPS.TASK_JUMP_LANDING);
                    }
                    break;

                case MESSAGE_TYPES.TASK_RESULT:
                    // Store result data and update task status to show results
                    if (data.payload) {
                        setTaskResultData(data.payload);
                        setTaskStatus('results');
                    }
                    break;

                default:
                    // Handle other message types
                    break;
            }
        });

        return () => {
            unsubscribe();
            disconnect();
        };
    }, [currentStep, STEPS.CALIBRATION, STEPS.TASK_JUMP_LANDING, STEPS.COMPLETE]);

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

    const handleStartTrial = () => {
        // Lock UI and send start_task command
        setTaskStatus('running');

        const { sendCommand } = require('../services/websocket');
        sendCommand('start_task', { task: 'jump_landing' });

        // Start jump animation sequence
        setTimeout(() => setJumpAnimationPhase('jump'), 500);
        setTimeout(() => setJumpAnimationPhase('land'), 1500);
        setTimeout(() => setJumpAnimationPhase('stance'), 2500);
    };

    const handleContinueToComplete = () => {
        // Advance from results to complete step
        setCurrentStep(STEPS.COMPLETE);
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
                    <div className="step-content upright-check">
                        <h2>Upright Position Check</h2>
                        <p>Please stand in an upright position.</p>

                        <div className="upright-status">
                            <StatusIndicator
                                status={isUpright ? 'success' : 'error'}
                                message={isUpright ? 'Upright detected' : 'Not upright'}
                            />

                            {isUpright && uprightDuration > 0 && (
                                <div className="upright-timer">
                                    <p>Hold position: {Math.ceil(3 - uprightDuration)}s remaining</p>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${(uprightDuration / 3) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="human-model-container">
                            <HumanModel highlightedJoint="spine" />
                        </div>
                    </div>
                );

            case STEPS.CALIBRATION:
                return (
                    <div className="step-content calibration">
                        <h2>Calibration</h2>
                        <p className="instruction-text">Remain still while sensors calibrate</p>

                        <div className="calibration-timer">
                            <div className="countdown-display">
                                <span className="countdown-number">{Math.ceil(calibrationTimeRemaining)}</span>
                                <span className="countdown-label">seconds remaining</span>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${((CALIBRATION_DURATION - calibrationTimeRemaining) / CALIBRATION_DURATION) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <StatusIndicator status="processing" message="Calibrating sensors..." />
                    </div>
                );

            case STEPS.TASK_JUMP_LANDING:
                return (
                    <div className="step-content task-jump-landing">
                        <h2>Jump Landing Assessment</h2>
                        <p className="instruction-text">Jump vertically and land naturally</p>

                        {/* Animated HumanModel Demo */}
                        <div className="jump-demo">
                            <HumanModel
                                highlight={taskStatus === 'running' ? 'active' : 'neutral'}
                                highlightedJoint="leg"
                            />
                            <p className="demo-label">Follow this motion</p>
                        </div>

                        {/* Task Status Display */}
                        {taskStatus === 'idle' && (
                            <div className="task-controls">
                                <button
                                    className="btn-start-trial"
                                    onClick={handleStartTrial}
                                >
                                    Start Trial
                                </button>
                                <p className="help-text">Click to begin the jump landing assessment</p>
                            </div>
                        )}

                        {taskStatus === 'running' && (
                            <div className="task-running">
                                <StatusIndicator status="active" message="Recording in progress..." />
                                <p className="task-instruction">Perform your jump landing now</p>
                            </div>
                        )}

                        {taskStatus === 'processing' && (
                            <div className="task-processing">
                                <StatusIndicator status="processing" message="Processing..." />
                                <p className="task-instruction">Analyzing your movement data</p>
                            </div>
                        )}

                        {taskStatus === 'results' && taskResultData && (
                            <div className="task-results">
                                <h3>Assessment Results</h3>

                                <div className="results-grid">
                                    {/* Left Knee Metrics */}
                                    <div className="knee-results left-knee-results">
                                        <h4>Left Knee</h4>

                                        <div className="metric">
                                            <span className="metric-label">Peak Flexion</span>
                                            <span className="metric-value">
                                                {taskResultData.leftKneeFlexion !== undefined
                                                    ? `${taskResultData.leftKneeFlexion.toFixed(1)}°`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="metric">
                                            <span className="metric-label">Peak Valgus</span>
                                            <span className="metric-value">
                                                {taskResultData.leftKneeValgus !== undefined
                                                    ? `${taskResultData.leftKneeValgus.toFixed(1)}°`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="metric risk-metric">
                                            <span className="metric-label">Risk Level</span>
                                            <span className="metric-value risk-value">
                                                {taskResultData.leftKneeRisk !== undefined
                                                    ? `${taskResultData.leftKneeRisk.toFixed(0)}%`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Knee Metrics */}
                                    <div className="knee-results right-knee-results">
                                        <h4>Right Knee</h4>

                                        <div className="metric">
                                            <span className="metric-label">Peak Flexion</span>
                                            <span className="metric-value">
                                                {taskResultData.rightKneeFlexion !== undefined
                                                    ? `${taskResultData.rightKneeFlexion.toFixed(1)}°`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="metric">
                                            <span className="metric-label">Peak Valgus</span>
                                            <span className="metric-value">
                                                {taskResultData.rightKneeValgus !== undefined
                                                    ? `${taskResultData.rightKneeValgus.toFixed(1)}°`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="metric risk-metric">
                                            <span className="metric-label">Risk Level</span>
                                            <span className="metric-value risk-value">
                                                {taskResultData.rightKneeRisk !== undefined
                                                    ? `${taskResultData.rightKneeRisk.toFixed(0)}%`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="btn-continue"
                                    onClick={handleContinueToComplete}
                                >
                                    Continue
                                </button>
                            </div>
                        )}
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
                {currentStep !== STEPS.UPRIGHT_CHECK && (
                    <div className="left-panel">
                        <HumanModel highlightedJoint="knee" />
                    </div>
                )}

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
