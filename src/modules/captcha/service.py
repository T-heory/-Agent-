from redis.asyncio.client import Redis
import sys
from src.core.exceptions import BizException
from src.modules.captcha.schema import CaptchaRead,CaptchaVerifyRequest
import random
import string
import uuid   #用于生成验证码的唯一ID uuid
from captcha.image import ImageCaptcha
import base64
from io import BytesIO

class CaptchaService:
    CAPTCHA_EXPIRE=60*5   #验证码过期时间，单位秒
    CAPTCHA_KEY_PREFIX='captcha:'   #验证码key前缀

    def __init__(self,redis:Redis):
        self.redis=redis
    def random_code(self)->str:
        code=''.join(random.choices(string.ascii_uppercase+string.digits, k=4)) #k表示验证码长度为4
         #去除易混淆字符
        code=code.replace('O','0').replace('I','1').replace('S','5').replace('Z','2')
        return code

 #创建验证码
    async def create_captcha(self)->CaptchaRead:
       code=self.random_code()

       #验证码的唯一ID
       captcha_id=uuid.uuid4().hex

       #生成验证码键:captcha:${code
       key=f'{self.CAPTCHA_KEY_PREFIX}{captcha_id}'

       await self.redis.set(key,code,ex=self.CAPTCHA_EXPIRE)
       #以上 服务端 保存验证码到redis成功
       #生成验证码图片 并编码为base64字符串
       image_captcha = ImageCaptcha(width=160, height=42)  # 第1步：验证码生成图片，理解成当前是空的，还没有注入验证码
       pil_image = image_captcha.generate_image(code)  # 第2步：真正的图片对象，包含验证码文本
       buffer = BytesIO()
       pil_image.save(buffer, format='PNG')
       b64 = base64.b64encode(buffer.getvalue()).decode()

      #返回验证码信息
       return CaptchaRead(
           key=captcha_id,
           image=f'data:image/png;base64,{b64}'
       )

    async def verify_captcha(self,captcha:CaptchaVerifyRequest)->bool:
        #从redis中获取验证码
        key=f'{self.CAPTCHA_KEY_PREFIX}{captcha.key}'
        stored_code=await self.redis.get(key)
        if not stored_code:
            raise BizException(code=10001,message='验证码不存在或已过期')
        #判断验证码是否正确
        if stored_code != captcha.code:
            raise BizException(code=10002,message='验证码错误')
        await self.redis.delete(key)
        return True
