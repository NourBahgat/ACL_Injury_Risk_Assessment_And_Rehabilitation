/**
 * Manual Test for Risk Calculation Utilities
 * 
 * This file can be used to test the risk calculation logic independently
 * Run this in the browser console or as a Node.js script
 */

import { calculateComprehensiveRisk, getDeviationDetails } from '../utils/riskCalculation.js';
import { REFERENCE_VALUES } from '../config/referenceValues.js';

// Test Case 1: Normal data (should show low/no risk)
const normalData = {
    left_flexion: {
        mean: -16.0,  // Close to reference: -15.77
        min: -38.0,
        max: 17.0,
        std: 13.0
    },
    right_flexion: {
        mean: -5.5,  // Close to reference: -5.48
        min: -45.0,
        max: 19.0,
        std: 17.0
    },
    left_abduction: {
        mean: 1.5,  // Close to reference: 1.54
        min: -13.0,
        max: 13.0,
        std: 6.2
    },
    right_abduction: {
        mean: 4.4,  // Close to reference: 4.36
        min: -11.0,
        max: 22.0,
        std: 8.4
    }
};

// Test Case 2: High flexion risk (insufficient flexion)
const highFlexionRiskData = {
    left_flexion: {
        mean: -2.0,  // Much less flexion than reference (13.77° less)
        min: -15.0,
        max: 5.0,
        std: 8.0
    },
    right_flexion: {
        mean: 5.0,  // Much less flexion than reference (10.48° less)
        min: -10.0,
        max: 15.0,
        std: 10.0
    },
    left_abduction: {
        mean: 1.5,
        min: -13.0,
        max: 13.0,
        std: 6.2
    },
    right_abduction: {
        mean: 4.4,
        min: -11.0,
        max: 22.0,
        std: 8.4
    }
};

// Test Case 3: High abduction risk (excessive abduction/valgus)
const highAbductionRiskData = {
    left_flexion: {
        mean: -16.0,
        min: -38.0,
        max: 17.0,
        std: 13.0
    },
    right_flexion: {
        mean: -5.5,
        min: -45.0,
        max: 19.0,
        std: 17.0
    },
    left_abduction: {
        mean: 15.0,  // Excessive abduction (13.46° more than reference)
        min: -5.0,
        max: 25.0,
        std: 8.0
    },
    right_abduction: {
        mean: 18.0,  // Excessive abduction (13.64° more than reference)
        min: 0.0,
        max: 30.0,
        std: 10.0
    }
};

// Run tests
console.log('=== ACL RISK ASSESSMENT TESTS ===\n');

console.log('Reference Values:');
console.log('Left Flexion Mean:', REFERENCE_VALUES.left_flexion.mean.toFixed(1), '°');
console.log('Right Flexion Mean:', REFERENCE_VALUES.right_flexion.mean.toFixed(1), '°');
console.log('Left Abduction Mean:', REFERENCE_VALUES.left_abduction.mean.toFixed(1), '°');
console.log('Right Abduction Mean:', REFERENCE_VALUES.right_abduction.mean.toFixed(1), '°');
console.log('\n');

console.log('TEST 1: Normal Data (Expected: Low/No Risk)');
const result1 = calculateComprehensiveRisk(normalData);
console.log('Overall Risk:', result1.overallRisk, '%');
console.log('Risk Level:', result1.riskLevel.label);
console.log('Left Leg:', result1.leftLeg);
console.log('Right Leg:', result1.rightLeg);
console.log('Deviations:', getDeviationDetails(normalData));
console.log('\n');

console.log('TEST 2: High Flexion Risk (Expected: High Risk)');
const result2 = calculateComprehensiveRisk(highFlexionRiskData);
console.log('Overall Risk:', result2.overallRisk, '%');
console.log('Risk Level:', result2.riskLevel.label);
console.log('Left Leg:', result2.leftLeg);
console.log('Right Leg:', result2.rightLeg);
console.log('Deviations:', getDeviationDetails(highFlexionRiskData));
console.log('\n');

console.log('TEST 3: High Abduction Risk (Expected: High Risk)');
const result3 = calculateComprehensiveRisk(highAbductionRiskData);
console.log('Overall Risk:', result3.overallRisk, '%');
console.log('Risk Level:', result3.riskLevel.label);
console.log('Left Leg:', result3.leftLeg);
console.log('Right Leg:', result3.rightLeg);
console.log('Deviations:', getDeviationDetails(highAbductionRiskData));
console.log('\n');

console.log('=== TESTS COMPLETE ===');
