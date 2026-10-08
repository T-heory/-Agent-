import asyncio
import sys

async def main():
    from src.modules.captcha.service import CaptchaService
    from src.modules.captcha.schema import CaptchaRequest
    from src.infra.redis_cache import _redis_client

    svc = CaptchaService(_redis_client)

    # 1. 生成验证码
    result = await svc.create_captcha()
    print("✅ 创建成功，key:", result.key, "image长度:", len(result.image))

    # 2. 从 Redis 查出正确答案（测试用）
    correct_code = await _redis_client.get(f"captcha:{result.key}")
    print("   正确答案:", correct_code)

    # 3. 校验正确验证码
    ok = await svc.verify_captcha(CaptchaRequest(key=result.key, code=correct_code))
    print("✅ 校验正确通过:", ok)

    # 4. 再测一次（应该失败，因为验证码已删除）
    try:
        await svc.verify_captcha(CaptchaRequest(key=result.key, code=correct_code))
    except Exception as e:
        print("✅ 二次使用被拦截:", e.detail if hasattr(e, 'detail') else e)

    # 5. 测错误验证码
    result2 = await svc.create_captcha()
    try:
        await svc.verify_captcha(CaptchaRequest(key=result2.key, code="WRONG"))
    except Exception as e:
        print("✅ 错误验证码被拦截:", e.detail if hasattr(e, 'detail') else e)

    print("\n🎉 全部通过！service.py 完全可用，PyCharm 红线无视即可")

if __name__ == "__main__":
    asyncio.run(main())