/**
 * Risk Calculation Utilities for ACL Jump-Landing Assessment
 * 
 * These functions compare user's jump-landing data against reference values
 * to calculate injury risk percentages.
 */

import { REFERENCE_VALUES, RISK_THRESHOLDS } from '../config/referenceValues';

/**
 * Calculate flexion risk for a single leg
 * Risk occurs when user's mean flexion is LESS than reference (insufficient flexion)
 * 
 * @param {number} userFlexionMean - User's mean flexion angle (degrees)
 * @param {number} referenceFlexionMean - Reference mean flexion angle (degrees)
 * @returns {number} Risk percentage (0-100)
 */
export function calculateFlexionRisk(userFlexionMean, referenceFlexionMean) {
    // Calculate deviation (positive = user has less flexion than reference)
    // Since flexion angles are negative, less flexion means more negative value
    const deviation = referenceFlexionMean - userFlexionMean;

    // No risk if deviation is within threshold
    if (deviation <= RISK_THRESHOLDS.FLEXION_THRESHOLD) {
        return 0;
    }

    // Calculate risk percentage based on deviation
    const excessDeviation = deviation - RISK_THRESHOLDS.FLEXION_THRESHOLD;
    const riskRange = RISK_THRESHOLDS.MAX_DEVIATION - RISK_THRESHOLDS.FLEXION_THRESHOLD;
    const riskPercentage = Math.min(100, (excessDeviation / riskRange) * 100);

    return riskPercentage;
}

/**
 * Calculate abduction risk for a single leg
 * Risk occurs when user's mean abduction is MORE than reference (excessive abduction)
 * 
 * @param {number} userAbductionMean - User's mean abduction angle (degrees)
 * @param {number} referenceAbductionMean - Reference mean abduction angle (degrees)
 * @returns {number} Risk percentage (0-100)
 */
export function calculateAbductionRisk(userAbductionMean, referenceAbductionMean) {
    // Calculate deviation (positive = user has more abduction than reference)
    const deviation = userAbductionMean - referenceAbductionMean;

    // No risk if deviation is within threshold
    if (deviation <= RISK_THRESHOLDS.ABDUCTION_THRESHOLD) {
        return 0;
    }

    // Calculate risk percentage based on deviation
    const excessDeviation = deviation - RISK_THRESHOLDS.ABDUCTION_THRESHOLD;
    const riskRange = RISK_THRESHOLDS.MAX_DEVIATION - RISK_THRESHOLDS.ABDUCTION_THRESHOLD;
    const riskPercentage = Math.min(100, (excessDeviation / riskRange) * 100);

    return riskPercentage;
}

/**
 * Calculate overall risk for a single leg based on flexion and abduction
 * 
 * @param {Object} params - Parameters object
 * @param {number} params.userFlexionMean - User's mean flexion angle
 * @param {number} params.userAbductionMean - User's mean abduction angle
 * @param {number} params.referenceFlexionMean - Reference mean flexion angle
 * @param {number} params.referenceAbductionMean - Reference mean abduction angle
 * @returns {Object} Risk breakdown { flexionRisk, abductionRisk, overallRisk }
 */
export function calculateLegRisk(params) {
    const {
        userFlexionMean,
        userAbductionMean,
        referenceFlexionMean,
        referenceAbductionMean
    } = params;

    const flexionRisk = calculateFlexionRisk(userFlexionMean, referenceFlexionMean);
    const abductionRisk = calculateAbductionRisk(userAbductionMean, referenceAbductionMean);

    // Overall risk is the maximum of the two (worst case scenario)
    const overallRisk = Math.max(flexionRisk, abductionRisk);

    return {
        flexionRisk: Math.round(flexionRisk),
        abductionRisk: Math.round(abductionRisk),
        overallRisk: Math.round(overallRisk)
    };
}

/**
 * Calculate comprehensive risk assessment for both legs
 * 
 * @param {Object} userData - User's jump-landing statistics (same format as reference values)
 * @returns {Object} Complete risk assessment with breakdown for both legs
 */
