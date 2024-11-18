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
  let token = wx.getStorageSync('token')
  if (token) return token
  const code = await getLoginCode()
  const {globalData: {apiPath}} = getApp();
  const {data} = await http.post(`${apiPath}/user/Login`, {code})
  if (data.code === 0) {
    token = data.data
    wx.setStorageSync('token', token)
  }
  return token
}



const parseUrl = (url) => {
  const uri = URLParse(url)
  let {query} = uri
  let queryObj = {}
  if (query) {
    query = query.split('?')[1]
    query = query.split('&')
    for (const item of query) {
      let [key, val] = item.split('=')
      queryObj[key] = decodeURIComponent(val)
    }
  }
  uri.queryObj = queryObj
  return uri
}



module.exports = {
  formatTime,
  getLoginCode,
  getToken,
  parseUrl
}
