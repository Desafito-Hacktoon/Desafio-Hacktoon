export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nomeCompleto?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  nomeCompleto?: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}


