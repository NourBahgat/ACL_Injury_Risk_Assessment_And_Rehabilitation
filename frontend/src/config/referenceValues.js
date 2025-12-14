/**
 * Reference Values for ACL Jump-Landing Assessment
 * 
 * These values are derived from normal 10-second jump-landing recordings
 * and serve as the baseline for risk assessment calculations.
 * 
 * Recording Info:
 * - Duration: 10.009 seconds
 * - Sample Count: 361
 * - Sampling Rate: ~36.07 Hz
 * - Recording Date: 2025-12-14T01:31:37
 */

export const REFERENCE_VALUES = {
    // Recording metadata
    recording_info: {
        duration_seconds: 10.009,
        sample_count: 361,
        sampling_rate_hz: 36.06753921470676,
        recording_timestamp: "2025-12-14T01:31:37.168374"
    },

    // Left knee flexion (negative = flexion)
    left_flexion: {
        min: -37.90990125256177,
        max: 17.373507029848938,
        mean: -15.768442130930213,
        std: 13.099280277926049,
        range: 55.283408282410704,
        median: -20.416868860176855,
        peak_to_peak: 55.283408282410704
    },

    // Right knee flexion (negative = flexion)
    right_flexion: {
        min: -45.12812256359604,
        max: 19.399853083740975,
        mean: -5.4803827028939995,
        std: 16.977208396025176,
        range: 64.52797564733702,
        median: -2.3518233324290425,
        peak_to_peak: 64.52797564733702
    },

    // Left knee abduction
    left_abduction: {
        min: -12.987370454767497,
        max: 12.79714787614641,
        mean: 1.5402219128614143,
        std: 6.164903709405487,
        range: 25.784518330913905,
        median: 2.3617310597661754,
        peak_to_peak: 25.784518330913905
    },

    // Right knee abduction
    right_abduction: {
        min: -11.371219241056986,
        max: 21.982098970797008,
        mean: 4.357719840572207,
        std: 8.357244902499719,
        range: 33.353318211853995,
        median: 2.9019841806779407,
        peak_to_peak: 33.353318211853995
    },

    // Symmetry metrics
    symmetry_metrics: {
        flexion_difference_mean: -10.288059428036213,
        flexion_difference_max: 57.30034460418277,
        abduction_difference_mean: -2.8174979277107925,
        abduction_difference_max: 20.39785124081253
    }
};

// Risk assessment thresholds (in degrees)
export const RISK_THRESHOLDS = {
    // Deviation thresholds from reference mean values
    FLEXION_THRESHOLD: 10,  // Risk if user's flexion is LESS than reference by >10°
    ABDUCTION_THRESHOLD: 10, // Risk if user's abduction is MORE than reference by >10°

    // Maximum deviation for risk scaling (beyond this = 100% risk)
    MAX_DEVIATION: 30,

    // Risk level classifications
    RISK_LEVELS: {
        LOW: { min: 0, max: 25, label: 'Low', color: '#4caf50' },
        MODERATE: { min: 25, max: 50, label: 'Moderate', color: '#ff9800' },
        HIGH: { min: 50, max: 75, label: 'High', color: '#ff5722' },
        VERY_HIGH: { min: 75, max: 100, label: 'Very High', color: '#f44336' }
    }
};

export default REFERENCE_VALUES;
