const util = require('../../utils/util')

Page({
  data: {
    src_path: ''
  },
  async onLoad(options) {
    let {src_path} = options
    if (src_path) {
      src_path = decodeURIComponent(src_path)
      this.setData({src_path})
    }
    try {
      wx.showLoading({mask: true})
      wx.removeStorageSync('token')
      const {src_path} = this.data
      if (src_path) {
        wx.reLaunch({url: `../index/index?src_path=${encodeURIComponent(src_path)}`})
      } else {
        wx.reLaunch({url: `../index/index?src_path=${encodeURIComponent('/')}`})
      }
    } catch(e) {
      console.error(e)
      await wx.reLaunch({url: '../index/index'})
    }finally{
      wx.hideLoading()
    }
  }
})
