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
      scope:
        type: string
    required: [id, email, token, expiresAt, scope]
---

# JWT Contract

Added `scope` to the required list — this is a breaking change.
Existing consumers do not currently send `scope` in their JWT payloads.
Any consumer that validated against the previous contract shape will now fail.
