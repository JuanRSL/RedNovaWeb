export interface User {
  id?: string;
  _id?: string;
  username: string;
  email: string;
  roles?: string[];
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}