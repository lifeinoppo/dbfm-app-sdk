var HOST_URL = 'http://www.douban.com/'
//var HOST_URL = 'http://douban.fm/'

var apis = 	{
	//登录
	login : 'j/app/login',
	//获取歌曲
	songs : 'j/app/radio/people',
	//频道
	channels : 'j/app/radio/channels',
	//收藏的频道
	fav_channels : ''
}

for(api in apis) {
	apis[api] = HOST_URL + apis[api]
}

module.exports = apis