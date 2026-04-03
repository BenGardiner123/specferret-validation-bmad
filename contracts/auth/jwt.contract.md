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
    required: [id, email, token]
---

# JWT Contract

Removed `expiresAt` from the required list — this is a breaking change.
Consumers may rely on `expiresAt` being present in every token response.
