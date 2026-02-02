export const FEATURE_FLAG_PROVIDER = 'FEATURE_FLAG_PROVIDER'

export interface FeatureFlagContext {
  userID?: string
  clinicId?: string
  integrationId?: string
  custom?: Record<string, unknown>
}

export interface FeatureFlagProvider {
  isEnabled(flag: string, context?: FeatureFlagContext): boolean
}

export const ANTECH_V6_GROUPED_TEST_RESULTS_FLAG = 'antech_v6_grouped_test_results'
export const ANTECH_V6_STATSIG_TEST_LOG_FLAG = 'antech_v6_statsig_test_log'
