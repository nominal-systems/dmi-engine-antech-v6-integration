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

  describe('redactBinaryBody()', () => {
    const pdfResponse = (data: any): AxiosResponse =>
      ({
        headers: { 'content-type': 'application/pdf' },
        request: { method: 'GET' },
        data,
      }) as unknown as AxiosResponse

    it('should replace Buffer bodies with a stub', () => {
      const body = Buffer.from('%PDF-1.4 fake pdf content')
      expect(interceptor.redactBinaryBody(body, pdfResponse(body))).toEqual({
        contentType: 'application/pdf',
        byteLength: body.byteLength,
        bodyOmitted: true,
      })
    })

    it('should replace ArrayBuffer bodies with a stub', () => {
      const body = new ArrayBuffer(16)
      expect(interceptor.redactBinaryBody(body, pdfResponse(body))).toEqual({
        contentType: 'application/pdf',
        byteLength: 16,
        bodyOmitted: true,
      })
    })

    it('should replace application/pdf string bodies with a stub', () => {
      const body = '%PDF-1.4 fake pdf content'
      expect(interceptor.redactBinaryBody(body, pdfResponse(body))).toEqual({
        contentType: 'application/pdf',
        byteLength: Buffer.byteLength(body, 'binary'),
        bodyOmitted: true,
      })
    })

    it('should default the stub content type when the header is missing', () => {
      const body = Buffer.from('binary blob')
      const response = { request: { method: 'GET' } } as unknown as AxiosResponse
      expect(interceptor.redactBinaryBody(body, response)).toEqual({
        contentType: 'application/octet-stream',
        byteLength: body.byteLength,
        bodyOmitted: true,
      })
    })

    it('should pass JSON bodies through unchanged', () => {
      const body = { LabOrders: [], LabResults: [] }
      const response = {
        headers: { 'content-type': 'application/json' },
        request: { method: 'GET' },
      } as unknown as AxiosResponse
      expect(interceptor.redactBinaryBody(body, response)).toBe(body)
    })
  })

  describe('handleResponse()', () => {
    it('should emit redacted raw_data for TRF/PDF downloads', () => {
      const clientMock = { emit: jest.fn() }
      const trfInterceptor = new AntechV6ApiInterceptor(
        {} as AntechV6ApiHttpService,
        clientMock as any,
      )
      const body = Buffer.from('%PDF-1.4 fake pdf content')
      const url = `${AntechV6Endpoints.GET_ORDER_TRF}/VOY-12345`
      const response = {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
        request: { method: 'GET', headers: {} },
        config: { data: undefined, metadata: {} },
      } as unknown as AxiosResponse

      // protected in the base class — invoked via cast, as the axios hook would
      ;(trfInterceptor as any).handleResponse(url, body, response)

      expect(clientMock.emit).toHaveBeenCalledWith(
        'raw_data',
        expect.objectContaining({
          url,
          body: {
            contentType: 'application/pdf',
            byteLength: body.byteLength,
            bodyOmitted: true,
          },
        }),
      )
    })
  })
})
