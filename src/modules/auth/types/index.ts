export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  accountType: "LOCAL" | "GOOGLE" | "GITHUB";
  roleId: number;
}

export interface AuthToken {
  accessToken: string;
}
