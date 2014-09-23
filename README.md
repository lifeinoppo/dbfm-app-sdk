#### 豆瓣电台sdk

这是app端的接口封装的sdk，不同于[Douban-FM-sdk](https://github.com/ampm/Douban-FM-sdk)

#### examples:
```javascript
    var sdk = require('dbfm-app-sdk')

    //登录
    sdk.login({
        email: 'xxxx@gmail.com',
        password : '123456'
    }, function(err, body) {
        if(err) console.err(err)
        console.log(body)
    }

    //获取channel列表
    sdk.channels({ }, function(err, channels) {
        if(err) console.err(err)
        console.log(channels)
    }

    //根据channel_id获取歌曲列表
    sdk.songs({
        channel_id : '123'
    }, function(err, songs) {
        console.log(songs
    }

    //不发送登录请求直接设置登录信息
    sdk.storage({
        token : 'ajslfxajfasdf',
        expire : '1426941666',
        user_id : '3424234324'
    })
```
