import { Test } from '@nestjs/testing'
import { AntechV6ApiService } from './antechV6-api.service'
import { AntechV6ApiHttpService } from './antechV6-api-http.service'

describe('AntechV6ApiService', () => {
  let service: AntechV6ApiService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AntechV6ApiService,
        {
          provide: AntechV6ApiHttpService,
          useValue: {}
        }
      ]
    }).compile()

    service = module.get<AntechV6ApiService>(AntechV6ApiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
