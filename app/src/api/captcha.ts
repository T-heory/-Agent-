import { http } from './request'
import type { CaptchaRead, CaptchaVerifyPayload } from './types'

/** 获取图形验证码（key + base64 图片，有效期 5 分钟，一次性） */
export function getCaptcha() {
  return http.get<CaptchaRead>('/captcha')
}

/** 独立校验验证码。登录流程内部已校验，前端一般不需要调用 */
export function verifyCaptcha(payload: CaptchaVerifyPayload) {
  return http.post<boolean>('/captcha', payload)
}
