import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Observable } from 'rxjs'
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

@Injectable()
export class AxiosInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AxiosInterceptor.name)

  constructor(private readonly httpService: HttpService) {
    this.applyLoggingInterceptor()
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
  }

  private applyLoggingInterceptor(): void {
    const axios = this.httpService.axiosRef
    axios.interceptors.request.use(
      (request: InternalAxiosRequestConfig) => {
        return request
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.verbose(
          `${response.request.method} ${response.request.protocol}//${response.request.host}${response.request.path} -> ${response.status}`
        )
        return response
      },
      (error) => {
        // Log any response error
        this.logger.error('HTTP Response error:', error)
        return Promise.reject(error)
      }
    )
  }
}
