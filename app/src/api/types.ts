/**
 * 与后端 Pydantic schema 一一对应的类型定义。
 * 字段名一律 snake_case（后端不转驼峰），禁止在这里随意扩展后端没有的字段。
 */

/** 统一响应体：所有接口（含 DELETE）都返回这个结构 */
export interface ApiResponse<T = unknown> {
  /** 业务码。正常 200；异常见 BizException。注意 RoleService 的缺陷会让它变成中文串 */
  code: number | string
  message: string
  data: T
}

/** 分页结果：字段名固定 items / total / page / page_size */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/** 分页请求参数 */
export interface PageQuery {
  page?: number
  page_size?: number
  keyword?: string
}

/** 列表页实际发出的查询参数（分页必传，避免依赖后端默认值不一致的坑） */
export interface TableQuery {
  page: number
  page_size: number
  keyword?: string
}

/* ---------------- 验证码 / 认证 ---------------- */

export interface CaptchaRead {
  /** 验证码唯一标识，登录时原样回传（不含 captcha: 前缀） */
  key: string
  /** data:image/png;base64,... 可直接用于 <img src> */
  image: string
}

export interface CaptchaVerifyPayload {
  key: string
  code: string
}

export interface LoginPayload {
  username: string
  password: string
  captcha_key: string
  captcha_code: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

/* ---------------- 用户 ---------------- */

export interface UserRead {
  id: number
  username: string
  email: string
  is_active: boolean
}

export interface UserCreatePayload {
  username: string
  email: string
  password: string
}

/** 用户详情（GET /users/{id}）会带出 roles */
export interface UserWithRoles extends UserRead {
  roles: RoleRead[]
}

export interface AssignRolesPayload {
  role_ids: number[]
}

/* ---------------- 角色 ---------------- */

export interface RoleRead {
  id: number
  code: string
  name: string
  description: string | null
  /** 列表接口也会带出（lazy=selectin），可直接算「权限数」 */
  permissions: PermissionRead[]
}

export interface RoleCreatePayload {
  code: string
  name: string
  description?: string | null
}

/** 注意：后端 RoleUpdate 没有 code 字段，角色编码创建后不可修改 */
export interface RoleUpdatePayload {
  name?: string | null
  description?: string | null
}

export interface AssignPermissionsPayload {
  permission_ids: number[]
}

/* ---------------- 权限 ---------------- */

export interface PermissionRead {
  id: number
  code: string
  name: string
  description: string | null
}

export interface PermissionCreatePayload {
  code: string
  name: string
  description?: string | null
}

/** 注意：后端 PermissionUpdate.name 是必填 str，更新时必须始终携带 */
export interface PermissionUpdatePayload {
  name: string
  description?: string | null
}
