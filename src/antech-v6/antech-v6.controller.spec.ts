import { Test, TestingModule } from '@nestjs/testing'
import { AntechV6Controller } from './antech-v6.controller'
import { QueueService } from '../services/queue.service'

describe('AntechV6Controller', () => {
  let controller: AntechV6Controller

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: QueueService,
          useValue: {}
        }
      ],
      controllers: [AntechV6Controller]
    }).compile()

    controller = module.get<AntechV6Controller>(AntechV6Controller)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
