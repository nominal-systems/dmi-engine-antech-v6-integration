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
        const res: any = error.response
        const url: string = `${res.request.protocol}//${res.request.host}${res.request.path}`
        this.logger.warn(
          `${res.request.method} ${url} -> ${res.status} ${res?.statusText} (${this.getErrorMessage(error)})`
        )
        return Promise.reject(error)
      }
    )
  }

  private getErrorMessage(error: any): string {
    let message = 'An error occurred while processing the request'

    if (error.message !== undefined) {
      message = error.message
    }

    if (error.response?.data !== undefined) {
      message = error.response.data.title

      if (error.response.data.errors !== undefined) {
        message += ` ${JSON.stringify(error.response.data.errors, null, 0)}`
      }
    }

    return message
  }
}
