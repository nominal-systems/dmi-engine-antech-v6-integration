import { AxiosInterceptor, isNullOrUndefinedOrEmpty } from '@nominal-systems/dmi-engine-common'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { AxiosResponse } from 'axios'
import { AntechV6Endpoints } from '../interfaces/antechV6-api.interface'
import { AntechV6ApiHttpService } from './antechV6-api-http.service'

const EXCLUDED_ENDPOINTS = [AntechV6Endpoints.LOGIN, AntechV6Endpoints.GET_SPECIES_AND_BREEDS]

export class AntechV6ApiInterceptor extends AxiosInterceptor {
  constructor(httpService: AntechV6ApiHttpService, client) {
    super(httpService, client)
    this.provider = PROVIDER_NAME
  }

  // TRF/PDF downloads (GET_ORDER_TRF) are binary bodies; emitting them as raw_data
  // stores them inline in the external_requests collection and fills the provider's
  // Cosmos logical partition (error 1014). Keep the audit record (url, status,
  // accession ids) but replace the body with a small stub.
  protected handleResponse(url: string, body: any, response: AxiosResponse): any {
    return super.handleResponse(url, this.redactBinaryBody(body, response), response)
  }

  public redactBinaryBody(body: any, response: AxiosResponse): any {
    const contentType = String(response.headers?.['content-type'] ?? '')
    const isBinary = Buffer.isBuffer(body) || body instanceof ArrayBuffer
    if (!isBinary && !contentType.includes('application/pdf')) {
      return body
    }

    return {
      contentType: contentType !== '' ? contentType : 'application/octet-stream',
      byteLength: isBinary ? body.byteLength : Buffer.byteLength(String(body), 'binary'),
      bodyOmitted: true,
    }
  }

  public filter(url: string, body: any, response: AxiosResponse): boolean {
    if (response.status >= 400) {
      return true
    }

    // Filter excluded endpoints
    if (EXCLUDED_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
      return false
    }

    // Filter empty status calls
    if (url.includes(AntechV6Endpoints.GET_STATUS)) {
      if (
        response.data['LabOrders'] !== undefined &&
        response.data['LabOrders'].length === 0 &&
        response.data['LabResults'] !== undefined &&
        response.data['LabResults'].length === 0
      ) {
        return false
      }
    }

    // Filter empty search results
    if (url.includes(AntechV6Endpoints.GET_ALL_RESULTS)) {
      if (response.data !== undefined && response.data.length === 0) {
        return false
      }
    }

    return true
  }

  public debug(url: string, body: any, response: AxiosResponse): boolean {
    return true
  }

  public extractAccessionIds(url: string, body: any, response: AxiosResponse): string[] {
    let accessionIds: string[] = []

    if (
      url.includes(AntechV6Endpoints.PLACE_PRE_ORDER) ||
      url.includes(AntechV6Endpoints.PLACE_ORDER)
    ) {
      const jsonData: any = JSON.parse(response.config.data)
      const clinicAccessionId: any = jsonData['ClinicAccessionID']
      if (!isNullOrUndefinedOrEmpty(clinicAccessionId)) {
        accessionIds = [clinicAccessionId]
      }
    } else if (url.includes(AntechV6Endpoints.GET_STATUS)) {
      accessionIds = [
        ...body.LabOrders.map((order) => order.ClinicAccessionID),
        ...body.LabResults.map((result) => result.ClinicAccessionID),
      ]
    } else if (url.includes(AntechV6Endpoints.ACKNOWLEDGE_STATUS)) {
      const jsonData: any = JSON.parse(response.config.data)
      accessionIds = jsonData['clinicAccessionIds']
    } else if (url.includes(AntechV6Endpoints.GET_ALL_RESULTS)) {
      accessionIds = body.map((result) => result.ClinicAccessionID)
    } else if (url.includes(AntechV6Endpoints.GET_ORDER_TRF)) {
      const clinicAccessionId: string = url.split('/').pop() || ''
      if (!isNullOrUndefinedOrEmpty(clinicAccessionId)) {
        accessionIds = [clinicAccessionId]
      }
    }

    return accessionIds
  }
}
