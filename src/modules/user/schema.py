from pydantic import BaseModel,EmailStr

class UserCreate(BaseModel):
    username:str
    email:EmailStr
    password:str


class UserRead(BaseModel):
    id:int
    username:str
    email:str
    is_active:bool
#配置了from_attributes:true，当前模型类可以直接从内存中orm模型对象的属性中读取数据
    model_config={'from_attributes':True}