import { AntechV6ApiInterceptor } from './antechV6-api.interceptor'
import { AntechV6ApiHttpService } from './antechV6-api-http.service'
import { AntechV6Endpoints } from '../interfaces/antechV6-api.interface'
import { AxiosResponse } from 'axios'

describe('AntechV6ApiInterceptor.filter()', () => {
  let interceptor: AntechV6ApiInterceptor

  beforeEach(() => {
    interceptor = new AntechV6ApiInterceptor({} as AntechV6ApiHttpService, {} as any)
  })

  const buildResponse = (status: number, data: any): AxiosResponse => {
    return { status, data } as AxiosResponse
  }

  describe('filter()', () => {
    it('should filter out empty GetStatus responses when successful', () => {
      const url = AntechV6Endpoints.GET_STATUS
      const response = buildResponse(200, { LabOrders: [], LabResults: [] })

      expect(interceptor.filter(url, response.data, response)).toBe(false)
    })

    it('should not filter out empty GetStatus responses when request failed', () => {
      const url = AntechV6Endpoints.GET_STATUS
      const response = buildResponse(500, { LabOrders: [], LabResults: [] })

      expect(interceptor.filter(url, response.data, response)).toBe(true)
    })

    it('should filter out empty GetAllResults responses when successful', () => {
      const url = AntechV6Endpoints.GET_ALL_RESULTS
      const response = buildResponse(200, [])

      expect(interceptor.filter(url, response.data, response)).toBe(false)
    })

    it('should not filter out empty GetAllResults responses when request failed', () => {
      const url = AntechV6Endpoints.GET_ALL_RESULTS
      const response = buildResponse(404, [])

      expect(interceptor.filter(url, response.data, response)).toBe(true)
    })
  })
})
