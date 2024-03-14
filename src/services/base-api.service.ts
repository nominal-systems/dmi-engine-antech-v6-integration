import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { firstValueFrom, Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { HttpException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'

export class BaseApiService {
  constructor(private readonly http: HttpService) {}

  async get<T>(
    url: string,
    config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ): Promise<T> {
    const observable: Observable<T> = this.http.get<T>(url, config).pipe(
      map((response: AxiosResponse) => {
        return response.data
      }),
      catchError((error) => {
        const status = error.response?.status ?? 500
        throw new HttpException(`Failed to GET ${url}`, status)
      })
    )

    return firstValueFrom(observable)
  }

  async post<T>(
    url: string,
    data: any,
    config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ): Promise<T> {
    const observable: Observable<T> = this.http.post<T>(url, data, config).pipe(
      map((response: AxiosResponse) => {
        return response.data
      }),
      catchError((error) => {
        const status = error.response?.status ?? 500
        throw new HttpException(`Failed to POST ${url}`, status)
      })
    )

    return firstValueFrom(observable)
  }
}
