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

Removed `expiresAt` from required — same breaking change as the breaking-required-field scenario.
Here, a downstream recommendations contract imports search, which imports auth.jwt,
creating a 3-level chain that demonstrates transitive impact at depth 2.
