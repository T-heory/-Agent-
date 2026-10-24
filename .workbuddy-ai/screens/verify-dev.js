/**
 * 前端联调脚本（临时验证用，不属于交付物）
 * 验证码从 Redis 直接读（captcha:{key}），避免 OCR 误差，保证流程可重复。
 */
const { chromium } = require('playwright-core')
const net = require('net')
const fs = require('fs')

const OUT = 'E:/-Agent-/.workbuddy-ai/screens/dev'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function redisGet(key) {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host: '127.0.0.1', port: 6379 }, () => {
      sock.write(`GET ${key}\r\n`)
    })
    let buf = ''
    sock.on('data', (d) => (buf += d.toString()))
    sock.on('error', reject)
    setTimeout(() => {
      sock.end()
      const lines = buf.split('\r\n')
      resolve(lines[1] ?? '')
    }, 400)
  })
}

const steps = []
async function step(name, fn) {
  try {
    await fn()
    steps.push('OK   ' + name)
  } catch (e) {
    steps.push('FAIL ' + name + ' :: ' + String(e).split('\n')[0])
    try {
      await globalThis.__page.screenshot({ path: `${OUT}/fail-${steps.length}.png` })
    } catch {}
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  globalThis.__page = page

  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('[console] ' + m.text())
  })
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message))

  let captchaKey = ''
  page.on('response', async (res) => {
    if (res.url().includes('/api/v1/captcha') && res.request().method() === 'GET') {
      try {
        const body = await res.json()
        if (body?.data?.key) captchaKey = body.data.key
      } catch {}
    }
  })

  await step('打开登录页', async () => {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
    await page.waitForSelector('.login-captcha__image img')
    await page.screenshot({ path: OUT + '/01-login.png' })
  })

  await step('登录', async () => {
    for (let i = 0; i < 20 && !captchaKey; i++) await sleep(200)
    const code = await redisGet('captcha:' + captchaKey)
    console.log('captcha key =', captchaKey, 'code =', code)
    await page.fill('input[autocomplete="username"]', 'qa_demo')
    await page.fill('input[autocomplete="current-password"]', '123456')
    await page.fill('.login-captcha__input input', code)
    await page.click('.login-form__submit')
    await page.waitForURL('**/dashboard', { timeout: 8000 })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: OUT + '/02-dashboard.png' })
    const stats = await page.locator('.stat-card__value').allInnerTexts()
    console.log('dashboard stats =', JSON.stringify(stats))
    console.log('token in localStorage =', await page.evaluate(() => !!localStorage.getItem('cg_token')))
  })

  await step('用户管理列表', async () => {
    await page.goto(BASE + '/system/users', { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    await page.screenshot({ path: OUT + '/03-users.png' })
    console.log('user rows =', await page.locator('.el-table__body tr').count())
  })

  await step('新建用户', async () => {
    await page.click('button:has-text("新建用户")')
    await page.waitForTimeout(500)
    await page.screenshot({ path: OUT + '/04-user-create.png' })
    await page.fill('.el-dialog input[placeholder="3~20 位字母、数字或下划线"]', 'qa_ui_user')
    await page.fill('.el-dialog input[placeholder="用于登录与通知"]', 'qa_ui_user@example.com')
    const pwdInputs = page.locator('.el-dialog input[type="password"]')
    await pwdInputs.nth(0).fill('123456')
    await pwdInputs.nth(1).fill('123456')
    await page.click('.el-dialog__footer button:has-text("创建")')
    await page.waitForTimeout(2200)
    await page.screenshot({ path: OUT + '/05-user-created.png' })
    console.log('rows after create =', await page.locator('.el-table__body tr').count())
  })

  await step('用户详情抽屉', async () => {
    await page.locator('.el-table__body tr').last().locator('button:has-text("详情")').click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: OUT + '/06-user-detail.png' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  await step('分配角色弹窗', async () => {
    await page.locator('.el-table__body tr').last().locator('button:has-text("分配角色")').click()
    await page.waitForTimeout(1300)
    await page.screenshot({ path: OUT + '/07-user-assign.png' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  await step('删除用户', async () => {
    await page.locator('.el-table__body tr').last().locator('button:has-text("删除")').click()
    await page.waitForTimeout(700)
    await page.screenshot({ path: OUT + '/08-user-delete-confirm.png' })
    await page.click('.el-message-box__btns button:has-text("确认删除")')
    await page.waitForTimeout(1800)
    console.log('rows after delete =', await page.locator('.el-table__body tr').count())
    await page.screenshot({ path: OUT + '/09-users-after-delete.png' })
  })

  await step('角色管理', async () => {
    await page.goto(BASE + '/system/roles', { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    await page.screenshot({ path: OUT + '/10-roles.png' })
  })

  await step('分配权限弹窗', async () => {
    await page.locator('.el-table__body tr').first().locator('button:has-text("分配权限")').click()
    await page.waitForTimeout(1300)
    await page.screenshot({ path: OUT + '/11-role-permissions.png' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  await step('角色编辑弹窗', async () => {
    await page.locator('.el-table__body tr').first().locator('button:has-text("编辑")').click()
    await page.waitForTimeout(700)
    await page.screenshot({ path: OUT + '/12-role-edit.png' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  await step('权限管理', async () => {
    await page.goto(BASE + '/system/permissions', { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    await page.screenshot({ path: OUT + '/13-permissions.png' })
  })

  await step('权限编辑弹窗', async () => {
    await page.locator('.el-table__body tr').first().locator('button:has-text("编辑")').click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: OUT + '/14-permission-edit.png' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  await step('个人中心', async () => {
    await page.goto(BASE + '/profile', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: OUT + '/15-profile.png' })
  })

  await step('404 页', async () => {
    await page.goto(BASE + '/not-exist-page', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    await page.screenshot({ path: OUT + '/16-404.png' })
  })

  await step('刷新保持登录 + 未登录跳转', async () => {
    await page.goto(BASE + '/system/roles', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    console.log('reload keeps url =', page.url())
    await page.evaluate(() => localStorage.removeItem('cg_token'))
    await page.goto(BASE + '/system/users', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    console.log('after clearing token url =', page.url())
    await page.screenshot({ path: OUT + '/17-redirect-login.png' })
  })

  console.log('\n=== STEPS ===')
  steps.forEach((s) => console.log(s))
  console.log('\nCONSOLE_ERRORS:', JSON.stringify(errors, null, 1))
  await browser.close()
}

main().catch((e) => {
  console.error('SCRIPT_FAILED', e)
  process.exit(1)
})
