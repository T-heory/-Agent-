import { http } from './request'
import type {
  PageResult,
  PermissionCreatePayload,
  PermissionRead,
  PermissionUpdatePayload,
  TableQuery,
} from './types'

/** 分页搜索权限：keyword 模糊匹配 code / name */
export function searchPermissions(params: TableQuery) {
  return http.get<PageResult<PermissionRead>>('/permission/search', { params })
}

/** 全部权限（最多 100 条，无分页），用于角色分配权限弹窗 */
export function listPermissions() {
  return http.get<PermissionRead[]>('/permission/')
}

/** 权限详情 */
export function getPermission(permissionId: number) {
  return http.get<PermissionRead>(`/permission/${permissionId}`)
}

/** 创建权限 */
export function createPermission(payload: PermissionCreatePayload) {
  return http.post<PermissionRead>('/permission/', payload)
}

/** 更新权限：name 必填，code 不可修改 */
export function updatePermission(permissionId: number, payload: PermissionUpdatePayload) {
  return http.put<PermissionRead>(`/permission/${permissionId}`, payload)
}

/** 删除权限 */
export function deletePermission(permissionId: number) {
  return http.delete<null>(`/permission/${permissionId}`)
}
