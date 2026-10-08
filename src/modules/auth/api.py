from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.base_schema import ResponseSchema
from src.infra.database import get_db
from src.modules.auth.schema import AuthLoginRequest, TokenResponse
from src.modules.auth.service import AuthService
from src.modules.captcha.api import get_captcha_service
from src.modules.captcha.service import CaptchaService

router = APIRouter(prefix='/auth', tags=['Auth'])

def get_auth_service(
    db: AsyncSession = Depends(get_db),
    captcha_svc: CaptchaService = Depends(get_captcha_service),
) -> AuthService:
    return AuthService(db, captcha_svc)

@router.post('/login', response_model=ResponseSchema[TokenResponse], summary='用户登录')
async def login(
    data: AuthLoginRequest,
    svc: AuthService = Depends(get_auth_service),
):
    token = await svc.login(data)
    return ResponseSchema(data=token)