import bcrypt

from src.core.logger import logger

# bcrypt 只识别这几种前缀的哈希串
_BCRYPT_PREFIXES = ('$2a$', '$2b$', '$2y$')
# bcrypt 哈希串固定 60 个字符
_BCRYPT_HASH_LEN = 60
# bcrypt 算法本身只取前 72 个字节，超长会抛 ValueError（bcrypt>=4.1）
_BCRYPT_MAX_BYTES = 72


def _to_bcrypt_bytes(password: str) -> bytes:
    """把明文密码转成 bcrypt 可处理的字节，并按 bcrypt 规则截断到 72 字节。

    哈希与校验必须走同一套截断逻辑，否则超长密码永远校验不通过。
    """
    raw = password.encode('utf-8')
    return raw[:_BCRYPT_MAX_BYTES]


# 对密码进行哈希加密
def hash_password(password: str) -> str:
    # 明文密码进行哈希加密
    return bcrypt.hashpw(
        _to_bcrypt_bytes(password),  # 把字符串转换为字节，因为bcrypt只能处理字节
        bcrypt.gensalt()  # 生成随机盐值
    ).decode('utf-8')  # 把字节转换为字符串，存进数据库


def is_bcrypt_hash(value: object) -> bool:
    """判断一个值是否是格式合法的 bcrypt 哈希串。

    库里可能存着历史脏数据（明文、空串、被截断的哈希等），
    直接丢给 bcrypt.checkpw 会抛 ValueError: Invalid salt。
    """
    if not isinstance(value, str):
        return False
    value = value.strip()
    return len(value) == _BCRYPT_HASH_LEN and value.startswith(_BCRYPT_PREFIXES)


def verify_password(password: str, hashed_password: str) -> bool:
    """校验密码是否匹配哈希。

    任何异常情况（哈希为空/明文/被截断/编码异常）一律返回 False，
    让业务层按"密码错误"处理，而不是把 ValueError 抛到接口层变成 500。
    """
    if not is_bcrypt_hash(hashed_password):
        logger.warning(
            '数据库中的密码哈希格式非法（可能是明文或已损坏），已拒绝校验：{!r}',
            hashed_password,
        )
        return False

    try:
        return bcrypt.checkpw(
            _to_bcrypt_bytes(password),
            hashed_password.strip().encode('utf-8'),
        )
    except ValueError:
        # 兜底：盐值损坏、非法字符等
        logger.warning('bcrypt 校验失败，哈希串无法解析：{!r}', hashed_password)
        return False
