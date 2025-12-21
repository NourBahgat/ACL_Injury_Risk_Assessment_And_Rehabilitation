import React, { useState, useEffect, useRef } from 'react';
import { Activity, Radio, AlertCircle, User, TrendingDown, TrendingUp, Minus, ChevronRight, Home, BarChart2, Calendar, Award } from 'lucide-react';

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
    id: 'single_limb_jump',
    title: 'Single Limb Jumping',
    description: 'Single leg jump assessment',
    duration: 10,
    instruction: 'Stand on one leg. Perform 5-7 small jumps in place, landing softly with a slight bend in your knee. Maintain balance between jumps.',
    taskType: 'single_limb_jump'
  },
  {
    id: 'double_limb_jump',
    title: 'Double Limb Jumping',
    description: 'Two-legged jump assessment',
    duration: 10,
    instruction: 'Stand with feet shoulder-width apart. Perform 5-7 two-legged jumps forward and backward over a line, landing softly with bent knees.',
    taskType: 'double_limb_jump'
  },
];

const SENSOR_POSITIONS = [
  { id: 'leftThigh', label: 'L Thigh', x: 35, y: 45, side: 'left', position: 'thigh' },
  { id: 'leftShank', label: 'L Shank', x: 35, y: 65, side: 'left', position: 'shank' },
  { id: 'rightThigh', label: 'R Thigh', x: 65, y: 45, side: 'right', position: 'thigh' },
  { id: 'rightShank', label: 'R Shank', x: 65, y: 65, side: 'right', position: 'shank' }
];

