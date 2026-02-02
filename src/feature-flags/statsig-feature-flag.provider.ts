 import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import Statsig from 'statsig-node'
import { type FeatureFlagContext, type FeatureFlagProvider } from './feature-flag.interface'

@Injectable()
export class StatsigFeatureFlagProvider implements FeatureFlagProvider, OnModuleInit {
  private readonly logger = new Logger(StatsigFeatureFlagProvider.name)
  private initialized = false

  async onModuleInit() {
    const secretKey = process.env.STATSIG_SERVER_SECRET_KEY
    if (!secretKey) {
      this.logger.warn('STATSIG_SERVER_SECRET_KEY not set, Statsig disabled')
      return
    }

    try {
      await Statsig.initialize(secretKey, {
        environment: { tier: process.env.STATSIG_ENVIRONMENT || 'development' },
      })
      this.initialized = true
      this.logger.log('Statsig initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize Statsig', error)
    }
  }

  isEnabled(flag: string, context?: FeatureFlagContext): boolean {
    if (!this.initialized) {
      this.logger.debug(`Statsig not initialized, flag "${flag}" returning false`)
      return false
    }

    const user = {
      userID: context?.clinicId || context?.integrationId || 'anonymous',
      custom: {
        clinicId: context?.clinicId,
        integrationId: context?.integrationId,
        ...context?.custom,
      },
    }

    const result = Statsig.checkGateSync(user, flag)

    this.logger.debug(
      `Flag "${flag}" for clinicId=${context?.clinicId}, integrationId=${context?.integrationId}: ${result}`,
    )

    return result
  }
}
