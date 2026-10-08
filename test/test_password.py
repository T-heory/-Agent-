from src.utils.password_utils import hash_password,verify_password

import pytest

def test_hash_password():
    password = '123456'
    #即使多次加密同一个字符串，密文都不一样，防止彩虹表攻击
    #MD5会被攻击，因为MD5字符串一样，密文也一样
    #而bcrypt不会被攻击，因为bcrypt会随机生成盐值，每次盐值不同，所以密文也不同
    hashed_password=hash_password(password)
    print(f'哈希后的密码:{hashed_password}')
    assert hashed_password is not None


def test_verify_password():
    password = '123456'
    hashed_password = hash_password(password)
    assert verify_password(password,hashed_password) is True
