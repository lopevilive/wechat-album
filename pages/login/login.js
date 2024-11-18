const util = require('../../utils/util')

Page({
  data: {
  },
  async onLoad(options) {
    try {
      wx.showLoading({mask: true})
      wx.removeStorageSync('token')
      let {src_path} = options
      if (src_path) src_path = decodeURIComponent(src_path)
      const {globalData: {web_src}} = getApp();
      const token = await util.getToken()

      if (src_path) {
        const src = `${web_src}${src_path}?token=${token}`
        const url = `../h5-view/h5View?web_src=${encodeURIComponent(src)}`
        wx.redirectTo({url})
      } else {
        wx.reLaunch({url: '../index/index'})
      }
    } catch(e) {}finally{
      wx.hideLoading()
    }
  }
})
