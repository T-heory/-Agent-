import { http } from './request'
import type {
  AssignRolesPayload,
  PageResult,
  RoleRead,
  TableQuery,
  UserCreatePayload,
  UserRead,
  UserWithRoles,
} from './types'

/** 分页搜索用户：keyword 模糊匹配 username / email */
export function searchUsers(params: TableQuery) {
  return http.get<PageResult<UserRead>>('/users/search', { params })
}

/** 创建用户 */
export function createUser(payload: UserCreatePayload) {
  return http.post<UserRead>('/users', payload)
}

/** 用户详情（含 roles） */
export function getUser(userId: number) {
  return http.get<UserWithRoles>(`/users/${userId}`)
}

/**
 * 用户角色列表。
 * 后端 response_model 曾误声明为 RoleRead（实际返回数组），这里按数组解析。
 */
export function getUserRoles(userId: number) {
  return http.get<RoleRead[]>(`/users/${userId}/roles`)
}

/** 给用户分配角色：全量替换语义，传 [] 即清空 */
export function assignUserRoles(userId: number, payload: AssignRolesPayload) {
  return http.put<UserWithRoles>(`/users/${userId}/roles`, payload)
}

/** 删除用户（后端不校验存在性，不存在也返回 200） */
export function deleteUser(userId: number) {
  return http.delete<boolean>(`/users/${userId}`)
}

/** 当前登录用户 */
export function getCurrentUser() {
  return http.get<UserRead>('/users/me')
}
