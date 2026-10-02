def sum(a,b):
    return a+b

def test_sum():
    assert sum(3,5)==8 # 测试加法函数
    #assert的作用是断言sum函数的返回值是否等于8，如果等于8，测试通过，否则测试失败

def test_sum_fail():
    assert sum(3,5)!=8


