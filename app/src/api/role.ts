import { http } from './request'
import type {
  AssignPermissionsPayload,
  PageResult,
  RoleCreatePayload,
  RoleRead,
  RoleUpdatePayload,
  TableQuery,
} from './types'

/** 分页搜索角色：keyword 模糊匹配 name / code */
export function searchRoles(params: TableQuery) {
  return http.get<PageResult<RoleRead>>('/roles/search', { params })
}

/** 角色详情（含 permissions） */
export function getRole(roleId: number) {
  return http.get<RoleRead>(`/roles/${roleId}`)
}

/** 角色下拉选项：最多 100 条，无分页 */
export function listRoles() {
  return http.get<RoleRead[]>('/roles/')
}

/** 创建角色 */
export function createRole(payload: RoleCreatePayload) {
  return http.post<RoleRead>('/roles', payload)
}

/** 更新角色：只能改 name / description，code 不可修改 */
export function updateRole(roleId: number, payload: RoleUpdatePayload) {
  return http.put<RoleRead>(`/roles/${roleId}`, payload)
}

/** 删除角色（级联清空 user_roles / role_permission） */
export function deleteRole(roleId: number) {
  return http.delete<null>(`/roles/${roleId}`)
}

/** 给角色分配权限：全量替换语义，传 [] 即清空 */
export function assignRolePermissions(roleId: number, payload: AssignPermissionsPayload) {
  return http.put<RoleRead>(`/roles/${roleId}/permissions`, payload)
}
