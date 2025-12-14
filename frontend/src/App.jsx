import React, { useState, useEffect, useRef } from 'react';
import { Activity, Radio, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const ASSESSMENT_STEPS = [
  {
    id: 'calibration_static',
    title: 'Static Calibration',
    description: 'Stand still for sensor calibration',
    duration: 10,
    instruction: 'Stand upright with feet shoulder-width apart. Keep your body still.',
    taskType: 'calibration'
  },
  {
    id: 'calibration_flexion',
    title: 'Flexion Calibration',
    description: 'Calibrate knee flexion range',
    duration: 10,
    instruction: 'Slowly bend your knees into a squat position, then return to standing. Repeat 3-5 times.',
    taskType: 'bend'
  },
  {
    id: 'jump_landing',
    title: 'Jump Landing Assessment',
    description: 'Primary risk assessment task',
    duration: 10,
    instruction: 'Perform 3-5 jump landings. Jump straight up and land softly with bent knees. THIS IS THE MAIN ASSESSMENT TASK.',
    taskType: 'jump_landing'
  },
  {
    id: 'abduction',
    title: 'Leg Abduction Test',
    description: 'Test lateral leg movement',
    duration: 10,
    instruction: 'Lift one leg out to the side, hold briefly, then return. Alternate legs 3-4 times each.',
    taskType: 'abduction'
  },
  {
    id: 'jump',
    title: 'Vertical Jump Test',
    description: 'Additional jump assessment',
    duration: 10,
    instruction: 'Perform 3-5 vertical jumps. Jump straight up and land softly with bent knees.',
    taskType: 'jump'
  },
  {
    id: 'walk',
    title: 'Walking Test',
    description: 'Gait analysis',
    duration: 10,
    instruction: 'Walk in place naturally, lifting knees to a comfortable height.',
    taskType: 'walk'
  }
];

const SENSOR_POSITIONS = [
  { id: 'leftThigh', label: 'L Thigh', x: 35, y: 45, side: 'left', position: 'thigh' },
  { id: 'leftShank', label: 'L Shank', x: 35, y: 65, side: 'left', position: 'shank' },
  { id: 'rightThigh', label: 'R Thigh', x: 65, y: 45, side: 'right', position: 'thigh' },
  { id: 'rightShank', label: 'R Shank', x: 65, y: 65, side: 'right', position: 'shank' }
];

function ACLAssessmentSystem() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [sensorData, setSensorData] = useState({});
  const [jumpLandingData, setJumpLandingData] = useState(null);
  const [results, setResults] = useState(null);

  const wsRef = useRef(null);
  const timerRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws');

        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);

          if (message.type === 'posture_status') {
            setIsCalibrated(message.payload.upright);
          } else if (message.type === 'calibration_status') {
            console.log('Calibration status:', message.payload);
            // Status update for static calibration - no action needed
          } else if (message.type === 'flexion_calibration_status') {
            console.log('Flexion calibration status:', message.payload);
            // Status update for flexion calibration - no action needed
          } else if (message.type === 'calibration_done') {
            console.log('✅ Calibration complete from backend!');
            // Backend has finished collecting samples and completed calibration
            // DON'T auto-advance - let the timer handle it or user can press START for next step
          } else if (message.type === 'task_status' || message.type === 'task_progress') {
            console.log('Task progress:', message.payload);
            // Progress updates - no action needed
          } else if (message.type === 'task_result') {
            // Check if this is jump landing data
            if (message.payload.task === 'jump_landing') {
              console.log('Jump landing data received:', message.payload);
              setJumpLandingData(message.payload);
            }
            console.log('Task result received:', message.payload);
            // Don't auto-advance here either - let timer or user control flow
          } else if (message.type === 'error') {
            console.error('Backend error:', message.payload);
          } else {
            console.log('Unknown message type:', message.type, message);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsStatus('error');
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsStatus('disconnected');
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect:', error);
        setWsStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Simulated sensor data animation with specific behavior for bend test
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newData = {};
      const currentTime = Date.now() / 1000;
      const isBendTest = ASSESSMENT_STEPS[currentStep]?.taskType === 'bend';

      SENSOR_POSITIONS.forEach(sensor => {
        // For bend test, simulate knee bending
        if (isBendTest) {
          const bendAngle = Math.abs(Math.sin(currentTime * 2) * 90); // 0-90 degrees
          newData[sensor.id] = {
            active: true,
            signal: bendAngle / 90, // Normalize to 0-1
            bendAngle: bendAngle
          };
        } else {
          // For other tests, just show active sensors
          newData[sensor.id] = {
            active: true,
            signal: 0.5
          };
        }
      });
      setSensorData(newData);
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, currentStep]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const sendWebSocketMessage = (type, payload = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const startAssessment = () => {
    setCurrentStep(0);
    setIsCalibrated(false);
    setShowContinue(false);
    setShowCompleted(false);
    setShowResults(false);
    setResults(null);
    setJumpLandingData(null);
    setTimeLeft(ASSESSMENT_STEPS[0].duration);
    setIsRunning(false); // Don't auto-start - wait for user to press START button

    // Don't send message yet - wait for user to press START
  };

  const handleTimeExpired = () => {
    const step = ASSESSMENT_STEPS[currentStep];

    // Timer expired - stop the countdown
    setIsRunning(false);

    // Move to next step but DON'T start it - wait for user to press START button
    console.log(`Timer expired for ${step.taskType}. Ready for next step.`);

    if (currentStep < ASSESSMENT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeLeft(ASSESSMENT_STEPS[currentStep + 1].duration);
    } else {
      // Last step completed - show completion message with button
      setShowCompleted(true);
    }
  };

  const handleStepComplete = () => {
    setIsRunning(false);

    // If this is the last step, show results
    if (currentStep >= ASSESSMENT_STEPS.length - 1) {
      setShowResults(true);
      setShowContinue(false);
    } else {
      // Move to next step but DON'T auto-start - wait for user to press START
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeLeft(ASSESSMENT_STEPS[nextStep].duration);
      // Keep isRunning as false so START button appears
    }
  };

  const computeRiskAssessment = () => {
    // If we have jump landing data from backend, use it
    if (jumpLandingData) {
      console.log('Computing risk from jump landing data:', jumpLandingData);
      // Backend should provide the risk scores directly
      setResults(jumpLandingData);
      setShowResults(true);
    } else {
      // Fallback: Use mock data for demonstration
      // In production, this should fetch/compute from stored jump landing IMU data
      console.warn('No jump landing data available, using mock data');
      const mockRiskData = {
        leftKneeRisk: Math.random() * 30 + 10, // 10-40%
        rightKneeRisk: Math.random() * 30 + 10,
        task: 'jump_landing',
        message: 'Risk assessment based on jump landing biomechanics'
      };
      setResults(mockRiskData);
      setShowResults(true);
    }
  };

  const continueAssessment = () => {
    setShowContinue(false);
    if (currentStep < ASSESSMENT_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeLeft(ASSESSMENT_STEPS[nextStep].duration);
      setIsRunning(true);

      // Start the next task if not the last step
      if (nextStep < ASSESSMENT_STEPS.length - 1) {
        const nextTask = ASSESSMENT_STEPS[nextStep].taskType;
        sendWebSocketMessage('start_task', { task: nextTask });
      }
    }
  };

  const stopAssessment = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const currentStepData = ASSESSMENT_STEPS[currentStep];
  const progress = ((currentStep + 1) / ASSESSMENT_STEPS.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#1a202c' }}>
                ACL Injury Risk Assessment
              </h1>
              <p style={{ margin: 0, color: '#718096' }}>
                Real-time biomechanical analysis system
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: wsStatus === 'connected' ? '#d4edda' : '#f8d7da',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: wsStatus === 'connected' ? '#28a745' : '#dc3545'
                }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {wsStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {isRunning && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#fff3cd',
                  borderRadius: '8px'
                }}>
                  <Activity size={16} color="#856404" />
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#856404' }}>
                    Recording
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                Step {currentStep + 1} of {ASSESSMENT_STEPS.length}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Human Model */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'block', background: 'transparent', margin: '0', padding: '0' }}>
              {/* Anatomical Model Image - changes based on current step */}
              <img
                src={
                  currentStepData.id === 'calibration_flexion' ? '/src/assets/squatting.jpg' :
                    currentStepData.id === 'jump_landing' ? '/src/assets/jump-landing.jpg' :
                      currentStepData.id === 'abduction' ? '/src/assets/abduction.jpg' :
                        currentStepData.id === 'jump' ? '/src/assets/vertical-jump.jpg' :
                          currentStepData.id === 'walk' ? '/src/assets/walking.png' :
                            '/src/assets/human-model.png'
                }
                alt={`Anatomical model demonstrating ${currentStepData.title}`}
                style={{
                  width: '100%',
                  height: '650px',
                  objectFit: 'cover',
                  display: 'block',
                  margin: '0',
                  padding: '0'
                }}
              />
            </div>

            {/* Sensor Legend */}
            <div style={{ margin: '0', padding: '1rem 1.5rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {SENSOR_POSITIONS.map(sensor => (
                <div
                  key={sensor.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: sensorData[sensor.id]?.active ? '#f7fafc' : 'transparent',
                    borderRadius: '6px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Radio
                    size={16}
                    color={sensorData[sensor.id]?.active ? (sensor.side === 'left' ? '#667eea' : '#764ba2') : '#cbd5e0'}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                    {sensor.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Current Step */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {currentStep + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: '#1a202c' }}>
                    {currentStepData.title}
                  </h3>
                  <p style={{ margin: 0, color: '#718096', fontSize: '0.875rem' }}>
                    {currentStepData.description}
                  </p>
                </div>
              </div>

              <div style={{
                background: '#f7fafc',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  margin: 0,
                  color: '#2d3748',
                  fontSize: '0.9375rem',
                  lineHeight: '1.6'
                }}>
                  {currentStepData.instruction}
                </p>
              </div>

              {/* Timer */}
              {isRunning && timeLeft > 0 && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                  }}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
                  <p style={{ margin: 0, color: '#718096', fontSize: '0.875rem' }}>
                    Time Remaining
                  </p>
                </div>
              )}

              {/* Status indicators */}
              {currentStepData.id === 'calibration' && isRunning && (
                <div style={{ marginBottom: '1.5rem' }}>
                  {!isCalibrated && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: '#fff3cd',
                      borderRadius: '8px',
                      marginBottom: '0.5rem'
                    }}>
                      <AlertCircle size={20} color="#856404" />
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#856404',
                        fontWeight: '500'
                      }}>
                        Adjust your posture
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Auto-advancing to next step... */}

              {/* Controls */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                {!isRunning && !showResults && (
                  <button
                    onClick={() => {
                      const step = ASSESSMENT_STEPS[currentStep];
                      setTimeLeft(step.duration);
                      setIsRunning(true);

                      // Send appropriate message to backend based on step type
                      if (step.taskType === 'calibration') {
                        sendWebSocketMessage('start_calibration');
                      } else if (step.taskType === 'bend') {
                        sendWebSocketMessage('start_flexion_calibration');
                      } else {
                        sendWebSocketMessage('start_task', { task: step.taskType });
                      }
                    }}
                    disabled={wsStatus !== 'connected'}
                    style={{
                      flex: 1,
                      padding: '1rem 2rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'white',
                      background: wsStatus === 'connected'
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : '#cbd5e0',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: wsStatus === 'connected' ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    START {ASSESSMENT_STEPS[currentStep].title}
                  </button>
                )}


                {/* Restart Button (only shown after all steps are complete) */}
                {showResults && (
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginTop: '2rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{ marginTop: 0, color: '#1a202c' }}>Assessment Complete</h3>
                    <div style={{ margin: '1.5rem 0' }}>
                      {/* Display assessment results here */}
                      {results ? (
                        <pre style={{
                          background: '#f8f9fa',
                          padding: '1rem',
                          borderRadius: '8px',
                          overflowX: 'auto',
                          fontSize: '0.875rem',
                          color: '#4a5568'
                        }}>
                          {JSON.stringify(results, null, 2)}
                        </pre>
                      ) : (
                        <p>No results available. Please try again.</p>
                      )}
                    </div>
                    <button
                      onClick={startAssessment}
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: 'white',
                        background: '#667eea',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: '0 auto'
                      }}
                    >
                      Restart Assessment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Completion Panel - Show button to compute risk */}
            {showCompleted && !showResults && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1a202c' }}>
                  Assessment Complete
                </h3>
                <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                  All movement tasks have been recorded. Click below to analyze the jump landing data and generate your risk assessment.
                </p>
                <button
                  onClick={computeRiskAssessment}
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'white',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  See Risk Assessment Results
                </button>
              </div>
            )}

            {/* Results Panel - Only show after risk computation */}
            {showResults && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#1a202c' }}>
                  ACL Injury Risk Assessment Results
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Left Knee Risk Score
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                      {results?.leftKneeRisk?.toFixed(1) || '0.0'}%
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Right Knee Risk Score
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#764ba2' }}>
                      {results?.rightKneeRisk?.toFixed(1) || '0.0'}%
                    </div>
                  </div>
                </div>

                <button
                  onClick={startAssessment}
                  style={{
                    width: '100%',
                    marginTop: '1.5rem',
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'white',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Restart Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ACLAssessmentSystem;