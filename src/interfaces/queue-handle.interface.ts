import { CronRepeatOptions, EveryRepeatOptions, Queue } from 'bull'

export interface QueueHandle {
  queue: Queue
  repeat: CronRepeatOptions | EveryRepeatOptions
}
