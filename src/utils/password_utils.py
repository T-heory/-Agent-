import bcrypt

#对密码进行哈希加密
def hash_password(password:str)->str:
    #明文密码进行哈希加密
    return bcrypt.hashpw(
        password.encode('utf-8'), #把字符串转换为字节，因为bcrypt只能处理字节
        bcrypt.gensalt()  #生成随机盐值
    ).decode('utf-8')#把字节转换为字符串，存进数据库


def verify_password(password:str,hashed_password:str)->bool:
    #检验密码是否匹配哈希
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )