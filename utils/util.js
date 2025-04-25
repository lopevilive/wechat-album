const http = require('./http')
const URLParse = require('./url-parse')



const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const getLoginCode = async () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(res.errMsg)
        }
      },
      fail: (e) => {
        reject(e)
      }
    })
  })
}

const getToken = async () => {
  const {globalData: {apiPath}} = getApp();
  let needLogin = false
  let token = wx.getStorageSync('token')
  try {
    if (token) {
      const {data} = await http.post(`${apiPath}/user/VeriToken`, {token}) // 先交验 token
      if (data.code !== 0) needLogin = true
    } else {
      needLogin = true
    }
  } catch(e) {
    wx.showToast({
      title: `${e?.errMsg}*` || '请求出错了～*',
      icon: 'none'
    })
    needLogin = true
    console.error(e)
  }

  if (!needLogin) return token

  try {
    const code = await getLoginCode()
    const {data} = await http.post(`${apiPath}/user/Login`, {code})
    if (data.code === 0) {
      token = data.data
      wx.setStorageSync('token', token)
    }
    return token
  } catch(e) {
    wx.showToast({
      title: e?.errMsg || '请求出错了～',
      icon: 'none'
    })
    throw e
  }
}

class UrlTools {
  constructor(url) {
    this.rawObj = URLParse(url)
    this.pathname= this.rawObj.pathname.replace('/dist', '')
    this.query = {}
    this.init()
  }
  getFullpath () {
    let ret = this.pathname
    let queryKeys = Object.keys(this.query)
    let query = ''
    if (queryKeys.length) {
      for (const key of queryKeys) {
        const val = this.query[key]
        if (!val) continue
        if (!query) {
          query += `?${key}=${encodeURIComponent(val)}`
        } else {
          query += `&${key}=${encodeURIComponent(val)}`
        }
      }
    }
    ret = `${ret}${query}`
    return ret
  }

  getQuery() {
    return {...this.query}
  }

  addQuery(obj) {
    this.query = Object.assign(this.query, obj)
  }

  removeQuery(key) {
    this.query[key] = undefined
  }

  init() {
    let {query} = this.rawObj
    query = query?.split('?')?.[1]
    if (query) {
      query = query.split('&')
      for (const item of query) {
        let [key, val] = item.split('=')
        key = decodeURIComponent(key)
        val = decodeURIComponent(val)
        this.query[key] = val
      }
    }
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000); // 若时间戳为秒级需 *1000，否则直接传入
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需+1
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const sleep = async (time = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null)
    }, time)
  })
}



module.exports = {
  formatTime,
  getLoginCode,
  getToken,
  UrlTools,
  formatDate,
  sleep
}
