/**
 * # 10x - Information:
 * - 100: Continue
 * - 101: Switching protocols
 * - 102: Processing.
 * - 103: Early hints.
 * 
 * # 2xx - Success:
 * - 200: Oke
 * - 201: Created.
 * - 202: Accepted.
 * - 203: Non-Authorative information.
 * - 204: No content
 * - 205: Reset Content.
 * - 206: Partial content.
 * - 207: Multi-Status (WebDAV)
 * - 208: Already Reported (WebDAV)
 * - 226: IM Used (HTTP Delta Encoding)
 * 
 * # 30x - Redirection: 
 * - 300: multiple Choices.
 * - 301: Moved Permanently 
 * - 302: Found 
 * - 303: See Other
 * - 304: Not modified
 * - 305: Use Proxy.
 * - 306: Unused.
 * - 307: Temporary Redirect.
 * - 308: Permanent Redirect.
 * 
 * # 40x - Client error 
 * - 400: Bad Request.
 * - 401: Unauthorized 
 * - 402: Payment required
 * - 403: Forbidden.
 * - 404: Not Found.
 * - 405: Method Not Allowed.
 * - 406: Not Acceptable.
 * 
 * # 4xx(+10n) - Client (continue)
 * - 407: Proxy Authentication Required.
 * - 408: Request Timeout.
 * - 409: Conflict.
 * - 410: Gone.
 * - 411: Length Required.
 * - 412: Precondition failed.
 * - 413: Payload too large.
 * - 414: URI to large.
 * - 415: Unsupported Media Type.
 * - 416: Range not satisfiable.
 * - 417: Exception failed.
 * - 418: I'm a teapot.
 * - 421: Misdirected Request.
 * - 422: Unprocessable Entity (WebDAV)
 * - 423: Locked (WebDAV)
 * - 424: Failed Dependency (WebDAV)
 * - 425: Too Early.
 * - 426: Upgrade Required.
 * - 428: Precondition Required.
 * - 429: Too Many Requests.
 * - 431: Request Header Fields Too Large.
 * - 451: Unavailable for Legal Reasons.
 * - 499: Client Closed Request
 * 
 * # 5xx - Server error responses
 * - 500: Internal Server Error.
 * - 501: Not implemented.
 * - 502: Bad Gateway.
 * - 503: Service Unavailable
 * - 504: Gateway Timeout.
 * - 505: HTTP Version Not Supported.
 * - 507: Inusfficient Storage (WebDAV)
 * - 508: Loop Detected (WebDAV)
 * - 510: Not Extended.
 * - 511: Network Authentication Required.
 * - 599: Network Connect Timeout Error.
 */
export type IHTTPStatusCode = 
    100 | 101 | 102 | 103
    | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
    | 300 | 301 | 302 | 303  | 304 | 305 | 306 | 307 | 308
    | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 499
    | 500 | 501 | 502 | 504 | 505 | 507 | 508 | 510 | 511 | 599;