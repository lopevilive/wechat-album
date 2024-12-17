const util = require('../../utils/util')


Page({
  data: {
    info: {}
  },
  async onLoad({payload}) {
    if (!payload) return
    const info = JSON.parse(decodeURIComponent(payload))
    const { title } = info
    wx.setNavigationBarTitle({title})
    this.setData({info})
  },
  onShareAppMessage() {
    const {shopId, productId, title,url} = this.data.info
    const instance = new util.UrlTools(`/product-manage/${shopId}`)
    instance.addQuery({toDetial: productId, title, imageUrl: url})
    const src_path = instance.getFullpath()
    return {
      title: title || '  ',
      path: `/pages/index/index?src_path=${encodeURIComponent(src_path)}`,
      imageUrl: `https:${url}`
    }
  }
})
