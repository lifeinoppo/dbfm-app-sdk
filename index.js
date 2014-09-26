var util = require('util')
var request = require('request')
var safeParse = require('safe-parse')

var apis = require('./lib/apis')
var APP_NAME = 'radio_desktop_win'
var APP_VERSION = 100
var noop = function () {}

request = request.defaults({
	headers : require('./lib/custom-headers.json')
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
			version: APP_VERSION
		},
		form : true
	}, function(err, res, body) {
		if(err) return cb(err)
		body = safeParse(body) || {}
		self._userInfo = body
		cb(null, body)
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
			version: APP_VERSION
		},
	}, function(err, res, body) {
		if(err) return cb(err)
		body = safeParse(body) || {}
		cb(null, body.channels || [])
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
			token: self._userInfo.token,
			expire: self._userInfo.expire,
			user_id: self._userInfo.user_id,
			channel: opt.channel_id,
			sid: opt.sid,
			type: opt.type || 'n',
			pt: opt.pt || '',
			kps : opt.kps || '192'
		}
	}, function (err, res, body) {
		if (err) return cb(err)
		body = safeParse(body) || {}
		cb(null, body.song || [])
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

//我收藏的频道
SDK.prototype.fav_channels = function(opt, cb) {
	var self = this
	cb = cb || noop
	request(apis.fav_channels, {
		qs: {
			app_name : APP_NAME,
			version: APP_VERSION,
			token: self._userInfo.token,
			expire: self._userInfo.expire,
			user_id: self._userInfo.user_id
		}
	}, function (err, res, body) {
		if (err) return cb(err)
		body = JSON.parse(body) || {}
		cb(null, body)
	})
}

module.exports = SDK