// index.js
const util = require('../../utils/util')

Page({
  data: {

  },
  async onLoad(options) {
    let {src_path} = options
    if (src_path) src_path = decodeURIComponent(src_path)
    if (src_path) {
      this.init(src_path)
    }
  },
  toH5 (token, src_path) {
    const {globalData: {web_src}} = getApp();
    if (!src_path) src_path = '/' // 默认跳 h5 首页
    let url = `${web_src}${src_path}`
    if (/\?/.test(url)) {
      url = `${url}&token=${token}`
    } else {
      url = `${url}?token=${token}`
    }
    const viewPath = `../h5-view/h5View?web_src=${encodeURIComponent(url)}`
    wx.navigateTo({url: viewPath})
  },
  handleClick() {
    this.init()
  },
  async init(src_path) {
    try {
      wx.showLoading({mask: true})
      const token = await util.getToken()
      this.toH5(token, src_path)
    } catch(e) {

    }finally {
      wx.hideLoading()
    }
  },
})

wx.showShareMenu({
  withShareTicket: true,
  menus: ['shareAppMessage']
})



