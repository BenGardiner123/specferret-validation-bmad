// Code-first extraction demo
// This file is referenced by contracts/auth/jwt.contract.md via codeFile.
// In Phase 5, ferret will extract the shape directly from this TypeScript type.
export interface JwtPayload {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
}
