const util = require('../../utils/util')

Page({
  data: {
    info: {
      nickName: '',
      shopName: '',
      inviteId: '',
      url: '',
      shopId: '',
    }
  },
  async onLoad({payload}) {
    if (!payload) return
    // console.log(JSON.parse(decodeURIComponent(payload)))
    const info = JSON.parse(decodeURIComponent(payload))
    this.setData({info})
  },
  onShareAppMessage(){
    const {shopName, inviteId, url, shopId} = this.data.info
    const src_path = `/product-manage/${shopId}/staff-verify/${inviteId}`
    return {
      title: `${shopName} 邀请您成为管理员～`,
      imageUrl: `https:${url}`,
      path: `/pages/index/index?src_path=${encodeURIComponent(src_path)}`
    }
  }
})
