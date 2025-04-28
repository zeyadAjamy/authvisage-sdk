export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface User {
  id: string;
  email: string;
  fullname: string;
}
