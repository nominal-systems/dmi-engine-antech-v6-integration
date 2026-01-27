export const FEATURE_FLAG_PROVIDER = 'FEATURE_FLAG_PROVIDER'

export interface FeatureFlagContext {
  userID?: string
  custom?: Record<string, unknown>
}

export interface FeatureFlagProvider {
  isEnabled(flag: string, context?: FeatureFlagContext): boolean
}

export const ANTECH_V6_LEGACY_TEST_RESULTS_FLAG = 'antech_v6_legacy_test_results'
export const ANTECH_V6_STATSIG_TEST_LOG_FLAG = 'antech_v6_statsig_test_log'
