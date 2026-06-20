import client from './client'
import type { Result } from './client'

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    client.post<Result<unknown>>('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    client.post<Result<{ token: string; userId: number; username: string }>>('/auth/login', data),
  me: () => client.get<Result<{ id: number; username: string; email: string; status: string }>>('/auth/me'),
}