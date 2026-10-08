from pydantic import BaseModel

class CaptchaRead(BaseModel):
    key:str
    image:str

class CaptchaVerifyRequest(BaseModel):
    key:str
    code:str