// index.js
const utils = require('../../utils/util')

Page({
  data: {
    web_src: ''
  },
  onLoad(options) {
    let {web_src} = options
    if (web_src) {
      web_src = decodeURIComponent(web_src)
      this.setData({ web_src })
    }
  },
  onShareAppMessage(options) {
    const {webViewUrl} = options
    let rawInstance = new utils.UrlTools(webViewUrl)
    const {title, imageUrl} = rawInstance.getQuery()
    let src_path = rawInstance.getFullpath()
    if(/\/product-manage\/(\d+)\/product-detial\/(\d+)/.test(src_path)) {
      let newInstance = new utils.UrlTools(`/product-manage/${RegExp.$1}?toDetial=${RegExp.$2}`)
      newInstance.addQuery(rawInstance.getQuery())
      src_path = newInstance.getFullpath()
    }

    let ret = {
      title: `${title || ' '}`,
      path: `/pages/index/index?src_path=${encodeURIComponent(src_path)}`
    }
    if (imageUrl) {
      ret.imageUrl = `https:${imageUrl}`
    }
    return ret
  }
})

wx.showShareMenu({
  withShareTicket: true,
  menus: ['shareAppMessage']
})
