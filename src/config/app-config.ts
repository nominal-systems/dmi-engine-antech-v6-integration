import { CronRepeatOptions, EveryRepeatOptions, JobId } from 'bull'

export interface AppConfig {
  jobs: {
    [key: string]: {
      repeat: CronRepeatOptions | EveryRepeatOptions
    }
  }
}
