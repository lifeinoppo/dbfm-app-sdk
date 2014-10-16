var util = require('util')
var request = require('request')
var cheerio = require('cheerio')

var apis = require('./lib/apis')
var headers = require('./lib/custom-headers.json')
var APP_NAME = 'radio_desktop_win'
var APP_VERSION = 100
var APP_FROM = 'mainsite'

var noop = function () {}
var safeParse = function(res) {
	if(res.statusCode == 200) {
		return JSON.parse(res.body)
	} else {
		console.error(res.request.uri, res.body)
	}
}


//生成临时cookie
var guid = require('easy-guid')
var guidCookie = 'bid=' + guid.new(16)
headers.Cookie = guidCookie

request = request.defaults({
	jar : true,
	headers : headers
})

function SDK() {
	this._userInfo = {}
}

SDK.prototype.login = function(opt, cb) {
	var self = this
	cb = cb || noop
	request(apis.login, {
		method : 'POST',
		qs : {
			email: opt.email,
			password: opt.password,
			app_name : APP_NAME,
			version: APP_VERSION,
			from : APP_FROM
		},
		form : true
	}, function(err, res, body) {
		if(err) return cb(err)
		body = safeParse(res)
		if(body) {
			self._userInfo = body
			cb(null, body)
		}
	})
}

//直接设置登录信息，不发送登录请求
SDK.prototype.storage = function(cache, cb) {
	for(key in cache) {
		this._userInfo[key] = cache[key]
	}
}

//退出登录
SDK.prototype.logout = function() {
	this._userInfo = {}
}

//获取频道列表
SDK.prototype.channels = function(opt, cb) {
	var self = this
	cb = cb || noop
	request(apis.channels, {
		qs : {
			token : self._userInfo.token,
			expire : self._userInfo.expire,
			app_name : APP_NAME,
			version: APP_VERSION,
			from: APP_FROM
		},
	}, function(err, res, body) {
		if(err) return cb(err)
		body = safeParse(res)
		if(body) {
			cb(null, body.channels || [])
		}
	})
}

//获取用户信息
SDK.prototype.user_info = function(opt, cb) {
	var self = this
	cb = cb || noop
	request(apis.user_info, {
		qs : {
			token : self._userInfo.token,
			expire : self._userInfo.expire,
			user_id: self._userInfo.user_id,
			app_name : APP_NAME,
			version: APP_VERSION,
			from: APP_FROM
		},
	}, function(err, res, body) {
		if(err) return cb(err)
		body = safeParse(res)
		if(body) {
			cb(null, body)
		}
	})
}

//根据频道获取歌曲列表
SDK.prototype.songs = function(opt, cb) {
	var self = this
	cb = cb || noop
	request(apis.songs, {
		qs: {
			app_name : APP_NAME,
			version: APP_VERSION,
			from: APP_FROM,
			token: self._userInfo.token,
			expire: self._userInfo.expire,
			user_id: self._userInfo.user_id,
			channel: opt.channel_id,
			context : opt.context,
			sid: opt.sid,
			type: opt.type || 'n',
			pt: opt.pt || '',
			kps : opt.kps || '192'
		}
	}, function (err, res, body) {
		if (err) return cb(err)
		body = safeParse(res)
		if(body) {
			cb(null, body.song || [])
		}
	})
}


//跳过此曲(下一首)
SDK.prototype.skip = function(opt,cb) {
	opt.type = 's'
	this.songs(opt, cb)
}

//加红心
SDK.prototype.star = function(opt, cb) {
	opt.type = 'r'
	this.songs(opt, cb)
}

//取消红心
SDK.prototype.unstar = function(opt, cb) {
	opt.type = 'u'
	this.songs(opt, cb)
}

//不再播放
SDK.prototype.never_play_again = function(opt, cb) {
	opt.type = 'b'
	this.songs(opt, cb)
}

//从豆瓣获取歌词
SDK.prototype.lyric = function(opt, cb) {
	var self = this
	cb = cb || noop
	request('http://music.douban.com/api/song/info', {
		headers : {
			HOST: 'music.douban.com',
			Referer : "http://music.douban.com/",
			Cookie : guidCookie
		},
		qs : {
			song_id : opt.song_id
		}
	},function(err, res, body) {
		if(err) return console.error(err)
		body = safeParse(res)
		if(body) {
			cb(null, body.lyric)
		}
	})
}

//歌曲搜索
SDK.prototype.music_search = function(opt, cb) {
	var self = this
	cb = cb || noop
	request('http://music.douban.com/subject_search', {
		headers : {
			HOST: 'music.douban.com',
			Referer : "http://music.douban.com/",
			Cookie : guidCookie
		},
		qs : {
			search_text: opt.search_text,
			start: opt.start
		}
	}, function(err, res, body) {
		if(err) return console.error(err)
		if(res.statusCode == 200) {
			var result = {
				subjects : [],
				count : 0
			}
			var CQuery = cheerio.load(body)

			//序列化dom数据
			function serialize(el) {
				var a = el.find('.nbg').eq(0)
				return {
					subject: true,
					url: a.attr('href'),
					id: a.attr('href').match(/subject\/(\d+)/i)[1],
					cover: a.find('img').eq(0).attr('src'),
					cantPlay: el.find('.start_radio').length < 1,
					name: el.find('.pl2 a').eq(0).text(),
					intro: el.find('p').eq(0).text()
				}
			}
			//获取专辑列表
			var items = CQuery('.item')
			items.each(function(i, item) {
				var subject = serialize(CQuery(item))
				subject && result.subjects.push(subject)
			})

			//获取总结果数
			var count = CQuery('.paginator .count').eq(0)
			if(count) {
				result.count = ~~count.text().match(/\d+/)
			}
			cb(null, result)
		} else {
			console.error(res.request.uri, res.body)
		}
	})
}

module.exports = SDK