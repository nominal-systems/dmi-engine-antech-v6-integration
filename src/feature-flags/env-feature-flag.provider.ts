import { Injectable } from '@nestjs/common'
import {
  ANTECH_V6_GROUPED_RESULTS_FLAG,
  ANTECH_V6_STATSIG_TEST_LOG_FLAG,
  type FeatureFlagContext,
  type FeatureFlagProvider,
} from './feature-flag.interface'

@Injectable()
export class EnvFeatureFlagProvider implements FeatureFlagProvider {
  isEnabled(flag: string, _context?: FeatureFlagContext): boolean {
    switch (flag) {
      case ANTECH_V6_GROUPED_RESULTS_FLAG:
        return process.env.ANTECH_V6_GROUPED_RESULTS === 'true'
      case ANTECH_V6_STATSIG_TEST_LOG_FLAG:
        return process.env.ANTECH_V6_STATSIG_TEST_LOG === 'true'
      default:
        return false
    }
  }
}
