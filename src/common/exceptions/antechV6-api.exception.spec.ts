import { HttpException } from '@nestjs/common'
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

  const POST_FAILED = 'Failed to POST https://antech.test/LabOrders/v6/Order'

  function errorsFor(body: unknown, status = 400): string[] {
    const error = { message: POST_FAILED, options: body }
    return new AntechV6ApiException('Failed to place order', status, error).errors
  }

  describe('every captured Antech envelope reaches the operator', () => {
    it.each([
      {
        shape: '401 bare text (bad password)',
        status: 401,
        body: 'Invalid User or Password',
        expected: ['Invalid User or Password'],
      },
      {
        shape: '404 lowercase `message` (unknown path)',
        status: 404,
        body: JSON.parse('{"statusCode":404,"message":"Resource not found"}'),
        expected: ['Resource not found'],
      },
      {
        shape: '400 problem+json `title` and `errors` (malformed serviceType)',
        status: 400,
        body: JSON.parse(
          '{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"ServiceType":["The Service Type is invalid. Please update and try again."]},"traceId":"00000000-0000-4000-8000-000000000001"}',
        ),
        expected: [
          'One or more validation errors occurred.',
          'ServiceType: The Service Type is invalid. Please update and try again.',
        ],
      },
      {
        shape: '400 bare JSON string (POC_FLAG=Z)',
        status: 400,
        body: JSON.parse('"POC_Flag:Z is not valid"'),
        expected: ['POC_Flag:Z is not valid'],
      },
      {
        shape: '401 lowercase `message` beside `errorDetails: {}` (no access token)',
        status: 401,
        body: JSON.parse(
          '{"type":"https://www.rfc-editor.org/rfc/rfc9110.html#status.401","message":"Access token is missing.","status":401,"errorDetails":{},"isSuccess":false,"requestId":"00000000-0000-4000-8000-000000000001"}',
        ),
        expected: ['Access token is missing.'],
      },
      {
        shape: '500 `ErrorMessage` (TRF for an unknown accession, also seen on placement)',
        status: 500,
        body: JSON.parse('{"StatusCode":500,"ErrorMessage":"Internal server error"}'),
        expected: ['Internal server error'],
      },
      {
        shape: '400 `value.Message` (placement rejection)',
        status: 400,
        body: JSON.parse(
          '{"value":{"Data":null,"StatusCode":0,"HttpStatusCode":400,"Message":"Invalid BreedId 370","InnerExceptionMessage":"","Error":null,"ClientData":null},"statusCode":400,"contentType":"application/json"}',
        ),
        expected: ['Invalid BreedId 370'],
      },
    ])('$shape: the generic line, then Antech’s wording', ({ status, body, expected }) => {
      expect(errorsFor(body, status)).toEqual([POST_FAILED, ...expected])
    })
  })

  it('a real HttpException as BaseApiService throws it (404 lowercase `message`): the body is read', () => {
    const error = new HttpException(
      POST_FAILED,
      404,
      JSON.parse('{"statusCode":404,"message":"Resource not found"}'),
    )

    const exception = new AntechV6ApiException('Failed to place order', 404, error)

    expect(exception.errors).toEqual([POST_FAILED, 'Resource not found'])
  })

  it('400 `message`, `detail` and `errorDetails`: lists message and detail, the repeated detail once', () => {
    const errors = errorsFor({
      type: 'https://www.rfc-editor.org/rfc/rfc9110.html#status.400',
      message: 'Validation Failed',
      status: 400,
      detail: 'POCValidation: POC validation errors: Only IHD order codes are supported.',
      errorDetails: {
        POCValidation: ['POC validation errors: Only IHD order codes are supported.'],
      },
      isSuccess: false,
      requestId: '00000000-0000-4000-8000-000000000001',
    })

    const detail = 'POCValidation: POC validation errors: Only IHD order codes are supported.'
    expect(errors).toContain('Validation Failed')
    expect(errors.filter((e) => e === detail).length).toBe(1)
  })

  it('field maps: a single-string field and a bare list of strings each become entries', () => {
    const errors = errorsFor({
      errors: { PetId: 'The PetId field is required.' },
      errorDetails: ['First reason', 'Second reason'],
    })

    expect(errors).toEqual([
      POST_FAILED,
      'PetId: The PetId field is required.',
      'First reason',
      'Second reason',
    ])
  })

  it('field lines in natural order: field by field, each field’s messages as sent', () => {
    const errors = errorsFor({
      errors: { PetName: ['is required', 'is too long'], Species: ['is unknown', 'is required'] },
    })

    expect(errors).toEqual([
      POST_FAILED,
      'PetName: is required',
      'PetName: is too long',
      'Species: is unknown',
      'Species: is required',
    ])
  })

  it('non-string values under a known key are ignored, not shown raw', () => {
    const errors = errorsFor({ status: 400, message: { nested: 'object' }, title: 'Bad Request' })

    expect(errors).toEqual([POST_FAILED, 'Bad Request'])
  })

  it('an array body: each string element, non-strings ignored', () => {
    expect(errorsFor(['First reason', 42, ' Second reason '])).toEqual([
      POST_FAILED,
      'First reason',
      'Second reason',
    ])
  })

  it('an object with none of the known keys is shown raw', () => {
    expect(errorsFor({ foo: 'bar', nested: { baz: 1 } })).toEqual([
      POST_FAILED,
      '{"foo":"bar","nested":{"baz":1}}',
    ])
  })

  describe('a long body is cut at 500 characters', () => {
    it('an unknown object shown raw', () => {
      const body = { foo: 'x'.repeat(2000) }

      const errors = errorsFor(body)

      expect(errors[1]).toHaveLength(501)
      expect(errors[1]).toBe(`${JSON.stringify(body).slice(0, 500)}…`)
    })

    it('a bare string', () => {
      const body = 'y'.repeat(2000)

      const errors = errorsFor(body)

      expect(errors[1]).toHaveLength(501)
      expect(errors[1]).toBe(`${body.slice(0, 500)}…`)
    })

    it('counted in code points, so an emoji at the cut is kept whole', () => {
      const body = `${'a'.repeat(499)}😀${'b'.repeat(100)}`

      const entry = errorsFor(body)[1]

      expect(entry.slice(-3)).toBe('😀…')
      expect(Array.from(entry)).toHaveLength(501)
    })
  })

  describe('at most 20 of Antech’s entries are kept, then `… and <n> more`', () => {
    it('an array body of 2,000 strings', () => {
      const body = Array.from({ length: 2000 }, (_, i) => `Reason ${i}`)

      const errors = errorsFor(body)

      expect(errors).toEqual([POST_FAILED, ...body.slice(0, 20), '… and 1980 more'])
    })

    it('an `errors` map of 2,000 fields', () => {
      const fields = Array.from({ length: 2000 }, (_, i) => [`Field${i}`, [`is invalid ${i}`]])

      const errors = errorsFor({ errors: Object.fromEntries(fields) })

      expect(errors).toHaveLength(22)
      expect(errors[1]).toBe('Field0: is invalid 0')
      expect(errors[20]).toBe('Field19: is invalid 19')
      expect(errors[21]).toBe('… and 1980 more')
    })

    it('a body of exactly 20 entries has no trailer', () => {
      const body = Array.from({ length: 20 }, (_, i) => `Reason ${i}`)

      expect(errorsFor(body)).toEqual([POST_FAILED, ...body])
    })

    it('repeats are dropped before counting: 2,000 copies of one message are one entry', () => {
      const body = Array.from({ length: 2000 }, () => 'The same reason')

      expect(errorsFor(body)).toEqual([POST_FAILED, 'The same reason'])
    })
  })

  it('no `options`: the body is read from `cause`', () => {
    const error = {
      message: POST_FAILED,
      options: undefined,
      cause: { ErrorMessage: 'from cause' },
    }

    const exception = new AntechV6ApiException('Failed to place order', 500, error)

    expect(exception.errors).toContain('from cause')
  })

  it('a real HttpException built with `{ cause: body }` (404): the body is read, not the wrapper', () => {
    const error = new HttpException(POST_FAILED, 404, {
      cause: JSON.parse('{"statusCode":404,"message":"Resource not found"}'),
    })

    const errors = new AntechV6ApiException('Failed to place order', 404, error).errors

    expect(errors).toContain('Resource not found')
    expect(errors.filter((e) => e.includes('"cause"'))).toEqual([])
  })

  it('`options: { cause: body }` beside `cause: body`, by hand (404): the body is read, not the wrapper', () => {
    const body = JSON.parse('{"statusCode":404,"message":"Resource not found"}')
    const error = { message: POST_FAILED, options: { cause: body }, cause: body }

    const errors = new AntechV6ApiException('Failed to place order', 404, error).errors

    expect(errors).toContain('Resource not found')
    expect(errors.filter((e) => e.includes('"cause"'))).toEqual([])
  })

  it('a real HttpException built with `{ cause: body, description }`: the body is read, not the wrapper', () => {
    const error = new HttpException(POST_FAILED, 404, {
      cause: JSON.parse('{"statusCode":404,"message":"Resource not found"}'),
      description: 'x',
    })

    const errors = new AntechV6ApiException('Failed to place order', 404, error).errors

    expect(errors).toEqual([POST_FAILED, 'Resource not found'])
  })

  describe('a vendor body with its own `cause` key is read whole, not just its `cause`', () => {
    it.each([
      {
        shape: '`Message` beside `cause`',
        body: { Message: 'Invalid BreedId 370', cause: 'Validation' },
        expected: ['Invalid BreedId 370'],
      },
      {
        shape: '`value.Message` beside a `cause` object',
        body: {
          value: { Message: 'Invalid BreedId 370' },
          statusCode: 400,
          cause: { source: 'LIMS' },
        },
        expected: ['Invalid BreedId 370'],
      },
      {
        shape: '`title` and `errors` beside `cause`',
        body: {
          title: 'One or more validation errors occurred.',
          errors: { PetName: ['required'] },
          cause: 'model binding',
        },
        expected: ['One or more validation errors occurred.', 'PetName: required'],
      },
    ])('400 $shape (a real HttpException)', ({ body, expected }) => {
      const error = new HttpException(POST_FAILED, 400, body)

      const errors = new AntechV6ApiException('Failed to place order', 400, error).errors

      expect(errors).toEqual([POST_FAILED, ...expected])
    })
  })

  it('an Error as `cause` (socket hang up, no `options`): its message only', () => {
    const error = { message: POST_FAILED, cause: new Error('socket hang up') }

    const exception = new AntechV6ApiException('Failed to place order', 500, error)

    expect(exception.errors).toEqual([POST_FAILED, 'socket hang up'])
  })

  it.each([
    { shape: 'no body at all', error: { message: POST_FAILED } },
    { shape: 'an undefined body', error: { message: POST_FAILED, options: undefined } },
    { shape: 'a null body', error: { message: POST_FAILED, options: null } },
    { shape: 'a blank string body', error: { message: POST_FAILED, options: '   ' } },
    { shape: 'an empty object body', error: { message: POST_FAILED, options: {} } },
    { shape: 'an empty array body', error: { message: POST_FAILED, options: [] } },
  ])('$shape: only the generic line', ({ error }) => {
    const exception = new AntechV6ApiException('Failed to place order', 500, error)

    expect(exception.errors).toEqual([POST_FAILED])
  })

  it.each([
    { shape: 'a number body (42)', body: 42, expected: '42' },
    { shape: 'a boolean body (true)', body: true, expected: 'true' },
    { shape: 'a falsy boolean body (false)', body: false, expected: 'false' },
  ])('$shape: shown as text', ({ body, expected }) => {
    expect(errorsFor(body)).toEqual([POST_FAILED, expected])
  })

  it('a Buffer body (an arraybuffer response) is decoded as UTF-8 text', () => {
    expect(errorsFor(Buffer.from('Service Unavailable'), 503)).toContain('Service Unavailable')
  })

  it('an ArrayBuffer body is decoded as UTF-8 text', () => {
    const bytes = Buffer.from('Service Unavailable')
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)

    expect(errorsFor(body, 503)).toContain('Service Unavailable')
  })

  it('errors already on the wrapped error come last: generic line, vendor message, earlier errors', () => {
    const error = { message: 'x', options: { message: 'm' }, _errors: ['earlier'] }

    const exception = new AntechV6ApiException('Failed to place order', 400, error)

    expect(exception.errors).toEqual(['x', 'm', 'earlier'])
  })

  it('statusCode is the status it was constructed with (503)', () => {
    const exception = new AntechV6ApiException('Failed to place order', 503, {
      message: POST_FAILED,
      options: 'Service Unavailable',
    })

    expect(exception.statusCode).toBe(503)
  })
})
