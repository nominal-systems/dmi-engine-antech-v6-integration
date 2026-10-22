import { RpcException } from '@nestjs/microservices'

// `errors` goes back to the PIMS that placed the order and is shown to its user, so what Antech
// sent is bounded: each vendor entry (a raw body in particular) is cut to a length a person can
// read, and at most MAX_ENTRIES of them are kept.
const MAX_BODY_CHARS = 500
const MAX_ENTRIES = 20

export class AntechV6ApiException extends RpcException {
  private _errors: string[] = []
  private _statusCode: number = 500

  constructor(message: string, statusCode: number, error: any) {
    super(message)
    this._statusCode = statusCode

    // The generic line, then Antech's messages (repeats dropped before they count against the cap),
    // then any errors already on the wrapped error.
    const errors = [
      ...(error?.message !== undefined ? [error.message] : []),
      ...capped([...new Set(vendorMessages(readBody(error)))]),
      ...(Array.isArray(error?._errors) ? error._errors : []),
    ]
    this._errors = [...new Set(errors)]
  }

  public get statusCode(): number {
    return this._statusCode
  }

  public get errors(): string[] {
    return this._errors
  }
}

// Where the vendor's response body is. dmi-engine-common's BaseApiService passes the body itself
// (`error.response?.data`) as HttpException's third argument, which Nest keeps in `options`. Were it
// ever passed as `{ cause: body }` instead, `options` would be that wrapper, recognised by its shape.
// `cause` alone is read only when there are no `options`: Nest also copies a truthy `cause` key of
// the body into `error.cause`, and a vendor body's own `cause` is never promoted over the body.
function readBody(error: any): unknown {
  const options = error?.options
  if (options === undefined) {
    return error?.cause
  }
  if (isCauseWrapper(options)) {
    return options.cause
  }
  return options
}

// Nest's own HttpException options: `{ cause }`, optionally with `description`, and nothing else.
function isCauseWrapper(options: unknown): options is { cause: unknown } {
  if (!isObject(options)) {
    return false
  }
  const keys = Object.keys(options)
  return keys.includes('cause') && keys.every((key) => key === 'cause' || key === 'description')
}

// What Antech said, as one entry per message. Antech answers errors in several envelopes (bare
// text, RFC 9110 problem+json, `{ statusCode, message }`, `{ StatusCode, ErrorMessage }`, a
// `{ value: { Message } }` wrapper, ...), so an object is searched for the keys they use, in any
// case. A non-empty body with nothing recognisable is shown raw, so an envelope nobody has seen yet
// still reaches the operator.
function vendorMessages(body: unknown): string[] {
  const bytes = body instanceof ArrayBuffer ? Buffer.from(body) : body
  const decoded = Buffer.isBuffer(bytes) ? bytes.toString('utf8') : bytes

  if (typeof decoded === 'string') {
    return text(decoded).map(truncate)
  }
  // A number or a boolean is shown as text; `null` and `undefined` give nothing.
  if (typeof decoded === 'number' || typeof decoded === 'boolean') {
    return [String(decoded)]
  }
  // Nest documents `cause` as an Error, whose `message` is not an enumerable key: read it directly.
  if (decoded instanceof Error) {
    return text(decoded.message).map(truncate)
  }
  if (!Array.isArray(decoded) && !isObject(decoded)) {
    return []
  }
  // `{}` and `[]` say nothing.
  if (Object.keys(decoded).length === 0) {
    return []
  }
  // An object under `value` is read like the body itself, one level deep and no further.
  const found = Array.isArray(decoded)
    ? decoded.flatMap(text)
    : [decoded, ...pick(decoded, 'value').filter(isObject)].flatMap(objectMessages)
  return (found.length > 0 ? found : [raw(decoded)]).map(truncate)
}

// One object level: `title`, `message`, `errorMessage`, `detail`, then the field maps `errors` and
// `errorDetails`, each key matched case-insensitively.
function objectMessages(obj: Record<string, unknown>): string[] {
  return [
    ...['title', 'message', 'errormessage', 'detail'].flatMap((name) =>
      pick(obj, name).flatMap(text),
    ),
    ...['errors', 'errordetails'].flatMap((name) => pick(obj, name).flatMap(fieldMessages)),
  ]
}

// The values of `obj`'s keys that match `name`, given in lower case, in any case: `message` finds
// `message`, `Message` and `MESSAGE`.
function pick(obj: Record<string, unknown>, name: string): unknown[] {
  return Object.keys(obj)
    .filter((key) => key.toLowerCase() === name)
    .map((key) => obj[key])
}

// A validation map: `{ Field: ['why', ...] }` or `{ Field: 'why' }` gives `Field: why` per message,
// field by field and each field's messages in order; a plain list of strings gives each string.
function fieldMessages(map: unknown): string[] {
  if (Array.isArray(map)) {
    return map.flatMap(text)
  }
  if (!isObject(map)) {
    return []
  }
  return Object.entries(map).flatMap(([field, messages]) =>
    (Array.isArray(messages) ? messages : [messages])
      .flatMap(text)
      .map((message) => `${field}: ${message}`),
  )
}

// A non-blank string, trimmed; anything else is not a message.
function text(value: unknown): string[] {
  return typeof value === 'string' && value.trim() !== '' ? [value.trim()] : []
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function raw(body: unknown): string {
  try {
    return JSON.stringify(body) ?? String(body)
  } catch {
    // A cyclic object cannot be serialised.
    return String(body)
  }
}

// At most MAX_ENTRIES entries; when more were found, a last entry says how many were left out.
function capped(entries: string[]): string[] {
  if (entries.length <= MAX_ENTRIES) {
    return entries
  }
  return [...entries.slice(0, MAX_ENTRIES), `… and ${entries.length - MAX_ENTRIES} more`]
}

// Counted in code points, so a character outside the BMP (an emoji) is never split in half.
function truncate(entry: string): string {
  const chars = Array.from(entry)
  return chars.length > MAX_BODY_CHARS ? `${chars.slice(0, MAX_BODY_CHARS).join('')}…` : entry
}
