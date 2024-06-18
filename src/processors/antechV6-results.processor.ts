import { Inject, Logger } from '@nestjs/common'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { AntechV6Service } from '../services/antechV6.service'
import { ClientProxy } from '@nestjs/microservices'

@Processor(`${PROVIDER_NAME}.results`)
export class AntechV6ResultsProcessor {
  private readonly logger = new Logger(AntechV6ResultsProcessor.name)

  constructor(
    private readonly antechV6Service: AntechV6Service,
    @Inject('API_SERVICE') private readonly apiClient: ClientProxy
  ) {}

  @Process()
  async fetchResults(job: Job<AntechV6MessageData>) {
    const { payload, ...metadata } = job.data
    this.logger.debug(`Fetching results for integration ${payload.integrationId}`)
    try {
      const batchResults = await this.antechV6Service.getBatchResults(payload, metadata)
      if (batchResults.results.length > 0) {
        this.logger.log(
          `Fetched ${batchResults.results.length} result${batchResults.results.length > 1 ? 's' : ''} for integration ${payload.integrationId}`
        )

        const labAccessionIds = batchResults.results
          .map((result) => result.accession)
          .filter((acc): acc is string => acc !== undefined)

        this.apiClient.emit('external_order_results', {
          integrationId: payload.integrationId,
          results: batchResults.results
        })

        this.apiClient.emit('external_results', {
          integrationId: payload.integrationId,
          results: batchResults.results
        })

        await this.antechV6Service.acknowledgeResults({ ids: labAccessionIds }, metadata)
        this.logger.log(`Acknowledged results ${labAccessionIds.join(',')} for integration ${payload.integrationId}`)
      }
    } catch (error) {
      this.logger.error(`Error fetching results for integration ${payload.integrationId}: ${error.message}`)
    }
  }
}
