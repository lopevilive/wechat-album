const util = require('../../utils/util')
const http = require('../../utils/http')

Page({
  data: {
    cfg: [],
    selectedIdx: 0,
    amount: 0,
    currLevel: 0,
    displayText: '',
    currVipText: '普通用户 (可上传 50 个产品)',
    expiredTime: 0,
    shopInfo: {},
    money: 0
  },
  async onLoad(options) {
    const payload = JSON.parse(decodeURIComponent(options.payload))
    const shopInfo = JSON.parse(decodeURIComponent(options.shopInfo))
    const cfg = []
    let idx = 0;
    for (const item of payload.cfg) {
      if (!item.price) continue
      if (item.level === payload.level) this.setData({selectedIdx: idx})        
      if (item.price) cfg.push(item)
      idx += 1;
    }
    this.setData({cfg})
    this.setData({amount: payload.amount})
    this.setData({currLevel: payload.level})
    this.setData({expiredTime: payload.expiredTime})
    this.setData({shopInfo})
    this.formatText()
    this.formatVipText()
    
  },
  async queryOrder(id, shopId) {
    const token = await util.getToken()
    const {globalData: {apiPath}} = getApp();
    await util.sleep(500)
    try {
      wx.showLoading({mask: true})
      const {data} = await http.post(`${apiPath}/user/QueryOrder`,
        { id, shopId },
        {Authorization: token}
      )
      if (data.code !== 0) {
        throw new Error(data.msg || data.message || '系统繁忙，请稍后重试～*')
      }
      if (data.data === 1) { // 开通完成
        wx.showToast({title: '开通成功～', icon: 'success'})
        await util.sleep(300)
        wx.reLaunch({url: `../index/index?src_path=${encodeURIComponent('/')}`})
      }
    } catch(e) {
      wx.showToast({title: e.message, icon: 'none'})
    } finally {
      wx.hideLoading()
    }
    
  },

  async confirmSub () {
    const {globalData: {apiPath}} = getApp();
    const {selectedIdx, cfg, shopInfo: {shopId}, money} = this.data
    const matchItem = cfg[selectedIdx]
    const token = await util.getToken()
    let prepayRes
    let pass = false
    if (money === 0) {
      const res = await wx.showModal({
        title: '确定升级画册？',
        content: '（注：画册升级后不支持降级）',
      })
      if (res.cancel) return
    }
    try {
      wx.showLoading({mask: true})
      const {data} = await http.post(`${apiPath}/user/CreateOrder`,
        {
          shopId,
          level: matchItem.level
        },
        {Authorization: token}
      )
      if (data.code === 0) {
        pass = true
        prepayRes = data.data
      } else {
        throw new Error(data.msg || data.message || '系统繁忙，请稍后重试～')
      }
    } catch(e) {
      wx.showToast({title: e.message, icon: 'none'})
    } finally {
      wx.hideLoading()
    }
    if (!pass) return
    if (prepayRes.done === true)  { // 无需支付
      wx.showToast({title: '开通成功～', icon: 'success'})
      await util.sleep(300)
      wx.reLaunch({url: `../index/index?src_path=${encodeURIComponent('/')}`})
      return
    }

    wx.requestPayment({
      provider: 'wxpay',
      timeStamp: `${prepayRes.timeStamp}`,
      nonceStr: prepayRes.nonceStr,
      package: prepayRes.package,
      signType: prepayRes.signType,
      paySign: prepayRes.paySign,
      success: (res) => {
        this.queryOrder(prepayRes.id, shopId)
      },
      fail: (err) => {
        // this.queryOrder(prepayRes.id)
        console.log(err)
      }
    })
    
  },
  itemClickHandle(e) {
    const {currLevel, cfg} = this.data
    const idx = e.currentTarget.dataset.idx
    const matchItem = cfg[idx]
    if (currLevel > matchItem.level) return
    this.setData({selectedIdx: e.currentTarget.dataset.idx})
    this.formatText()
  },
  formatText() {
    const {cfg, selectedIdx, amount, currLevel} = this.data
    const currItem = cfg[selectedIdx]
    let money = 0
    if (currItem.price > amount) {
      money = currItem.price - amount
    }
    let text = ''
    if (currItem.level === currLevel) {
      money = currItem.price
      text = `确定并以 ¥${currItem.price / 100} 续费`
    } else {
      text = `确定并以 ¥${Math.floor(money / 100)} 开通`
    }
    this.setData({displayText: text, money}) 
  },
  formatVipText () {
    const { currLevel, cfg, expiredTime } = this.data
    for (const item of cfg) {
      if (item.level === currLevel && item.price) {
        this.setData({currVipText: `${item.limit} 容量会员 ${util.formatDate(expiredTime)} 过期`})
      }
    }
  }

})
