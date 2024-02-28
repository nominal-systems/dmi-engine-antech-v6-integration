import { Test, TestingModule } from '@nestjs/testing'
import { AntechV6Controller } from './antech-v6.controller'

describe('AntechV6Controller', () => {
  let controller: AntechV6Controller

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AntechV6Controller],
    }).compile()

    controller = module.get<AntechV6Controller>(AntechV6Controller)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
