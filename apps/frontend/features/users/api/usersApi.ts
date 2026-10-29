import { api } from '@/lib/api-client'
import {
  type CreateUserRequest,
  CreateUserRequestSchema,
  type UpdateUserRequest,
  UpdateUserRequestSchema,
  UserListSchema,
  UserSchema,
} from '@/features/users/schemas'

export async function getUsers() {
  const res = await api.get('/users')
  return UserListSchema.parse(res.data)
}

export async function getUser(id: string) {
  const res = await api.get(`/users/${id}`)
  return UserSchema.parse(res.data)
}

export async function createUser(request: CreateUserRequest) {
  const res = await api.post('/users', CreateUserRequestSchema.parse(request))
  return UserSchema.parse(res.data)
}

export async function updateUser(id: string, request: UpdateUserRequest) {
  const res = await api.patch(`/users/${id}`, UpdateUserRequestSchema.parse(request))
  return UserSchema.parse(res.data)
}
