import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HumanModel from '../components/HumanModel';
import StepInstructions from '../components/StepInstructions';
import StatusIndicator from '../components/StatusIndicator';
import CountdownTimer from '../components/CountdownTimer';
import { connect, onMessage, disconnect, MESSAGE_TYPES } from '../services/websocket';
import { calculateComprehensiveRisk, getDeviationDetails } from '../utils/riskCalculation';
import { REFERENCE_VALUES } from '../config/referenceValues';
import './RiskAssessment.css';

function RiskAssessment() {
    const location = useLocation();
    const navigate = useNavigate();

    // Session state machine with defined steps
    const STEPS = {
        CONNECT: 'connect',
        STATIC_CALIBRATION: 'static_calibration',
        FLEXION_CALIBRATION: 'flexion_calibration',
        TASK_JUMP_LANDING: 'task_jump_landing',
        COMPLETE: 'complete'
    };

    const [currentStep, setCurrentStep] = useState(STEPS.CONNECT);
    const [assessmentData, setAssessmentData] = useState(null);
    const [status, setStatus] = useState('ready');

    // Static Calibration state
    const [staticCalibrationStartTime, setStaticCalibrationStartTime] = useState(null);
    const [staticCalibrationProgress, setStaticCalibrationProgress] = useState(0);
    const STATIC_CALIBRATION_DURATION = 10; // seconds

    // Flexion Calibration state
    const [flexionCalibrationStartTime, setFlexionCalibrationStartTime] = useState(null);
    const [flexionCalibrationProgress, setFlexionCalibrationProgress] = useState(0);
    const FLEXION_CALIBRATION_DURATION = 10; // seconds

    // Jump landing task state
    const [taskStatus, setTaskStatus] = useState('idle'); // 'idle', 'running', 'processing', 'results'
    const [jumpAnimationPhase, setJumpAnimationPhase] = useState('stance'); // 'stance', 'jump', 'land'
    const [taskResultData, setTaskResultData] = useState(null);

    // Handle static calibration (stand still for 10 seconds)
    useEffect(() => {
        if (currentStep !== STEPS.STATIC_CALIBRATION) {
            setStaticCalibrationStartTime(null);
            setStaticCalibrationProgress(0);
            return;
        }

        // Send start_calibration command when entering static calibration step
        if (!staticCalibrationStartTime) {
            const { sendCommand } = require('../services/websocket');
            sendCommand('start_calibration');
            setStaticCalibrationStartTime(Date.now());
        }
    }, [currentStep, staticCalibrationStartTime, STEPS.STATIC_CALIBRATION]);

    // Handle flexion calibration (squat for 10 seconds)
    useEffect(() => {
        if (currentStep !== STEPS.FLEXION_CALIBRATION) {
            setFlexionCalibrationStartTime(null);
            setFlexionCalibrationProgress(0);
            return;
        }

        // Send start_flexion_calibration command when entering flexion calibration step
        if (!flexionCalibrationStartTime) {
            const { sendCommand } = require('../services/websocket');
            sendCommand('start_flexion_calibration');
            setFlexionCalibrationStartTime(Date.now());
        }
    }, [currentStep, flexionCalibrationStartTime, STEPS.FLEXION_CALIBRATION]);

    // Initialize WebSocket connection
    useEffect(() => {
        const ws = connect();

        // Subscribe to WebSocket messages
        const unsubscribe = onMessage((data) => {
            setAssessmentData(data);

            // Handle different message types
            switch (data.type) {
                case MESSAGE_TYPES.CALIBRATION_STATUS:
                    // Update static calibration progress
                    if (data.payload && currentStep === STEPS.STATIC_CALIBRATION) {
                        const elapsed = data.payload.elapsed || 0;
                        setStaticCalibrationProgress((elapsed / STATIC_CALIBRATION_DURATION) * 100);
                    }
                    // Auto-advance to flexion calibration when complete
                    if (data.payload?.status === 'complete') {
                        setCurrentStep(STEPS.FLEXION_CALIBRATION);
                    }
                    break;

                case MESSAGE_TYPES.FLEXION_CALIBRATION_STATUS:
                    // Update flexion calibration progress
                    if (data.payload && currentStep === STEPS.FLEXION_CALIBRATION) {
                        const elapsed = data.payload.elapsed || 0;
                        setFlexionCalibrationProgress((elapsed / FLEXION_CALIBRATION_DURATION) * 100);
                    }
                    break;

                case MESSAGE_TYPES.CALIBRATION_DONE:
                    // All calibration complete, move to jump landing task
                    if (currentStep === STEPS.FLEXION_CALIBRATION) {
                        setCurrentStep(STEPS.TASK_JUMP_LANDING);
                    }
                    break;

                case MESSAGE_TYPES.PROGRESS:
                    // Generic progress updates during data collection
                    if (data.payload) {
                        const { elapsed, duration } = data.payload;
                        if (currentStep === STEPS.STATIC_CALIBRATION) {
                            setStaticCalibrationProgress((elapsed / duration) * 100);
                        } else if (currentStep === STEPS.FLEXION_CALIBRATION) {
                            setFlexionCalibrationProgress((elapsed / duration) * 100);
                        }
                    }
                    break;

                case MESSAGE_TYPES.TASK_PROGRESS:
                    // Progress during jump landing task
                    if (data.payload && taskStatus === 'running') {
                        console.log(`Task progress: ${data.payload.elapsed.toFixed(1)}/${data.payload.duration}s`);
                    }
                    break;

                case MESSAGE_TYPES.TASK_RESULT:
                    // Store result data and update task status to show results
                    if (data.payload) {
                        // Calculate risk assessment based on received data
                        let processedData = data.payload;

                        // If the payload contains statistics in the expected format, calculate risk
                        if (data.payload.left_flexion && data.payload.right_flexion) {
                            try {
                                const riskAssessment = calculateComprehensiveRisk(data.payload);
                                const deviations = getDeviationDetails(data.payload);

                                processedData = {
                                    ...data.payload,
                                    riskAssessment,
                                    deviations,
                                    // Map to the old format for backward compatibility
                                    leftKneeFlexion: data.payload.left_flexion.mean,
                                    leftKneeValgus: data.payload.left_abduction.mean,
                                    leftKneeRisk: riskAssessment.leftLeg.overallRisk,
                                    rightKneeFlexion: data.payload.right_flexion.mean,
                                    rightKneeValgus: data.payload.right_abduction.mean,
                                    rightKneeRisk: riskAssessment.rightLeg.overallRisk,
                                    overallRisk: riskAssessment.overallRisk,
                                    riskLevel: riskAssessment.riskLevel
                                };

                                console.log('Risk Assessment Calculated:', riskAssessment);
                                console.log('Deviations from Reference:', deviations);
                            } catch (error) {
                                console.error('Error calculating risk:', error);
                            }
                        }

                        setTaskResultData(processedData);
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
                setCurrentStep(STEPS.STATIC_CALIBRATION);
                break;
            case STEPS.STATIC_CALIBRATION:
                setCurrentStep(STEPS.FLEXION_CALIBRATION);
                break;
            case STEPS.FLEXION_CALIBRATION:
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

            case STEPS.STATIC_CALIBRATION:
                return (
                    <div className="step-content static-calibration">
                        <h2>Static Calibration</h2>
                        <p className="instruction-text">Stand still in an upright position</p>
                        <p className="help-text">Keep your body as still as possible for 10 seconds</p>

                        <div className="calibration-timer">
                            <div className="countdown-display">
                                <span className="countdown-label">Calibrating sensors...</span>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${staticCalibrationProgress}%`,
                                        transition: 'width 0.3s ease'
                                    }}
                                ></div>
                            </div>
                            <p className="progress-text">{Math.round(staticCalibrationProgress)}%</p>
                        </div>

                        <StatusIndicator status="processing" message="Collecting static posture data..." />

                        <div className="human-model-container">
                            <HumanModel highlightedJoint="spine" />
                        </div>
                    </div>
                );

            case STEPS.FLEXION_CALIBRATION:
                return (
                    <div className="step-content flexion-calibration">
                        <h2>Flexion Calibration</h2>
                        <p className="instruction-text">Perform slow squats</p>
                        <p className="help-text">Squat up and down slowly for 10 seconds</p>

                        <div className="calibration-timer">
                            <div className="countdown-display">
                                <span className="countdown-label">Recording flexion movement...</span>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${flexionCalibrationProgress}%`,
                                        transition: 'width 0.3s ease'
                                    }}
                                ></div>
                            </div>
                            <p className="progress-text">{Math.round(flexionCalibrationProgress)}%</p>
                        </div>

                        <StatusIndicator status="processing" message="Collecting flexion data..." />

                        <div className="human-model-container">
                            <HumanModel highlightedJoint="knee" />
                        </div>
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

                                {/* Overall Risk Level Display */}
                                {taskResultData.riskLevel && (
                                    <div className="overall-risk-display" style={{
                                        backgroundColor: taskResultData.riskLevel.color + '20',
                                        borderLeft: `4px solid ${taskResultData.riskLevel.color}`,
                                        padding: '1rem',
                                        marginBottom: '1.5rem',
                                        borderRadius: '4px'
                                    }}>
                                        <div className="risk-header">
                                            <span className="risk-label">Overall Risk Level:</span>
                                            <span className="risk-badge" style={{
                                                backgroundColor: taskResultData.riskLevel.color,
                                                color: 'white',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontWeight: 'bold',
                                                marginLeft: '1rem'
                                            }}>
                                                {taskResultData.riskLevel.label} ({taskResultData.overallRisk}%)
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="results-grid">
                                    {/* Left Knee Metrics */}
                                    <div className="knee-results left-knee-results">
                                        <h4>Left Knee</h4>

                                        <div className="metric">
                                            <span className="metric-label">Mean Flexion</span>
                                            <span className="metric-value">
                                                {taskResultData.leftKneeFlexion !== undefined
                                                    ? `${taskResultData.leftKneeFlexion.toFixed(1)}°`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="metric">
                                            <span className="metric-label">Mean Abduction</span>
                                            <span className="metric-value">
                                                {taskResultData.leftKneeValgus !== undefined
                                                    ? `${taskResultData.leftKneeValgus.toFixed(1)}°`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="metric risk-metric">
                                            <span className="metric-label">Risk Level</span>
                                            <span className="metric-value risk-value" style={{
                                                color: taskResultData.riskAssessment?.leftLeg?.overallRisk > 50 ? '#f44336' : '#4caf50'
                                            }}>
                                                {taskResultData.leftKneeRisk !== undefined
                                                    ? `${taskResultData.leftKneeRisk}%`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Knee Metrics */}
                                    <div className="knee-results right-knee-results">
                                        <h4>Right Knee</h4>

                                        <div className="metric">
                                            <span className="metric-label">Mean Flexion</span>
                                            <span className="metric-value">
                                                {taskResultData.rightKneeFlexion !== undefined
                                                    ? `${taskResultData.rightKneeFlexion.toFixed(1)}°`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="metric">
                                            <span className="metric-label">Mean Abduction</span>
                                            <span className="metric-value">
                                                {taskResultData.rightKneeValgus !== undefined
                                                    ? `${taskResultData.rightKneeValgus.toFixed(1)}°`
                                                    : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="metric risk-metric">
                                            <span className="metric-label">Risk Level</span>
                                            <span className="metric-value risk-value" style={{
                                                color: taskResultData.riskAssessment?.rightLeg?.overallRisk > 50 ? '#f44336' : '#4caf50'
                                            }}>
                                                {taskResultData.rightKneeRisk !== undefined
                                                    ? `${taskResultData.rightKneeRisk}%`
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
                {currentStep !== STEPS.STATIC_CALIBRATION && currentStep !== STEPS.FLEXION_CALIBRATION && (
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