export function calculateComprehensiveRisk(userData) {
    // Left leg risk
    const leftLegRisk = calculateLegRisk({
        userFlexionMean: userData.left_flexion.mean,
        userAbductionMean: userData.left_abduction.mean,
        referenceFlexionMean: REFERENCE_VALUES.left_flexion.mean,
        referenceAbductionMean: REFERENCE_VALUES.left_abduction.mean
    });

    // Right leg risk
    const rightLegRisk = calculateLegRisk({
        userFlexionMean: userData.right_flexion.mean,
        userAbductionMean: userData.right_abduction.mean,
        referenceFlexionMean: REFERENCE_VALUES.right_flexion.mean,
        referenceAbductionMean: REFERENCE_VALUES.right_abduction.mean
    });

    // Overall risk is the maximum of both legs
    const overallRisk = Math.max(leftLegRisk.overallRisk, rightLegRisk.overallRisk);

    return {
        leftLeg: leftLegRisk,
        rightLeg: rightLegRisk,
        overallRisk,
        riskLevel: getRiskLevel(overallRisk)
    };
}

/**
 * Get risk level classification based on percentage
 * 
 * @param {number} riskPercentage - Risk percentage (0-100)
 * @returns {Object} Risk level { label, color, min, max }
 */
export function getRiskLevel(riskPercentage) {
    const levels = RISK_THRESHOLDS.RISK_LEVELS;

    if (riskPercentage <= levels.LOW.max) {
        return levels.LOW;
    } else if (riskPercentage <= levels.MODERATE.max) {
        return levels.MODERATE;
    } else if (riskPercentage <= levels.HIGH.max) {
        return levels.HIGH;
    } else {
        return levels.VERY_HIGH;
    }
}

/**
 * Get deviation information for detailed analysis
 * 
 * @param {Object} userData - User's jump-landing statistics
 * @returns {Object} Deviation details for all metrics
 */
export function getDeviationDetails(userData) {
    return {
        leftFlexion: {
            user: userData.left_flexion.mean.toFixed(1),
            reference: REFERENCE_VALUES.left_flexion.mean.toFixed(1),
            deviation: (REFERENCE_VALUES.left_flexion.mean - userData.left_flexion.mean).toFixed(1),
            status: (REFERENCE_VALUES.left_flexion.mean - userData.left_flexion.mean) > RISK_THRESHOLDS.FLEXION_THRESHOLD ? 'at-risk' : 'normal'
        },
        rightFlexion: {
            user: userData.right_flexion.mean.toFixed(1),
            reference: REFERENCE_VALUES.right_flexion.mean.toFixed(1),
            deviation: (REFERENCE_VALUES.right_flexion.mean - userData.right_flexion.mean).toFixed(1),
            status: (REFERENCE_VALUES.right_flexion.mean - userData.right_flexion.mean) > RISK_THRESHOLDS.FLEXION_THRESHOLD ? 'at-risk' : 'normal'
        },
        leftAbduction: {
            user: userData.left_abduction.mean.toFixed(1),
            reference: REFERENCE_VALUES.left_abduction.mean.toFixed(1),
            deviation: (userData.left_abduction.mean - REFERENCE_VALUES.left_abduction.mean).toFixed(1),
            status: (userData.left_abduction.mean - REFERENCE_VALUES.left_abduction.mean) > RISK_THRESHOLDS.ABDUCTION_THRESHOLD ? 'at-risk' : 'normal'
        },
        rightAbduction: {
            user: userData.right_abduction.mean.toFixed(1),
            reference: REFERENCE_VALUES.right_abduction.mean.toFixed(1),
            deviation: (userData.right_abduction.mean - REFERENCE_VALUES.right_abduction.mean).toFixed(1),
            status: (userData.right_abduction.mean - REFERENCE_VALUES.right_abduction.mean) > RISK_THRESHOLDS.ABDUCTION_THRESHOLD ? 'at-risk' : 'normal'
        }
    };
}

export default {
    calculateFlexionRisk,
    calculateAbductionRisk,
    calculateLegRisk,
    calculateComprehensiveRisk,
    getRiskLevel,
    getDeviationDetails
};
