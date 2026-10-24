/**
 * 统一提示封装。
 * 之所以包一层：ElMessage / ElMessageBox 是"函数式"组件，必须同时引入样式，
 * 否则在按需引入模式下弹出来的消息框是没有样式的裸文字。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

/** 后端异常响应体（业务异常形态） */
export interface BizBody {
  code?: number | string
  message?: string
}

/**
 * 把后端响应体转成一句人话。
 * 兜底逻辑对应说明书 13 章 P1-1：RoleService 里 BizException(f"...") 位置参数错位，
 * 会让 code 变成中文文案、message 恒为「业务异常」，此时必须把 code 当文案用。
 */
export function resolveMessage(body?: BizBody | null, fallback = '操作失败，请稍后重试'): string {
  if (!body) return fallback
  const { code, message } = body
  if (typeof code === 'string' && code.trim()) return code.trim()
  if (message && message !== '业务异常' && message !== 'success') return message
  return fallback
}

export function showSuccess(message: string): void {
  ElMessage.success({ message, duration: 2000 })
}

export function showError(message: string): void {
  ElMessage.error({ message, duration: 3000 })
}

export function showWarning(message: string): void {
  ElMessage.warning({ message, duration: 3000 })
}

/**
 * 危险操作二次确认。用户点「取消」/关闭时 ElMessageBox 会 reject，
 * 这里统一吞掉异常并返回 false，调用方只关心布尔值。
 */
export async function confirmDanger(
  message: string,
  options: { title?: string; confirmText?: string } = {},
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, options.title ?? '操作确认', {
      type: 'warning',
      confirmButtonText: options.confirmText ?? '确认删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      closeOnClickModal: false,
      draggable: true,
    })
    return true
  } catch {
    return false
  }
}
