---
ferret:
  id: auth.jwt
  type: api
  shape:
    type: object
    properties:
      expiresAt:
        type: string
        format: date-time
      token:
        type: string
      email:
        type: string
        format: email
      id:
        type: string
    required: [id, email, token, expiresAt]
---

# JWT Contract

Properties reordered (expiresAt first, then token, email, id).
Zero semantic change — ferret hashSchema uses key-sorted canonical JSON so
property ordering noise produces identical hashes.
Asserts exit 0 and clean drift class.
