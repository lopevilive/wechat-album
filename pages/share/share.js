
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
    const src_path = `/product-manage/${shopId}?toDetial=${productId}`
    return {
      title: title || '  ',
      path: `/pages/index/index?src_path=${encodeURIComponent(src_path)}`,
      imageUrl: `https:${url}`
    }
  }
})
