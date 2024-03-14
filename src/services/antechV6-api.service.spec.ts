import { Test } from '@nestjs/testing'
import { AntechV6ApiService } from './antechV6-api.service'
import { HttpService } from '@nestjs/axios'

describe('AntechV6ApiService', () => {
  let service: AntechV6ApiService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AntechV6ApiService,
        {
          provide: HttpService,
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
