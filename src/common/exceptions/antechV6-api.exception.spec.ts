import { AntechV6ApiException } from './antechV6-api.exception'

describe('AntechV6ApiException', () => {
  it('should extract detail from HttpException options', () => {
    const error = {
      message: 'Failed to POST https://Api-pims.antechdiagnostics.com/LabOrders/v6/Order',
      options: {
        type: 'https://www.rfc-editor.org/rfc/rfc9110.html#status.400',
        message: 'Validation Failed',
        status: 400,
        detail: 'POCValidation: POC validation errors: Only IHD order codes are supported.',
        errorDetails: {
          POCValidation: ['POC validation errors: Only IHD order codes are supported.'],
        },
        isSuccess: false,
        requestId: 'd6d8a10a-f634-43a3-9bdc-d7447940e053',
      },
    }

    const exception = new AntechV6ApiException('Failed to place order', 400, error)

    expect(exception.errors).toContain(
      'POCValidation: POC validation errors: Only IHD order codes are supported.',
    )
    expect(exception.statusCode).toBe(400)
  })

  it('should extract both Message and detail when both are present', () => {
    const error = {
      options: {
        Message: 'General validation error',
        detail: 'Specific field error',
      },
    }

    const exception = new AntechV6ApiException('Failed', 400, error)

    expect(exception.errors).toContain('General validation error')
    expect(exception.errors).toContain('Specific field error')
  })

  it('should extract validation errors from errors object format', () => {
    const error = {
      message: 'Failed to POST https://Api-pims.antechdiagnostics.com/LabOrders/v6/Order',
      options: {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          PetWeightUnits: ['The PetWeightUnits field is required.'],
        },
        traceId: '00-aa886e2d1eda6053422196184331be66-6e96804a20b7bf0e-01',
      },
    }

    const exception = new AntechV6ApiException('Failed to place order', 400, error)

    expect(exception.errors).toContain('PetWeightUnits: The PetWeightUnits field is required.')
    expect(exception.errors).toContain('One or more validation errors occurred.')
  })

  it('should extract Message from nested value object (500 errors)', () => {
    const error = {
      message: 'Failed to POST https://api.healthtracks.com/LabOrders/v6/PreOrderPlacement',
      options: {
        value: {
          Data: null,
          StatusCode: 0,
          HttpStatusCode: 500,
          Message: 'Internal server error',
          InnerExceptionMessage: '',
          Error: null,
          ClientData: null,
        },
        statusCode: 500,
        contentType: 'application/json',
      },
    }

    const exception = new AntechV6ApiException('Failed to place order', 500, error)

    expect(exception.errors).toContain('Internal server error')
    expect(exception.statusCode).toBe(500)
  })
})
