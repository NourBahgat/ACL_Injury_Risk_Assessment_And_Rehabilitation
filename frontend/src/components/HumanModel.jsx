import { useState } from 'react';
import './HumanModel.css';

/**
 * HumanModel Component
 * Simplified 2D SVG human silhouette with segmented anatomy
 * Supports highlighting of thighs and shanks for ACL assessment
 */
function HumanModel({ highlight = 'neutral', highlightedJoint = null }) {
    // Color schemes for different highlight states
    const colorSchemes = {
        neutral: {
            body: '#E0E0E0',
            limbs: '#C0C0C0',
            joints: '#A0A0A0',
            highlight: '#90CAF9'
        },
        active: {
            body: '#E3F2FD',
            limbs: '#64B5F6',
            joints: '#42A5F5',
            highlight: '#2196F3'
        },
        error: {
            body: '#FFEBEE',
            limbs: '#EF5350',
            joints: '#E53935',
            highlight: '#F44336'
        }
    };

    const colors = colorSchemes[highlight] || colorSchemes.neutral;

    // Define body segment coordinates for easy animation
    const bodySegments = {
        head: { cx: 100, cy: 40, r: 20 },
        torso: {
            top: { x: 100, y: 60 },
            bottom: { x: 100, y: 150 }
        },
        shoulders: {
            left: { x: 70, y: 70 },
            right: { x: 130, y: 70 }
        },
        hips: {
            left: { x: 85, y: 150 },
            right: { x: 115, y: 150 }
        },
        // LEFT LEG
        leftThigh: {
            start: { x: 85, y: 150 },
            end: { x: 75, y: 220 }
        },
        leftShank: {
            start: { x: 75, y: 220 },
            end: { x: 70, y: 300 }
        },
        leftKnee: { cx: 75, cy: 220, r: 6 },
        leftAnkle: { cx: 70, cy: 300, r: 5 },
        // RIGHT LEG
        rightThigh: {
            start: { x: 115, y: 150 },
            end: { x: 125, y: 220 }
        },
        rightShank: {
            start: { x: 125, y: 220 },
            end: { x: 130, y: 300 }
        },
        rightKnee: { cx: 125, cy: 220, r: 6 },
        rightAnkle: { cx: 130, cy: 300, r: 5 },
        // ARMS
        leftUpperArm: {
            start: { x: 70, y: 70 },
            end: { x: 50, y: 130 }
        },
        leftForearm: {
            start: { x: 50, y: 130 },
            end: { x: 45, y: 180 }
        },
        leftElbow: { cx: 50, cy: 130, r: 4 },
        rightUpperArm: {
            start: { x: 130, y: 70 },
            end: { x: 150, y: 130 }
        },
        rightForearm: {
            start: { x: 150, y: 130 },
            end: { x: 155, y: 180 }
        },
        rightElbow: { cx: 150, cy: 130, r: 4 }
    };

    // Helper function to render a limb segment with animation support
    const renderSegment = (segment, color, className = '', strokeWidth = 8) => {
        return (
            <line
                x1={segment.start.x}
                y1={segment.start.y}
                x2={segment.end.x}
                y2={segment.end.y}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className={className}
            />
        );
    };

    // Helper function to render joints
    const renderJoint = (joint, color, className = '') => {
        return (
            <circle
                cx={joint.cx}
                cy={joint.cy}
                r={joint.r}
                fill={color}
                className={className}
            />
        );
    };

    return (
        <div className="human-model">
            <div className="model-container">
                <svg
                    viewBox="0 0 200 350"
                    className="body-diagram"
                    style={{ maxWidth: '300px', margin: '0 auto', display: 'block' }}
                >
                    {/* Define gradients for depth effect */}
                    <defs>
                        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colors.body} stopOpacity="0.8" />
                            <stop offset="50%" stopColor={colors.body} stopOpacity="1" />
                            <stop offset="100%" stopColor={colors.body} stopOpacity="0.8" />
                        </linearGradient>

                        <linearGradient id="limbGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colors.limbs} stopOpacity="0.7" />
                            <stop offset="50%" stopColor={colors.limbs} stopOpacity="1" />
                            <stop offset="100%" stopColor={colors.limbs} stopOpacity="0.7" />
                        </linearGradient>

                        <radialGradient id="highlightGradient">
                            <stop offset="0%" stopColor={colors.highlight} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={colors.highlight} stopOpacity="0.3" />
                        </radialGradient>
                    </defs>

                    {/* TORSO - Rounded rectangle for more realistic shape */}
                    <rect
                        x={bodySegments.torso.top.x - 25}
                        y={bodySegments.torso.top.y}
                        width={50}
                        height={90}
                        rx={15}
                        fill="url(#bodyGradient)"
                        stroke={colors.joints}
                        strokeWidth={2}
                    />

                    {/* HEAD */}
                    <circle
                        cx={bodySegments.head.cx}
                        cy={bodySegments.head.cy}
                        r={bodySegments.head.r}
                        fill="url(#bodyGradient)"
                        stroke={colors.joints}
                        strokeWidth={2}
                    />

                    {/* NECK */}
                    <line
                        x1={100}
                        y1={60}
                        x2={100}
                        y2={70}
                        stroke={colors.limbs}
                        strokeWidth={6}
                        strokeLinecap="round"
                    />

                    {/* ARMS */}
                    {renderSegment(bodySegments.leftUpperArm, colors.limbs, 'left-upper-arm', 6)}
                    {renderSegment(bodySegments.leftForearm, colors.limbs, 'left-forearm', 5)}
                    {renderSegment(bodySegments.rightUpperArm, colors.limbs, 'right-upper-arm', 6)}
                    {renderSegment(bodySegments.rightForearm, colors.limbs, 'right-forearm', 5)}

                    {/* THIGHS - Highlighted segments */}
                    {renderSegment(
                        bodySegments.leftThigh,
                        highlightedJoint === 'thigh' || highlightedJoint === 'leg' ? colors.highlight : 'url(#limbGradient)',
                        'left-thigh segment-thigh',
                        10
                    )}
                    {renderSegment(
                        bodySegments.rightThigh,
                        highlightedJoint === 'thigh' || highlightedJoint === 'leg' ? colors.highlight : 'url(#limbGradient)',
                        'right-thigh segment-thigh',
                        10
                    )}

                    {/* SHANKS - Highlighted segments */}
                    {renderSegment(
                        bodySegments.leftShank,
                        highlightedJoint === 'shank' || highlightedJoint === 'leg' ? colors.highlight : 'url(#limbGradient)',
                        'left-shank segment-shank',
                        9
                    )}
                    {renderSegment(
                        bodySegments.rightShank,
                        highlightedJoint === 'shank' || highlightedJoint === 'leg' ? colors.highlight : 'url(#limbGradient)',
                        'right-shank segment-shank',
                        9
                    )}

                    {/* JOINTS */}
                    {renderJoint(bodySegments.leftElbow, colors.joints, 'left-elbow')}
                    {renderJoint(bodySegments.rightElbow, colors.joints, 'right-elbow')}
                    {renderJoint(bodySegments.leftKnee, colors.joints, 'left-knee joint-knee')}
                    {renderJoint(bodySegments.rightKnee, colors.joints, 'right-knee joint-knee')}
                    {renderJoint(bodySegments.leftAnkle, colors.joints, 'left-ankle')}
                    {renderJoint(bodySegments.rightAnkle, colors.joints, 'right-ankle')}

                    {/* FEET */}
                    <ellipse
                        cx={70}
                        cy={310}
                        rx={12}
                        ry={5}
                        fill={colors.limbs}
                        className="left-foot"
                    />
                    <ellipse
                        cx={130}
                        cy={310}
                        rx={12}
                        ry={5}
                        fill={colors.limbs}
                        className="right-foot"
                    />

                    {/* KNEE HIGHLIGHTS - Special highlighting for knee joint */}
                    {highlightedJoint === 'knee' && (
                        <>
                            <circle
                                cx={bodySegments.leftKnee.cx}
                                cy={bodySegments.leftKnee.cy}
                                r={12}
                                fill="url(#highlightGradient)"
                                className="knee-highlight"
                            />
                            <circle
                                cx={bodySegments.rightKnee.cx}
                                cy={bodySegments.rightKnee.cy}
                                r={12}
                                fill="url(#highlightGradient)"
                                className="knee-highlight"
                            />
                        </>
                    )}

                    {/* SPINE HIGHLIGHTS - For upright posture check */}
                    {highlightedJoint === 'spine' && (
                        <line
                            x1={100}
                            y1={70}
                            x2={100}
                            y2={150}
                            stroke={colors.highlight}
                            strokeWidth={4}
                            strokeLinecap="round"
                            className="spine-highlight"
                            opacity={0.6}
                        />
                    )}
                </svg>
            </div>
        </div>
    );
}

export default HumanModel;
