

const get = async (url) => {
  return new Promise((resolve,reject) => {
    wx.request({ url, method: 'GET', success: resolve, fail: reject })
  })
}

const post = async (url, payload, header) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url,data: payload, method: 'POST',timeout: 10 * 1000, success: resolve, fail: reject,
      header: header ? header : {}
    })
  })
}


module.exports = {
  get,
  post
}