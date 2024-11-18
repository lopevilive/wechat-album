const util = require('../../utils/util')

Page({
  data: {
    message: "长按保存图片，然后扫码添加微信~",
    qrcodeUrl: ""
  },
  async onLoad({payload}) {
    if (!payload) return
    payload = JSON.parse(decodeURIComponent(payload))
    const {qrcodeUrl, message} = payload
    this.setData({qrcodeUrl, message})
  },
})
