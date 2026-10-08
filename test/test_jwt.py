from src.utils.jwt_utils import encode_jwt,verify_jwt

import pytest

def test_encode_jwt():    #测试令牌
    payload={'id':123,'username':'admin'}
    token=encode_jwt(payload)
    print(f'token: {token}')
    assert token is not None
    assert isinstance(token,str)

def test_verify_jwt():
    token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJ1c2VybmFtZSI6ImFkbWluIiwiZXhwIjoxNzkxMzU2MzQ1LCJpYXQiOjE3OTEzNTQ1NDV9.mXhLEycDWJ1zKkfhPGAb10jn7hUppPnTelo_G8ggSRQ'
    payload=verify_jwt(token)
    print(f'payload: {payload}')
    assert payload is not None
    assert payload['id']==123
    assert payload['username']=='admin'