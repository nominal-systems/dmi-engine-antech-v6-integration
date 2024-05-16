import { AxiosInterceptor } from '@nominal-systems/dmi-engine-common'
import { HttpService } from '@nestjs/axios'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { AxiosResponse } from 'axios'
import { AntechV6Endpoints } from '../interfaces/antechV6-api.interface'

const EXCLUDED_ENDPOINTS = [
  AntechV6Endpoints.LOGIN,
  AntechV6Endpoints.GET_TEST_GUIDE,
  AntechV6Endpoints.GET_SPECIES_AND_BREEDS
]

export class AntechV6ApiInterceptor extends AxiosInterceptor {
  constructor(httpService: HttpService, client) {
    super(httpService, client)
    this.provider = PROVIDER_NAME
  }

  public filter(url: string, body: any, response: AxiosResponse): boolean {
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
    // TODO(gb): remove when access token caching is implemented: https://github.com/nominal-systems/dmi-engine-antech-v6-integration/issues/2
    if (url.includes(AntechV6Endpoints.LOGIN)) {
      return false
    }

    return true
  }
}
