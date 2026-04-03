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
        type: string
      expiresAt:
        type: string
        format: date-time
      refreshToken:
        type: string
    required: [id, email, token, expiresAt]
---

# JWT Contract

Added optional `refreshToken` field — not in the required list.
This is a backwards-compatible addition: existing consumers are unaffected.
