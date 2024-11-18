

const get = async (url) => {
  return new Promise((resolve,reject) => {
    wx.request({ url, method: 'GET', success: resolve, fail: reject })
  })
}

const post = async (url, payload) => {
  return new Promise((resolve, reject) => {
    wx.request({ url,data: payload, method: 'POST', success: resolve, fail: reject })
  })
}


module.exports = {
  get,
  post
}