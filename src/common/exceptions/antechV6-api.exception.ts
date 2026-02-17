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

    if (error.options?.detail !== undefined) {
      this._errors.unshift(error.options.detail)
    }

    if (error.options?.Message !== undefined) {
      this._errors.unshift(error.options.Message)
    }

    if (error.options?.errors !== undefined && typeof error.options.errors === 'object') {
      for (const [field, messages] of Object.entries(error.options.errors)) {
        if (Array.isArray(messages)) {
          for (const msg of messages) {
            this._errors.unshift(`${field}: ${msg}`)
          }
        }
      }
    }

    if (error.options?.title !== undefined) {
      this._errors.unshift(error.options.title)
    }

    if (error.options?.value?.Message !== undefined) {
      this._errors.unshift(error.options?.value?.Message)
    }

    if (error.options?.value?.detail !== undefined) {
      this._errors.unshift(error.options?.value?.detail)
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
