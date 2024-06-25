import { RpcException } from '@nestjs/microservices'

export class AntechV6ApiException extends RpcException {
  private _errors: string[] = []
  private _statusCode: number = 500

  constructor(message: string, statusCode: number, error: any) {
    super(message)
    this._statusCode = statusCode

    if (error._errors !== undefined) {
      this._errors = error._errors
    }

    if (error.options !== undefined && typeof error.options === 'string') {
      this._errors.unshift(error.options)
    }

    if (error.options?.value?.Message !== undefined) {
      this._errors.unshift(error.options?.value?.Message)
    }

    if (error.message !== undefined) {
      this._errors.unshift(error.message)
    }
  }

  public get statusCode(): number {
    return this._statusCode
  }

  public get errors(): string[] {
    return this._errors
  }
}
