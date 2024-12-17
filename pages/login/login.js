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
        const instance = new util.UrlTools(src_path)
        instance.addQuery({token})
        src_path = instance.getFullpath()
        const src = `${web_src}${src_path}`
        const url = `../h5-view/h5View?web_src=${encodeURIComponent(src)}`
        await wx.redirectTo({url})
      } else {
        await wx.reLaunch({url: '../index/index'})
      }
    } catch(e) {
      console.error(e)
      await wx.reLaunch({url: '../index/index'})
    }finally{
      wx.hideLoading()
    }
  }
})
