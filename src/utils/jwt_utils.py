from datetime import datetime,timedelta,timezone
import jwt
from sqlalchemy import from_dml_column

SECRET_KEY='d99494bb12745dd56d8cad366bb168aa4a44a512993a9fa6f005c2fcadbb3bc9'
ALGORITHM='HS256'

#配置OAuth2 Bearer模式 fastapi自带的依赖项
from fastapi.security import OAuth2PasswordBearer
oauth2_schema=OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


#编码JWT 创建一个令牌 登录成功后把用户信息传递过来 生成的令牌发给前端
#前端每次请求都需要携带自己的授权令牌
def encode_jwt(payload:dict)->str:
    payload_copy=payload.copy()
    # 给通行证盖「作废章」——30分钟后自动失效
    payload_copy['exp'] = datetime.now(timezone.utc) + timedelta(minutes=30)
    # 给通行证盖「签发章」——记录签发时刻
    payload_copy['iat'] = datetime.now(timezone.utc)

    token=jwt.encode(payload_copy,key=SECRET_KEY,algorithm=ALGORITHM)
    return token


#解码令牌，验证令牌的有效性
#每次请求时，都从请求头中提取令牌，然后调用此函数验证令牌是否有效
def verify_jwt(token:str)->dict:
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('token已过期')
    except jwt.InvalidTokenError:
        raise Exception('token无效')

