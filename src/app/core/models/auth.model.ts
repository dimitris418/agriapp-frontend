export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface AuthenticationResponse {
  firstname: string;
  lastname: string;
  token: string;
}

export interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
  iat: number;
}
