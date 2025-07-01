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
  handleMessageRouter (e) {
    const data = e.detail?.data || []
    const tmp = data.filter((item) => {
      if (item.type === 'router') return true
      return false
    })
    if (tmp.length === 0) return
    const info = tmp.pop()
    getApp().globalData.webVeiwName = info.name
  },
  handleMessageForward(e) {
    const data = e.detail?.data || []
    const newForward = {}
    for (const item of data) {
      if (item.type !== 'forward') continue
      const {shopId} = item
      newForward[shopId] = item;
    }
    getApp().globalData.forwardInfo = newForward
  },
  onMessageHandle(e) {
    this.handleMessageRouter(e)
    this.handleMessageForward(e)
  },

  onShareAppMessage(options) {
    const {webViewUrl} = options
    let rawInstance = new utils.UrlTools(webViewUrl)
    let rawPathName = rawInstance.getPathName()
    let {title, imageUrl} = rawInstance.getQuery()
    if (imageUrl) {
      imageUrl = `https:${imageUrl}`
    }
    let pass = false
    let shopId
    if (/\/product-manage\/(\d+)\/product-detial\/(\d+)$/.test(rawPathName)) { // 产品详情
      pass = true
      shopId = RegExp.$1;
      const prodId = RegExp.$2
      let newInstance = new utils.UrlTools(`/product-manage/${shopId}?toDetial=${prodId}`)
      newInstance.addQuery(rawInstance.getQuery())
      rawInstance = newInstance
      rawPathName = rawInstance.getPathName()
    }
    if (/\/product-manage\/(\d+)$/.test(rawPathName)) { // 用户画册首页
      pass = true
      shopId = RegExp.$1;
    }
    let isInventory = false
    if (/\/product-manage\/(\d+)\/view-inventory/.test(rawPathName)) { // 清单列表
      pass  = true
      shopId = RegExp.$1;
      isInventory = true
    }
    if (pass === false) {
      if (/\/product-manage\/(\d+)\/*/.test(rawPathName)) { // 其他产品页，比如编辑产品页，这时候跳转回画册首页
        pass = true
        title = '小果画册'
        imageUrl = '../../assets/logo.png'
        shopId = RegExp.$1;
        let newInstance = new utils.UrlTools(`/product-manage/${shopId}`)
        newInstance.addQuery(rawInstance.getQuery())
        rawInstance = newInstance
        rawPathName = rawInstance.getPathName()
      }
    }
    if (pass === false) { // 如果都不是，则跳转系统首页
      let newInstance = new utils.UrlTools(`/`)
      newInstance.addQuery(rawInstance.getQuery())
      rawInstance = newInstance
      rawPathName = rawInstance.getPathName()
      title = '小果画册'
      imageUrl = '../../assets/logo.png'
    }

    if (shopId) {
      const { forwardInfo } =  getApp().globalData
      const infoItem = forwardInfo[shopId]
      if (infoItem) {
        const {forwardPermi, isAdmin} = infoItem
        if (forwardPermi === 1) {
          wx.updateShareMenu({
            isPrivateMessage: true,
            success: () => {},
            fail: () => {}
          })
          if (isAdmin !== 1 && !isInventory) { //  清单列表不需要限制
            let newInstance = new utils.UrlTools(`/`)
            title = '小果画册'
            imageUrl = '../../assets/logo.png'
            newInstance.addQuery(rawInstance.getQuery())
            rawInstance = newInstance
            rawPathName = rawInstance.getPathName()
          }
        }
      }
    }

    let src_path = rawInstance.getFullpath()
    // if(/\/product-manage\/(\d+)\/product-detial\/(\d+)/.test(src_path)) {
    //   let newInstance = new utils.UrlTools(`/product-manage/${RegExp.$1}?toDetial=${RegExp.$2}`)
    //   newInstance.addQuery(rawInstance.getQuery())
    //   src_path = newInstance.getFullpath()
    // }
    if (!imageUrl) imageUrl = '../../assets/logo.png'
    let ret = {
      title: `${title || '小果画册'}`,
      path: `/pages/index/index?src_path=${encodeURIComponent(src_path)}`,
      imageUrl
    }
    return ret
  }
})

wx.showShareMenu({
  withShareTicket: true,
  menus: ['shareAppMessage']
})
