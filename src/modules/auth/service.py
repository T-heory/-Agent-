from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import BizException
from src.modules.auth.schema import AuthLoginRequest, TokenResponse
from src.modules.captcha.schema import CaptchaVerifyRequest
from src.modules.captcha.service import CaptchaService
from src.modules.user.model import User
from src.modules.user.repository import UserRepository
from src.utils.jwt_utils import encode_jwt
from src.utils.password_utils import verify_password

class AuthService:
    def __init__(self, db: AsyncSession, captcha_svc: CaptchaService) -> None:
        self.db = db
        self.captcha_svc = captcha_svc
        self.user_repo = UserRepository(db)

    async def login(self, data: AuthLoginRequest) -> TokenResponse:
        # 1. 校验验证码
        captcha_verify_req = CaptchaVerifyRequest(
            key=data.captcha_key,
            code=data.captcha_code
        )
        verify_result = await self.captcha_svc.verify_captcha(captcha_verify_req)
        if not verify_result:
            raise BizException(code=400, message='验证码错误')

        # 2. 校验用户是否存在
        user = await self.user_repo.get_by_username(data.username)
        if not user:
            raise BizException(code=400, message='用户不存在')

        # 3. 校验密码
        if not verify_password(data.password, user.hashed_password):
            raise BizException(code=400, message='密码错误')

        # 4. 生成 token 返回
        payload = {'sub': str(user.id), 'username': user.username, 'email': user.email}
        token = encode_jwt(payload)

        # 5. 最后一次登录时间
        user.last_login = datetime.now(timezone.utc)
        await self.user_repo.update(user)

        return TokenResponse(access_token=token)