import { Controller, UsePipes, ValidationPipe } from '@nestjs/common'
import { Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices'
import {
  IExistingIntegrationJobMetadata,
  IMetadata,
  INewIntegrationJobMetadata,
  Operation,
  ProviderIntegrationAdmin,
  Resource
} from '@nominal-systems/dmi-engine-common'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { QueueService } from '../services/queue.service'
import { AntechV6MessageData } from '../interfaces/antech-v6-message-data.interface'

@Controller(`integrations/${PROVIDER_NAME}`)
@UsePipes(
  new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  })
)
export class AntechV6Controller implements ProviderIntegrationAdmin {
  constructor(private readonly queueService: QueueService) {}

  @MessagePattern(`${PROVIDER_NAME}.${Resource.Integration}.${Operation.Create}`)
  async handleNewIntegration(@Payload() jobData: INewIntegrationJobMetadata<AntechV6MessageData>): Promise<void> {
    await this.queueService.startPollingJobsForIntegration(jobData.data)
  }

  @MessagePattern(`${PROVIDER_NAME}.${Resource.Integration}.${Operation.Remove}`)
  async handleIntegrationDelete(
    @Payload() jobData: IExistingIntegrationJobMetadata<AntechV6MessageData>
  ): Promise<void> {
    await this.queueService.stopPollingJobsForIntegration(jobData.data)
  }

  @MessagePattern(`${PROVIDER_NAME}.${Resource.Integration}.${Operation.Update}`)
  async handleIntegrationUpdate(
    @Payload() jobData: IExistingIntegrationJobMetadata<IMetadata>,
    @Ctx() context: MqttContext
  ): Promise<void> {
    console.log('==================================================') // TODO(gb): remove trace
    console.log('ANTECH-V6') // TODO(gb): remove trace
    console.log('==================================================') // TODO(gb): remove trace
    console.log(`Topic: ${context.getTopic()}`) // TODO(gb): remove trace
    console.log(`${JSON.stringify(jobData, null, 2)}`) // TODO(gb): remove trace
    console.log('--------------------------------------------------\n') // TODO(gb): remove trace
  }
}
