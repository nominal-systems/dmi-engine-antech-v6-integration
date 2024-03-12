import { Logger } from '@nestjs/common'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { AntechV6MessageData } from '../interfaces/antech-v6-message-data.interface'

@Processor(`${PROVIDER_NAME}.results`)
export class ResultsProcessor {
  private readonly logger = new Logger(ResultsProcessor.name)

  @Process()
  async fetchResults(job: Job<AntechV6MessageData>) {
    const { payload } = job.data
    this.logger.debug(`Fetching results for integration ${payload.integrationId}`)
  }
}
