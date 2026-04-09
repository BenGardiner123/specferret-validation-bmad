// @ferret-contract: auth.jwt api
export interface JwtPayload {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
}
