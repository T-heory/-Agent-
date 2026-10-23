from pydantic import BaseModel

class PermissionCreate(BaseModel):
    code:str
    name:str
    description:str|None=None


class PermissionUpdate(BaseModel):
    name:str
    description:str|None=None


class PermissionRead(BaseModel):
    id:int
    code:str
    name:str
    description:str|None=None
    model_config={
        "from_attributes":True 
    }