const util = require('../../utils/util')
const http = require('../../utils/http')

Page({
  data: {
    src_path: '',
    checked: false,
  },
  async onLoad(options) {
    let {src_path} = options
    if (src_path) {
      src_path = decodeURIComponent(src_path)
      this.setData({src_path})
    }
  },
  showTips() {
    wx.showToast({title: '请同意用户协议', icon: 'none'})
  },
  toProtocol () {
    const {globalData: {web_src}} = getApp();
    const src_path = `${web_src}/user-protocol`
    const viewPath = `../h5-view/h5View?web_src=${encodeURIComponent(src_path)}`
    wx.navigateTo({url: viewPath})
  },
  radioChange({detail: {value}}) {
    this.setData({
      checked: !!value.length
    })
  },
  async goNext() {
    const {src_path} = this.data
    if (src_path) {
      wx.reLaunch({url: `../index/index?src_path=${encodeURIComponent(src_path)}`})
    } else {
      wx.reLaunch({url: `../index/index?src_path=${encodeURIComponent('/')}`})
    }
  },
  getPhoneNumber: async function(e) {
    try {
      // this.goNext()
      wx.showLoading({mask: true})
      if (e.detail.errMsg === 'getPhoneNumber:ok') {
        const {code} = e.detail
        const {globalData: {apiPath}} = getApp();
        const token = await util.getToken()
        const {data} = await http.post(`${apiPath}/user/BindPhone`, {code, token})
        if (data.code === 0) { // 成功
          this.goNext()
        }
      } else {
        console.log('用户拒绝授权');
      }
    } catch(e) {} finally{
      wx.hideLoading()
    }
  }
})
