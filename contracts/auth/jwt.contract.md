---
ferret:
  id: auth.jwt
  type: api
  shape:
    type: object
    properties:
      id:
        type: string
      email:
        type: string
        format: email
      token:
        type: integer
      expiresAt:
        type: string
        format: date-time
    required: [id, email, token, expiresAt]
---

# JWT Contract

Changed `token` field type from `string` to `integer` — this is a breaking change.
All consumers producing or consuming string tokens will fail at runtime.
