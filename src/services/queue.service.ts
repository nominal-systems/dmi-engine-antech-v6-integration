import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { AntechV6MessageData } from '../interfaces/antech-v6-message-data.interface'
import { ConfigService } from '@nestjs/config'
import { QueueHandle } from '../interfaces/queue-handle.interface'

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name)
  private readonly queues: QueueHandle[] = []

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(`${PROVIDER_NAME}.orders`) private readonly ordersQueue: Queue,
    @InjectQueue(`${PROVIDER_NAME}.results`) private readonly resultsQueue: Queue
  ) {
    this.queues.push({
      queue: ordersQueue,
      repeat: this.configService.get('jobs.orders').repeat
    })
    this.queues.push({
      queue: resultsQueue,
      repeat: this.configService.get('jobs.results').repeat
    })
  }

  async onModuleInit() {
    for (const { queue } of this.queues) {
      await queue.resume()
    }
    await this.logJobCounts()
  }

  async startPollingJobsForIntegration(msg: AntechV6MessageData) {
    const jobId = msg.payload.integrationId
    for (const { queue, repeat } of this.queues) {
      await queue.add(msg, { repeat, jobId })
      this.logger.debug(`Added job '${jobId}' to queue ${queue.name}`)
    }
    await this.logJobCounts()
  }

  async stopPollingJobsForIntegration(msg: AntechV6MessageData) {
    const jobId = msg.payload.integrationId
    for (const { queue, repeat } of this.queues) {
      await queue.removeRepeatable({ ...repeat, jobId })
      this.logger.debug(`Removed repeatable job '${jobId}' from queue ${queue.name}`)
    }
    await this.logJobCounts()
  }

  private async logJobCounts() {
    for (const queue of [this.ordersQueue, this.resultsQueue]) {
      const jobCounts = await queue.getJobCounts()
      const totalJobCount = Object.values(jobCounts).reduce((acc, qty) => acc + qty, 0)
      this.logger.log(
        `Queue ${queue.name} has ${totalJobCount} jobs: ${jobCounts.active} active, ${jobCounts.waiting} waiting, ${jobCounts.delayed} delayed.`
      )
    }
  }
}
