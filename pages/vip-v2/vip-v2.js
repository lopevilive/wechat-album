const util = require('../../utils/util')
const http = require('../../utils/http')

Page({
  data: {
    shopInfo: {},
    cfg: [],
    currLevel: 0,       
    expiredTimeText: '', 
    currVipText: '普通用户 (可上传 50 个产品)',
    selectedIdx: 0,     
    displayText: '立即开通',
    amount: 0,           
    
    // 收银台弹窗所需控制变量
    showPayModal: false,
    isUpgrade: false,
    targetVip: {}
  },

  async onLoad(options) {
    if (options.shopInfo) {
      const shopInfo = JSON.parse(decodeURIComponent(options.shopInfo))
      this.setData({ shopInfo })
      await this.initVipData(shopInfo.shopId)
    }
  },

  async initVipData(shopId) {
    const vipInfo = await this.getVipInfo(shopId)
    if (!vipInfo) return

    let { level, expiredTime, cfg, amount } = vipInfo
    cfg = cfg || []
    
    // 遍历处理每一个套餐的视频时间文本转化
    cfg.forEach(item => {
      if (!item.videoS) {
        item.videoSText = '10秒'
      } else if (item.videoS < 60) {
        item.videoSText = `${item.videoS}秒`
      } else {
        const m = Math.floor(item.videoS / 60)
        const s = item.videoS % 60
        item.videoSText = s > 0 ? `${m}分${s}秒` : `${m}分钟`
      }
    })

    let expiredTimeText = ''
    let isExpired = false 
    
    if (expiredTime) {
      const nowTime = Math.floor(Date.now() / 1000) 
      isExpired = nowTime >= expiredTime 
      
      const date = new Date(expiredTime * 1000)
      expiredTimeText = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    let currVipText = ''
    if (level === 0) {
      const freeLimit = (cfg && cfg[0] && cfg[0].limit) || 50
      currVipText = `普通用户 (可上传 ${freeLimit} 个产品)`
    } else {
      const currentCfg = cfg.find(item => item.level === level)
      const limit = currentCfg ? currentCfg.limit : 0
      const timeStatusText = isExpired ? `已于 ${expiredTimeText} 到期` : `${expiredTimeText} 到期`
      
      // 🌟 优化：顶部当前店铺状态的 9999 无限容量名词转化
      if (limit === 9999) {
        currVipText = `无限容量尊享会员 (${timeStatusText})`
      } else {
        currVipText = `${limit} 容量会员 (${timeStatusText})`
      }
    }

    let selectedIdx = 0
    if (level === 0 && cfg.length > 1) {
      selectedIdx = 1
    } else if (level >= cfg.length - 1) {
      selectedIdx = cfg.length - 1
    } else {
      selectedIdx = level
    }

    this.setData({
      cfg: cfg || [],
      currLevel: level || 0,
      expiredTimeText,
      currVipText,
      selectedIdx,
      amount: amount || 0
    })

    this.updateButtonText()
  },

  async getVipInfo(shopId) {
    wx.showLoading({ mask: true })
    try {
      const token = await util.getToken()
      const { globalData: { apiPath } } = getApp();
      const { data } = await http.post(`${apiPath}/album/GetVipInfo`,
        { shopId },
        { Authorization: token }
      );
      if (data.code !== 0) {
        throw new Error(data.msg || data.message || '系统繁忙，请稍后重试～*')
      }
      return data.data
    } catch (err) {
      wx.showToast({ title: err.message || '获取失败', icon: 'none' })
      return null
    } finally {
      wx.hideLoading()
    }
  },

  itemClickHandle(e) {
    const { idx } = e.currentTarget.dataset
    const { currLevel, cfg } = this.data

    if (cfg[idx].level < currLevel) {
      return
    }

    this.setData({ selectedIdx: idx })
    this.updateButtonText()
  },

  updateButtonText() {
    const { currLevel, selectedIdx, cfg } = this.data
    if (!cfg || cfg.length === 0) return
    const selectedItem = cfg[selectedIdx]
    let displayText = '立即开通'

    if (selectedItem.level === currLevel) {
      displayText = '立即续费'
    } else if (selectedItem.level > currLevel) {
      displayText = currLevel === 0 ? '立即开通会员' : '升级会员'
    }

    this.setData({ displayText })
  },

  // 1. 唤起自定义半屏收银台
  confirmSub() {
    const { cfg, selectedIdx, currLevel } = this.data
    const targetVip = cfg[selectedIdx]

    // 确定是否满足升级条件
    const isUpgrade = currLevel > 0 && targetVip.level > currLevel

    this.setData({
      targetVip,
      isUpgrade,
      showPayModal: true
    })
  },

  // 2. 关闭半屏弹窗
  closePayModal() {
    this.setData({ showPayModal: false })
  },

  // 3. 真正被收银台触发的支付逻辑
  async executePay() {
    const { targetVip, shopInfo, currLevel } = this.data
    this.closePayModal() // 唤起微信中间件前先收起自定义弹窗
    
    try {
      wx.showLoading({ mask: true, title: '准备支付...' })
      const token = await util.getToken()
      const { globalData: { apiPath } } = getApp()
      const code = await util.getLoginCode()

      let payType = 0
      if (currLevel > 0) payType = 1
      if (currLevel > 0 && targetVip.level > currLevel) payType = 2
      
      const { data } = await http.post(`${apiPath}/user/CreateVirtualOrder`, {
        code, shopId: shopInfo.shopId, level: targetVip.level, payType
      }, { Authorization: token })
      
      if (data.code !== 0) {
        throw new Error(data.msg || '系统繁忙，联系管理员～')
      }

      const pass = await new Promise((resolve, reject) => {
        const { signData, paySig, signature } = data.data
        wx.requestVirtualPayment({
          signData, paySig, signature, mode: 'short_series_goods',
          success: async () => {
            resolve(true)
          },
          fail: async (err) => {
            // 提取核心错误信息，防止文本太长
            const errCode = err.errCode || err.code || '无'
            const errMsg = err.errMsg || '未知错误'
            if(errMsg.indexOf('cancel') === -1) {
              wx.showModal({
                title: '提示',
                content: `由于当前微信环境或版本限制，暂时无法直接唤起支付。您可以更新微信版本或联系客服开通～`,
                confirmText: '联系客服',
                cancelText: '关闭',
                success: (res) => {
                  if (res.confirm) {
                    this.toContactSys()
                  }
                }
              })
            }
            // if(errMsg.indexOf('cancel') === -1) {
            //   wx.showModal({
            //     title: '⚠️ 微信支付失败',
            //     content: `错误代码: ${errCode}\n\n错误信息: ${errMsg}\n\n单号: ${data.data.outTradeNo || '未生成'}`,
            //     confirmText: '复制错误',
            //     cancelText: '关闭',
            //     success: (res) => {
            //       if (res.confirm) {
            //         wx.setClipboardData({
            //           data: `code: ${errCode}, msg: ${errMsg}, orderNo: ${data.data.outTradeNo}`,
            //           success: () => wx.showToast({ title: '复制成功', icon: 'success' })
            //         })
            //       }
            //     }
            //   })
            // }
            resolve(false)
          }
        })
      })
      if (!pass) return
      // 下面处理支付成功的逻辑
      const queryRet = await http.post(`${apiPath}/user/QueryVirtualOrder`, {
        shopId: shopInfo.shopId, outTradeNo: data.data.outTradeNo
      }, {Authorization: token})
      // return
      wx.showToast({title: '开通成功～', icon: 'success'})
      await util.sleep(500)
      wx.reLaunch({url: `../index/index?src_path=${encodeURIComponent('/')}`})
    } catch(e) {
      console.error(e, 'err')
      wx.showToast({ title: e.message, icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 防止滚动穿透虚化底层
  preventTouch() {},

  toContactSys() {
    const payload = {
      qrcodeUrl: '//upload-1259129443.cos.ap-guangzhou.myqcloud.com/5_3_29b2bda2e6e0ad0c116103b827a2983d.jpg?imageMogr2/quality/40',
      message: `长按识别二维码～`
    }
    let payloadStr = encodeURIComponent(JSON.stringify(payload))
    wx.navigateTo({ url: `../viewQrCode/viewQrCode?payload=${payloadStr}` })
  }
})