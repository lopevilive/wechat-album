// index.js
const util = require('../../utils/util')

Page({
  data: {
    inited: false
  },
  async onLoad(options) {
    let {src_path, scene} = options
    if (src_path) src_path = decodeURIComponent(src_path)
    if (!src_path) src_path = '/'
    if (scene) {
      src_path = `/view-share?scene=${scene}`
      // console.log(src_path)
      // return
    }
    this.init(src_path)
  },
  toH5 (token, src_path) {
    if (!src_path) src_path = '/'
    const urlInstance = new util.UrlTools(src_path)
    urlInstance.addQuery({token})
    const deviceInfo = wx.getDeviceInfo()
    if (/(mac|windows)/.test(deviceInfo.platform)) {
      urlInstance.addQuery({isPC: '1'})
    }
    const {globalData: {web_src}} = getApp();
    let url = `${web_src}${urlInstance.getFullpath()}`
    const viewPath = `../h5-view/h5View?web_src=${encodeURIComponent(url)}`
    wx.navigateTo({url: viewPath})
  },
  handleClick() {
    this.init()
  },
  async init(src_path) {
    try {
      this.setData({inited: false})
      const token = await util.getToken()
      this.toH5(token, src_path)
    } catch(e) {
      console.error(e)
    }finally {
      setTimeout(() => {
        this.setData({inited: true})
      }, 1000);
    }
  },
  onShareAppMessage (){
    return {
      title: '小果画册',
      path: '/pages/index/index'
    }
  }
})

wx.showShareMenu({
  withShareTicket: true,
  menus: ['shareAppMessage']
})



