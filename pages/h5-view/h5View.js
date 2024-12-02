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
    const uri = utils.parseUrl(webViewUrl)
    const {pathname, queryObj} = uri
    let src_path = pathname.replace('/dist', '')

    if(/\/product-manage\/(\d+)\/product-detial\/(\d+)/.test(src_path)) {
      src_path = `/product-manage/${RegExp.$1}?toDetial=${RegExp.$2}`
    }

    const {title, imageUrl} = queryObj

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
