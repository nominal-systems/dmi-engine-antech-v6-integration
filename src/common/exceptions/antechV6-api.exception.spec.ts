import { AntechV6ApiException } from './antechV6-api.exception'

describe('AntechV6ApiException', () => {
  it('should extract detail from API error response', () => {
    const apiErrorResponse = {
      type: 'https://www.rfc-editor.org/rfc/rfc9110.html#status.400',
      message: 'Validation Failed',
      status: 400,
      detail: "PetWeight: 'PetWeight' must be greater than zero.",
      errorDetails: {
        PetWeight: ["'PetWeight' must be greater than zero."],
      },
      isSuccess: false,
      requestId: 'b62f12d4-dc8f-41b7-99de-265e87a7ba52',
    }

    const error = {
      status: 400,
      options: {
        value: apiErrorResponse,
      },
    }

    const exception = new AntechV6ApiException('Failed to place order', 400, error)

    expect(exception.errors).toContain("PetWeight: 'PetWeight' must be greater than zero.")
    expect(exception.statusCode).toBe(400)
  })

  it('should extract both Message and detail when both are present', () => {
    const error = {
      status: 400,
      options: {
        value: {
          Message: 'General validation error',
          detail: 'Specific field error',
        },
      },
    }

    const exception = new AntechV6ApiException('Failed', 400, error)

    expect(exception.errors).toContain('General validation error')
    expect(exception.errors).toContain('Specific field error')
  })
})