// Animated SVG Human Model Component - Enhanced Realistic Version
function AnimatedHumanSVG({ currentStep, isRunning, selectedLeg }) {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [jumpPhase, setJumpPhase] = useState('ground');
  
  // Add default values for leg lifting
  const [position, setPosition] = useState({
    y: 0,
    kneeAngle: 0,
    leftLegVisible: true,
    rightLegVisible: true,
    leftLegLifted: false,
    rightLegLifted: false,
    bodyTilt: 0,
    armSwing: 0,
    legLift: 0
  });

  useEffect(() => {
    if (!isRunning) {
      setAnimationFrame(0);
      setJumpPhase('ground');
      return;
    }

    const taskType = ASSESSMENT_STEPS[currentStep].taskType;

    let interval;
    if (taskType === 'calibration') {
      interval = setInterval(() => {
        setAnimationFrame(prev => (prev + 1) % 60);
      }, 100);
    } else if (taskType === 'single_limb_jump') {
      interval = setInterval(() => {
        setAnimationFrame(prev => {
          const next = (prev + 1) % 40;
          if (next < 9) setJumpPhase('ground');
          else if (next < 13) setJumpPhase('takeoff');
          else if (next < 21) setJumpPhase('air');
          else if (next < 29) setJumpPhase('landing');
          else setJumpPhase('ground');
          return next;
        });
      }, 80);
    } else if (taskType === 'double_limb_jump') {
      interval = setInterval(() => {
        setAnimationFrame(prev => {
          const next = (prev + 1) % 30;
          if (next < 6) setJumpPhase('ground');
          else if (next < 10) setJumpPhase('takeoff');
          else if (next < 18) setJumpPhase('air');
          else if (next < 25) setJumpPhase('landing');
          else setJumpPhase('ground');
          return next;
        });
      }, 70);
    }

    return () => clearInterval(interval);
  }, [isRunning, currentStep]);

  const getBodyPosition = () => {
    const taskType = ASSESSMENT_STEPS[currentStep].taskType;

    if (!isRunning) {
      return { y: 0, kneeAngle: 0, leftLegVisible: true, rightLegVisible: true, leftLegLifted: false, rightLegLifted: false, bodyTilt: 0, armSwing: 0, legLift: 0 };
    }

    if (taskType === 'calibration') {
      const breathe = Math.sin(animationFrame * 0.1) * 2;
      return { y: breathe, kneeAngle: 0, leftLegVisible: true, rightLegVisible: true, leftLegLifted: false, rightLegLifted: false, bodyTilt: 0, armSwing: 0, legLift: 0 };
    } else if (taskType === 'single_limb_jump') {
      let y = 0;
      let kneeAngle = 0;
      let bodyTilt = 2;
      let armSwing = 0;

      if (jumpPhase === 'ground') {
        y = 0;
        kneeAngle = 5;
        armSwing = 0;
      } else if (jumpPhase === 'takeoff') {
        y = -10;
        kneeAngle = 10;
        armSwing = -10;
      } else if (jumpPhase === 'air') {
        y = -30;
        kneeAngle = 15;
        armSwing = -20;
      } else if (jumpPhase === 'landing') {
        y = -15;
        kneeAngle = 20;
        armSwing = -10;
      }

      // For single leg jumps, show both legs but with different positions
      // The selected leg will be the standing leg, the other will be lifted
      const isLeftSelected = selectedLeg === 'left';
      
      return {
        y,
        kneeAngle,
        leftLegVisible: true,  // Always show left leg
        rightLegVisible: true, // Always show right leg
        leftLegLifted: !isLeftSelected, // Lift non-selected leg
        rightLegLifted: isLeftSelected, // Lift non-selected leg
        bodyTilt: isLeftSelected ? 2 : -2, // Slight tilt towards standing leg
        legLift: 60,
        armSwing
      };
    } else if (taskType === 'double_limb_jump') {
      let y = 0;
      let kneeAngle = 0;
      let armSwing = 0;

      if (jumpPhase === 'ground') {
        y = 0;
        kneeAngle = 5;
        armSwing = 0;
      } else if (jumpPhase === 'takeoff') {
        y = -15;
        kneeAngle = 15;
        armSwing = -15;
      } else if (jumpPhase === 'air') {
        y = -40;
        kneeAngle = 20;
        armSwing = -30;
      } else if (jumpPhase === 'landing') {
        y = -20;
        kneeAngle = 30;
        armSwing = -15;
      }

      return { y, kneeAngle, leftLegVisible: true, rightLegVisible: true, leftLegLifted: false, rightLegLifted: false, bodyTilt: 0, armSwing, legLift: 0 };
    }

    return { y: 0, kneeAngle: 0, leftLegVisible: true, rightLegVisible: true, leftLegLifted: false, rightLegLifted: false, bodyTilt: 0, armSwing: 0, legLift: 0 };
  };

  // Update position state when it changes
  useEffect(() => {
    setPosition(getBodyPosition());
  }, [isRunning, currentStep, selectedLeg, jumpPhase, animationFrame]);
  const taskType = ASSESSMENT_STEPS[currentStep]?.taskType || 'calibration';

  return (
    <div style={{
      width: '100%',
      height: '650px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #dbeafe 0%, #e0f2fe 30%, #f0f9ff 70%, #f8fafc 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ground shadow */}
      <div style={{
        position: 'absolute',
        bottom: '78px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120px',
        height: '8px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1,
        opacity: 0.4
      }} />

      {/* Ground line */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '0',
        right: '0',
        height: '3px',
        background: 'linear-gradient(to right, transparent 0%, #94a3b8 20%, #94a3b8 80%, transparent 100%)',
        zIndex: 1
      }} />

      {/* Jump line indicator */}
      {taskType === 'double_limb_jump' && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '4px',
          height: '80px',
          background: 'linear-gradient(to bottom, #667eea, transparent)',
          zIndex: 1,
          opacity: 0.5,
          boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
        }} />
      )}

      <svg
        width="400"
        height="600"
        viewBox="0 0 400 600"
        style={{
          position: 'relative',
          zIndex: 2,
          transform: `translateY(${position.y}px) rotate(${position.bodyTilt}deg)`,
          transition: 'transform 0.1s ease-out',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))'
        }}
      >
        <defs>
          {/* Gradients for realistic shading */}
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="torsoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#5a67d8" />
          </linearGradient>
          <linearGradient id="legGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
          <radialGradient id="headGradient">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </radialGradient>
        </defs>

        {/* Head with better shading */}
        <circle
          cx="200"
          cy="80"
          r="32"
          fill="url(#headGradient)"
          stroke="#f59e0b"
          strokeWidth="2"
        />

        {/* Hair */}
        <path
          d="M 168 70 Q 170 55 185 50 Q 200 48 215 50 Q 230 55 232 70"
          fill="#78350f"
          stroke="#78350f"
          strokeWidth="2"
        />

        {/* Ears */}
        <ellipse cx="168" cy="80" rx="6" ry="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
        <ellipse cx="232" cy="80" rx="6" ry="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />

        {/* Eyes with more detail */}
        <ellipse cx="188" cy="75" rx="5" ry="6" fill="white" />
        <circle cx="189" cy="75" r="3" fill="#1f2937" />
        <circle cx="190" cy="74" r="1.5" fill="white" />

        <ellipse cx="212" cy="75" rx="5" ry="6" fill="white" />
        <circle cx="211" cy="75" r="3" fill="#1f2937" />
        <circle cx="212" cy="74" r="1.5" fill="white" />

        {/* Eyebrows */}
        <path d="M 182 68 Q 188 66 194 68" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 206 68 Q 212 66 218 68" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <path d="M 200 85 L 198 90 L 202 90 Z" fill="#f59e0b" />

        {/* Mouth - smile */}
        <path d="M 190 95 Q 200 100 210 95" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Neck with better anatomy */}
        <path
          d="M 188 108 Q 188 120 185 135 L 215 135 Q 212 120 212 108"
          fill="url(#skinGradient)"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />

        {/* Shoulders/Clavicle area */}
        <ellipse
          cx="200"
          cy="145"
          rx="55"
          ry="20"
          fill="url(#torsoGradient)"
          stroke="#5a67d8"
          strokeWidth="2"
        />

        {/* Torso with athletic shape */}
        <path
          d="M 155 150 Q 145 180 148 220 Q 150 250 165 260 L 235 260 Q 250 250 252 220 Q 255 180 245 150 Z"
          fill="url(#torsoGradient)"
          stroke="#5a67d8"
          strokeWidth="2"
        />

        {/* Torso definition lines */}
        <line x1="200" y1="160" x2="200" y2="240" stroke="#5a67d8" strokeWidth="1.5" opacity="0.3" />
        <ellipse cx="200" cy="190" rx="35" ry="18" fill="none" stroke="#5a67d8" strokeWidth="1" opacity="0.2" />

        {/* Left Arm with realistic joints */}
        <g>
          {/* Shoulder */}
          <circle cx="155" cy="150" r="12" fill="url(#skinGradient)" stroke="#f59e0b" strokeWidth="1.5" />

          {/* Upper arm */}
          <line
            x1="155"
            y1="150"
            x2={140 + position.armSwing * 0.3}
            y2={205 - position.armSwing * 0.2}
            stroke="url(#skinGradient)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Elbow */}
          <circle
            cx={140 + position.armSwing * 0.3}
            cy={205 - position.armSwing * 0.2}
            r="8"
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="1"
          />

          {/* Forearm */}
          <line
            x1={140 + position.armSwing * 0.3}
            y1={205 - position.armSwing * 0.2}
            x2={125 + position.armSwing * 0.5}
            y2={265 - position.armSwing * 0.3}
            stroke="url(#skinGradient)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Hand */}
          <ellipse
            cx={125 + position.armSwing * 0.5}
            cy={270 - position.armSwing * 0.3}
            rx="10"
            ry="14"
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
        </g>

        {/* Right Arm with realistic joints */}
        <g>
          {/* Shoulder */}
          <circle cx="245" cy="150" r="12" fill="url(#skinGradient)" stroke="#f59e0b" strokeWidth="1.5" />

          {/* Upper arm */}
          <line
            x1="245"
            y1="150"
            x2={260 - position.armSwing * 0.3}
            y2={205 - position.armSwing * 0.2}
            stroke="url(#skinGradient)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Elbow */}
          <circle
            cx={260 - position.armSwing * 0.3}
            cy={205 - position.armSwing * 0.2}
            r="8"
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="1"
          />

          {/* Forearm */}
          <line
            x1={260 - position.armSwing * 0.3}
            y1={205 - position.armSwing * 0.2}
            x2={275 - position.armSwing * 0.5}
            y2={265 - position.armSwing * 0.3}
            stroke="url(#skinGradient)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Hand */}
          <ellipse
            cx={275 - position.armSwing * 0.5}
            cy={270 - position.armSwing * 0.3}
            rx="10"
            ry="14"
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
        </g>

        {/* Hip area */}
        <ellipse
          cx="200"
          cy="265"
          rx="50"
          ry="22"
          fill="url(#torsoGradient)"
          stroke="#5a67d8"
          strokeWidth="2"
        />

        {/* Left Leg with realistic anatomy */}
        {position.leftLegVisible && (
          position.leftLegLifted ? (
            <g>
              {/* Hip joint */}
              <circle cx="178" cy="265" r="10" fill="url(#legGradient)" stroke="#6b21a8" strokeWidth="1.5" />

              {/* Thigh lifted */}
              <line
                x1="178"
                y1="265"
                x2={178 - Math.cos(position.legLift * Math.PI / 180) * 65}
                y2={265 - Math.sin(position.legLift * Math.PI / 180) * 65}
                stroke="url(#legGradient)"
                strokeWidth="22"
                strokeLinecap="round"
              />

              {/* Knee and Shank bent */}
              <line
                x1={178 - Math.cos(position.legLift * Math.PI / 180) * 65}
                y1={265 - Math.sin(position.legLift * Math.PI / 180) * 65}
                x2={178 - Math.cos(position.legLift * Math.PI / 180) * 65}
                y2={340 - Math.sin(position.legLift * Math.PI / 180) * 65}
                stroke="#fbbf24"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {/* Foot */}
              <ellipse
                cx={178 - Math.cos(position.legLift * Math.PI / 180) * 65}
                cy={350 - Math.sin(position.legLift * Math.PI / 180) * 65}
                rx="28"
                ry="14"
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="2"
                transform={`rotate(15 ${178 - Math.cos(position.legLift * Math.PI / 180) * 65} ${350 - Math.sin(position.legLift * Math.PI / 180) * 65})`}
              />
            </g>
          ) : (
            <g>
              {/* Hip joint */}
              <circle cx="178" cy="265" r="10" fill="url(#legGradient)" stroke="#6b21a8" strokeWidth="1.5" />

              {/* Thigh with muscle definition */}
              <path
                d={`M 178 265 Q ${170 - Math.sin(position.kneeAngle * Math.PI / 180) * 25} ${295 + Math.cos(position.kneeAngle * Math.PI / 180) * 15} ${178 - Math.sin(position.kneeAngle * Math.PI / 180) * 30} ${335 + Math.cos(position.kneeAngle * Math.PI / 180) * 30}`}
                stroke="url(#legGradient)"
                strokeWidth="22"
                strokeLinecap="round"
                fill="none"
              />

              {/* Sensor on thigh */}
              <rect
                x={173 - Math.sin(position.kneeAngle * Math.PI / 180) * 15}
                y={295 + Math.cos(position.kneeAngle * Math.PI / 180) * 15}
                width="18"
                height="12"
                fill="#667eea"
                stroke="#5a67d8"
                strokeWidth="1.5"
                rx="3"
              />
              <circle
                cx={177 - Math.sin(position.kneeAngle * Math.PI / 180) * 15}
                cy={301 + Math.cos(position.kneeAngle * Math.PI / 180) * 15}
                r="2"
                fill="#3b82f6"
              />

              {/* Knee joint */}
              <circle
                cx={178 - Math.sin(position.kneeAngle * Math.PI / 180) * 30}
                cy={335 + Math.cos(position.kneeAngle * Math.PI / 180) * 30}
                r="10"
                fill="#f59e0b"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />

              {/* Shank/Calf with definition */}
              <path
                d={`M ${178 - Math.sin(position.kneeAngle * Math.PI / 180) * 30} ${335 + Math.cos(position.kneeAngle * Math.PI / 180) * 30} Q ${176 - Math.sin(position.kneeAngle * Math.PI / 180) * 32} ${375 + Math.cos(position.kneeAngle * Math.PI / 180) * 20} ${178 - Math.sin(position.kneeAngle * Math.PI / 180) * 35} ${425 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}`}
                stroke="#fbbf24"
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
              />

              {/* Sensor on shank */}
              <rect
                x={173 - Math.sin(position.kneeAngle * Math.PI / 180) * 32}
                y={378 + Math.cos(position.kneeAngle * Math.PI / 180) * 20}
                width="18"
                height="12"
                fill="#667eea"
                stroke="#5a67d8"
                strokeWidth="1.5"
                rx="3"
              />
              <circle
                cx={177 - Math.sin(position.kneeAngle * Math.PI / 180) * 32}
                cy={384 + Math.cos(position.kneeAngle * Math.PI / 180) * 20}
                r="2"
                fill="#3b82f6"
              />

              {/* Ankle */}
              <circle
                cx={178 - Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                cy={425 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                r="8"
                fill="#f59e0b"
                stroke="#f59e0b"
                strokeWidth="1"
              />

              {/* Foot/Shoe with more detail */}
              <ellipse
                cx={178 - Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                cy={438 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                rx="28"
                ry="14"
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <ellipse
                cx={178 - Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                cy={438 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                rx="20"
                ry="10"
                fill="#334155"
                opacity="0.6"
              />
              <line
                x1={165 - Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                y1={438 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                x2={191 - Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                y2={438 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </g>
          )
        )}

        {/* Right Leg with realistic anatomy */}
        {position.rightLegVisible && (
          position.rightLegLifted ? (
            <g>
              {/* Hip joint */}
              <circle cx="222" cy="265" r="10" fill="url(#legGradient)" stroke="#6b21a8" strokeWidth="1.5" />

              {/* Thigh lifted */}
              <line
                x1="222"
                y1="265"
                x2={222 + Math.cos(position.legLift * Math.PI / 180) * 65}
                y2={265 - Math.sin(position.legLift * Math.PI / 180) * 65}
                stroke="url(#legGradient)"
                strokeWidth="22"
                strokeLinecap="round"
              />

              {/* Knee and Shank bent */}
              <line
                x1={222 + Math.cos(position.legLift * Math.PI / 180) * 65}
                y1={265 - Math.sin(position.legLift * Math.PI / 180) * 65}
                x2={222 + Math.cos(position.legLift * Math.PI / 180) * 65}
                y2={340 - Math.sin(position.legLift * Math.PI / 180) * 65}
                stroke="#fbbf24"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {/* Foot */}
              <ellipse
                cx={222 + Math.cos(position.legLift * Math.PI / 180) * 65}
                cy={350 - Math.sin(position.legLift * Math.PI / 180) * 65}
                rx="28"
                ry="14"
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="2"
                transform={`rotate(-15 ${222 + Math.cos(position.legLift * Math.PI / 180) * 65} ${350 - Math.sin(position.legLift * Math.PI / 180) * 65})`}
              />
            </g>
          ) : (
            <g>
              {/* Hip joint */}
              <circle cx="222" cy="265" r="10" fill="url(#legGradient)" stroke="#6b21a8" strokeWidth="1.5" />

              {/* Thigh */}
              <path
                d={`M 222 265 Q ${230 + Math.sin(position.kneeAngle * Math.PI / 180) * 25} ${295 + Math.cos(position.kneeAngle * Math.PI / 180) * 15} ${222 + Math.sin(position.kneeAngle * Math.PI / 180) * 30} ${335 + Math.cos(position.kneeAngle * Math.PI / 180) * 30}`}
                stroke="url(#legGradient)"
                strokeWidth="22"
                strokeLinecap="round"
                fill="none"
              />

              {/* Sensor on thigh */}
              <rect
                x={215 + Math.sin(position.kneeAngle * Math.PI / 180) * 15}
                y={295 + Math.cos(position.kneeAngle * Math.PI / 180) * 15}
                width="18"
                height="12"
                fill="#764ba2"
                stroke="#6b21a8"
                strokeWidth="1.5"
                rx="3"
              />
              <circle
                cx={219 + Math.sin(position.kneeAngle * Math.PI / 180) * 15}
                cy={301 + Math.cos(position.kneeAngle * Math.PI / 180) * 15}
                r="2"
                fill="#a855f7"
              />

              {/* Knee joint */}
              <circle
                cx={222 + Math.sin(position.kneeAngle * Math.PI / 180) * 30}
                cy={335 + Math.cos(position.kneeAngle * Math.PI / 180) * 30}
                r="10"
                fill="#f59e0b"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />

              {/* Shank */}
              <path
                d={`M ${222 + Math.sin(position.kneeAngle * Math.PI / 180) * 30} ${335 + Math.cos(position.kneeAngle * Math.PI / 180) * 30} Q ${224 + Math.sin(position.kneeAngle * Math.PI / 180) * 32} ${375 + Math.cos(position.kneeAngle * Math.PI / 180) * 20} ${222 + Math.sin(position.kneeAngle * Math.PI / 180) * 35} ${425 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}`}
                stroke="#fbbf24"
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
              />

              {/* Sensor on shank */}
              <rect
                x={215 + Math.sin(position.kneeAngle * Math.PI / 180) * 32}
                y={378 + Math.cos(position.kneeAngle * Math.PI / 180) * 20}
                width="18"
                height="12"
                fill="#764ba2"
                stroke="#6b21a8"
                strokeWidth="1.5"
                rx="3"
              />
              <circle
                cx={219 + Math.sin(position.kneeAngle * Math.PI / 180) * 32}
                cy={384 + Math.cos(position.kneeAngle * Math.PI / 180) * 20}
                r="2"
                fill="#a855f7"
              />

              {/* Ankle */}
              <circle
                cx={222 + Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                cy={425 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                r="8"
                fill="#f59e0b"
                stroke="#f59e0b"
                strokeWidth="1"
              />

              {/* Foot */}
              <ellipse
                cx={222 + Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                cy={438 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                rx="28"
                ry="14"
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <ellipse
                cx={222 + Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                cy={438 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                rx="20"
                ry="10"
                fill="#334155"
                opacity="0.6"
              />
              <line
                x1={209 + Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                y1={438 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                x2={235 + Math.sin(position.kneeAngle * Math.PI / 180) * 35}
                y2={438 + Math.cos(position.kneeAngle * Math.PI / 180) * 10}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </g>
          )
        )}
      </svg>

      {/* Recording indicator */}
      {isRunning && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(102, 126, 234, 0.95)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'pulse 1s infinite'
          }} />
          Recording in progress
        </div>
      )}

      {/* Movement instruction overlay */}
      {isRunning && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1a202c',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10,
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          {ASSESSMENT_STEPS[currentStep].instruction}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}

// Login Component (keeping original)
function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId || !name) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          name: name
        })
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user, data.latest_assessments);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please ensure the backend is running on port 8000.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <User size={40} color="white" />
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#1a202c' }}>
            ACL Risk Assessment
          </h1>
          <p style={{ margin: 0, color: '#718096' }}>
            Sign in to track your progress
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your ID (e.g., athlete123)"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              background: '#fee',
              color: '#c33',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'white',
              background: loading ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Dashboard Component - keeping the same as before
function Dashboard({ user, assessmentHistory, onStartAssessment, onViewHistory, onLogout }) {
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendAnalysis();
  }, [user.user_id]);

  const fetchTrendAnalysis = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/user/${user.user_id}/trend`);
      const data = await response.json();
      setTrendAnalysis(data);
    } catch (err) {
      console.error('Error fetching trend analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLatestAssessment = () => {
    if (assessmentHistory.length === 0) return null;
    return assessmentHistory[0];
  };

  const getTrendIcon = () => {
    if (!trendAnalysis || trendAnalysis.trend === 'insufficient_data') return null;

    switch (trendAnalysis.trend) {
      case 'improving':
        return <TrendingDown size={24} color="#10b981" />;
      case 'worsening':
        return <TrendingUp size={24} color="#ef4444" />;
      case 'stable':
        return <Minus size={24} color="#f59e0b" />;
      default:
        return <Activity size={24} color="#6b7280" />;
    }
  };

  const getTrendColor = () => {
    if (!trendAnalysis) return '#6b7280';

    switch (trendAnalysis.trend) {
      case 'improving':
        return '#10b981';
      case 'worsening':
        return '#ef4444';
      case 'stable':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getRiskLevel = (riskScore) => {
    if (riskScore < 20) return { label: 'Low', color: '#10b981' };
    if (riskScore < 35) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'High', color: '#ef4444' };
  };

  const latestAssessment = getLatestAssessment();

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
                Welcome back, {user.name}!
              </h1>
              <p style={{ margin: 0, color: '#718096' }}>
                User ID: {user.user_id} | Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Start Assessment Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2.5rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Activity size={40} color="white" />
              </div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#1a202c' }}>
                Ready for Assessment?
              </h2>
              <p style={{ margin: '0 0 2rem 0', color: '#718096' }}>
                Perform a comprehensive ACL injury risk assessment to track your knee health
              </p>
              <button
                onClick={onStartAssessment}
                style={{
                  padding: '1rem 3rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Start New Assessment
              </button>
            </div>

            {/* Latest Assessment Results */}
            {latestAssessment && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <BarChart2 size={24} color="#667eea" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>
                    Latest Assessment Results
                  </h3>
                </div>

                <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '1.5rem' }}>
                  <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  {new Date(latestAssessment.date).toLocaleString()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{
                    padding: '1.5rem',
                    background: '#f0f9ff',
                    borderRadius: '12px',
                    border: '2px solid #667eea'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#667eea', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Left Knee
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
                      {latestAssessment.left_knee_risk.toFixed(1)}%
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      background: getRiskLevel(latestAssessment.left_knee_risk).color,
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getRiskLevel(latestAssessment.left_knee_risk).label} Risk
                    </div>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: '#faf5ff',
                    borderRadius: '12px',
                    border: '2px solid #764ba2'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#764ba2', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Right Knee
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#764ba2', marginBottom: '0.5rem' }}>
                      {latestAssessment.right_knee_risk.toFixed(1)}%
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      background: getRiskLevel(latestAssessment.right_knee_risk).color,
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getRiskLevel(latestAssessment.right_knee_risk).label} Risk
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trend Analysis */}
            {trendAnalysis && trendAnalysis.trend !== 'insufficient_data' && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {getTrendIcon()}
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>
                    Progress Trend
                  </h3>
                </div>

                <div style={{
                  padding: '1.5rem',
                  background: '#f7fafc',
                  borderRadius: '12px',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: getTrendColor(),
                    marginBottom: '0.5rem'
                  }}>
                    {trendAnalysis.trend.charAt(0).toUpperCase() + trendAnalysis.trend.slice(1)}
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: '#4a5568', lineHeight: '1.6' }}>
                    {trendAnalysis.message}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Left Knee Change
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: trendAnalysis.left_knee_change < 0 ? '#10b981' : '#ef4444'
                    }}>
                      {trendAnalysis.left_knee_change > 0 ? '+' : ''}{trendAnalysis.left_knee_change}%
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Right Knee Change
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: trendAnalysis.right_knee_change < 0 ? '#10b981' : '#ef4444'
                    }}>
                      {trendAnalysis.right_knee_change > 0 ? '+' : ''}{trendAnalysis.right_knee_change}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Assessments Yet */}
            {assessmentHistory.length === 0 && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '3rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: '#f7fafc',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <AlertCircle size={32} color="#718096" />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#1a202c' }}>
                  No Assessments Yet
                </h3>
                <p style={{ margin: 0, color: '#718096' }}>
                  Complete your first assessment to start tracking your ACL injury risk and progress over time.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Statistics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Statistics Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Award size={24} color="#667eea" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>
                  Your Statistics
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                    Total Assessments
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                    {assessmentHistory.length}
                  </div>
                </div>

                {trendAnalysis && trendAnalysis.assessment_count >= 2 && (
                  <>
                    <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                        Days Since Last Assessment
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                        {Math.floor((new Date() - new Date(latestAssessment.date)) / (1000 * 60 * 60 * 24))}
                      </div>
                    </div>

                    <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                        Progress Status
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: getTrendColor(),
                        textTransform: 'capitalize'
                      }}>
                        {trendAnalysis.trend}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1a202c' }}>
                Quick Actions
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={onViewHistory}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#f7fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4a5568',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#edf2f7';
                    e.target.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f7fafc';
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                >
                  <span>View Full History</span>
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={onStartAssessment}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#f7fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4a5568',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#edf2f7';
                    e.target.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f7fafc';
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                >
                  <span>New Assessment</span>
                  <Activity size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// History Component - same as before...
function AssessmentHistory({ userId, onClose }) {
  const [history, setHistory] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/user/${userId}/history`);
      const data = await response.json();
      setHistory(data.assessments || []);
      setTrend(data.trend_analysis);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.trend) {
      case 'improving':
        return <TrendingDown size={20} color="#10b981" />;
      case 'worsening':
        return <TrendingUp size={20} color="#ef4444" />;
      case 'stable':
        return <Minus size={20} color="#f59e0b" />;
      default:
        return <Activity size={20} color="#6b7280" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '#6b7280';

    switch (trend.trend) {
      case 'improving':
        return '#10b981';
      case 'worsening':
        return '#ef4444';
      case 'stable':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a202c' }}>
            Assessment History
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>

        {trend && trend.trend !== 'insufficient_data' && (
          <div style={{
            padding: '1rem',
            background: '#f7fafc',
            borderRadius: '8px',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {getTrendIcon()}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: getTrendColor(),
                marginBottom: '0.25rem'
              }}>
                {trend.trend.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                {trend.message}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem' }}>
                Left knee: {trend.left_knee_change > 0 ? '+' : ''}{trend.left_knee_change}% |
                Right knee: {trend.right_knee_change > 0 ? '+' : ''}{trend.right_knee_change}%
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
            No assessments yet. Complete your first assessment to start tracking progress.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((assessment, index) => (
              <div
                key={assessment.id}
                style={{
                  padding: '1rem',
                  background: index === 0 ? '#f0f9ff' : '#f7fafc',
                  borderRadius: '8px',
                  border: index === 0 ? '2px solid #667eea' : '1px solid #e2e8f0'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a202c' }}>
                      Assessment #{history.length - index}
                      {index === 0 && (
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.125rem 0.5rem',
                          background: '#667eea',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          Latest
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                      {new Date(assessment.date).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Left Knee Risk
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                      {assessment.left_knee_risk.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Right Knee Risk
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#764ba2' }}>
                      {assessment.right_knee_risk.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Leg Selection Component
function LegSelectionView({ onLegSelect }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1a202c' }}>Select Leg to Assess</h2>
        <p style={{ color: '#718096', marginBottom: '3rem', fontSize: '1.125rem' }}>
          Choose which leg you want to test today. This helps us tailor the assessment instructions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <button
            onClick={() => onLegSelect('left')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '3rem 2rem',
              background: '#f0f9ff',
              border: '3px solid #667eea',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: '#434190'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: '#667eea',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}>L</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Left Leg</div>
          </button>

          <button
            onClick={() => onLegSelect('right')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '3rem 2rem',
              background: '#faf5ff',
              border: '3px solid #764ba2',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: '#553c9a'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(118, 75, 162, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: '#764ba2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}>R</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Right Leg</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Assessment View Component with NEW ANIMATED SVG MODEL
function AssessmentView({ user, onBackToDashboard, wsStatus, setWsStatus, selectedLeg }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sensorData, setSensorData] = useState({});
  const [results, setResults] = useState(null);

  const wsRef = useRef(null);
  const timerRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://localhost:8000/ws/${user.user_id}`);

        ws.onopen = () => {
          console.log('WebSocket connected for user:', user.user_id);
          setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);

          if (message.type === 'posture_status') {
            setIsCalibrated(message.payload.upright);
          } else if (message.type === 'calibration_done') {
            console.log('✅ Calibration complete from backend!');
          } else if (message.type === 'task_result') {
            console.log('Task result received:', message.payload);
            setResults(message.payload);
          } else if (message.type === 'error') {
            console.error('Backend error:', message.payload);
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
  }, [user.user_id]);

  // Simulated sensor data animation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newData = {};
      SENSOR_POSITIONS.forEach(sensor => {
        newData[sensor.id] = {
          active: true,
          signal: 0.5 + Math.random() * 0.3
        };
      });
      setSensorData(newData);
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

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
  }, [isRunning, timeLeft, currentStep]);

  const sendWebSocketMessage = (type, payload = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
      console.log('Sent WebSocket message:', { type, payload });
    } else {
      console.error('WebSocket not connected, status:', wsStatus);
    }
  };

  const handleTimeExpired = () => {
    setIsRunning(false);

    if (currentStep < ASSESSMENT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeLeft(ASSESSMENT_STEPS[currentStep + 1].duration);
    } else {
      console.log('All steps completed, showing completion message');
      setShowCompleted(true);
    }
  };

  const getInstruction = () => {
    const step = ASSESSMENT_STEPS[currentStep];
    if (!step) return '';

    if (step.taskType === 'single_limb_jump') {
      return `Stand on your ${selectedLeg === 'left' ? 'left' : 'right'} leg. ${step.instruction}`;
    }
    return step.instruction;
  };

  const computeRiskAssessment = () => {
    console.log('Computing risk assessment, results:', results);
    if (results) {
      setShowResults(true);
      setShowCompleted(false);
    } else {
      console.error('No results available to display');
      alert('Results are still being processed. Please wait a moment and try again.');
    }
    // Note: In a real app we might filter results by selectedLeg here or in backend
  };

  const handleBackToDashboard = () => {
    setCurrentStep(0);
    setIsRunning(false);
    setShowCompleted(false);
    setShowResults(false);
    setResults(null);
    onBackToDashboard();
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
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#1a202c' }}>
                ACL Injury Risk Assessment
              </h1>
              <p style={{ margin: 0, color: '#718096' }}>
                {user.name} | {showResults ? 'Assessment Complete' : 'In Progress'} | {selectedLeg ? `${selectedLeg.charAt(0).toUpperCase() + selectedLeg.slice(1)} Leg` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={handleBackToDashboard}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Home size={16} />
                Back to Dashboard
              </button>
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
          {!showResults && (
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
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Animated SVG Human Model */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <AnimatedHumanSVG currentStep={currentStep} isRunning={isRunning} selectedLeg={selectedLeg} />

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
                    style={{
                      opacity: sensorData[sensor.id]?.active ? sensorData[sensor.id].signal : 0.3
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                    {sensor.label}
                  </span>
                  {sensorData[sensor.id]?.active && (
                    <div style={{
                      marginLeft: 'auto',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: sensor.side === 'left' ? '#667eea' : '#764ba2',
                      animation: 'pulse 1s infinite'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Current Step */}
            {!showCompleted && !showResults && (
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
                    {getInstruction(currentStepData)}
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

                {/* Controls */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {!isRunning && (
                    <button
                      onClick={() => {
                        const step = ASSESSMENT_STEPS[currentStep];
                        setTimeLeft(step.duration);
                        setIsRunning(true);

                        if (step.taskType === 'calibration') {
                          sendWebSocketMessage('start_calibration');
                        } else {
                          sendWebSocketMessage('start_task', { task: step.taskType, leg: selectedLeg });
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
                </div>
              </div>
            )}

            {/* Completion Panel */}
            {showCompleted && !showResults && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1a202c' }}>
                  Assessment Complete!
                </h3>
                <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                  All {ASSESSMENT_STEPS.length} movement tasks have been recorded. {results ? 'Your results are ready!' : 'Processing your results...'}
                </p>
                {results ? (
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
                    View Risk Assessment Results
                  </button>
                ) : (
                  <div style={{
                    padding: '1rem',
                    background: '#fff3cd',
                    borderRadius: '8px',
                    color: '#856404',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Activity size={16} />
                    Waiting for results from backend...
                  </div>
                )}
              </div>
            )}

            {/* Results Panel */}
            {showResults && results && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#1a202c' }}>
                  ACL Injury Risk Assessment Results
                </h3>

                {/* Trend Analysis */}
                {results.trend_analysis && results.trend_analysis.trend !== 'insufficient_data' && (
                  <div style={{
                    padding: '1rem',
                    background: '#f7fafc',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    {results.trend_analysis.trend === 'improving' && <TrendingDown size={20} color="#10b981" />}
                    {results.trend_analysis.trend === 'worsening' && <TrendingUp size={20} color="#ef4444" />}
                    {results.trend_analysis.trend === 'stable' && <Minus size={20} color="#f59e0b" />}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: results.trend_analysis.trend === 'improving' ? '#10b981' :
                          results.trend_analysis.trend === 'worsening' ? '#ef4444' : '#f59e0b',
                        marginBottom: '0.25rem'
                      }}>
                        {results.trend_analysis.trend.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                        {results.trend_analysis.message}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Left Knee Risk Score
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                      {results.leftKneeRisk?.toFixed(1) || '0.0'}%
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Right Knee Risk Score
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#764ba2' }}>
                      {results.rightKneeRisk?.toFixed(1) || '0.0'}%
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBackToDashboard}
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
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}

// Main App Component
function ACLAssessmentSystem() {
  const [user, setUser] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showHistory, setShowHistory] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [selectedLeg, setSelectedLeg] = useState(null);

  const handleLogin = (userData, latestAssessments) => {
    setUser(userData);
    setAssessmentHistory(latestAssessments);
    setCurrentView('dashboard');
    console.log('User logged in:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    setAssessmentHistory([]);
    setCurrentView('dashboard');
    setShowHistory(false);
    setSelectedLeg(null);
  };

  const handleStartAssessment = () => {
    setCurrentView('leg_selection');
  };

  const handleLegSelected = (leg) => {
    setSelectedLeg(leg);
    setCurrentView('assessment');
  };

  const handleBackToDashboard = () => {
    fetch(`http://localhost:8000/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.user_id,
        name: user.name
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssessmentHistory(data.latest_assessments);
        }
      })
      .catch(err => console.error('Error refreshing history:', err));

    setCurrentView('dashboard');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentView === 'dashboard') {
    return (
      <>
        <Dashboard
          user={user}
          assessmentHistory={assessmentHistory}
          onStartAssessment={handleStartAssessment}
          onViewHistory={() => setShowHistory(true)}
          onLogout={handleLogout}
        />
        {showHistory && (
          <AssessmentHistory
            userId={user.user_id}
            onClose={() => setShowHistory(false)}
          />
        )}
      </>
    );
  }

  if (currentView === 'leg_selection') {
    return <LegSelectionView onLegSelect={handleLegSelected} />;
  }

  return (
    <AssessmentView
      user={user}
      onBackToDashboard={handleBackToDashboard}
      wsStatus={wsStatus}
      setWsStatus={setWsStatus}
      selectedLeg={selectedLeg}
    />
  );
}

export default ACLAssessmentSystem;