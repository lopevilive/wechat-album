const util = require('../../utils/util')
const http = require('../../utils/http')

const replaceStr = (str) => {
  if (!str) str = ''
  str = str.replaceAll(/[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\A9|\AE]\u3030|\uA9|\uAE|\u3030/ig, '')
  return str
}

Page({
  data: {
    image: "",
    qrcodeUrl: '',
    scene: '',
    inventoryId: '',
    noExport: '', // 禁止导出
    info: {
      // src_path: '/product-manage/12', // 路径
      // url: '//upload-1259129443.cos.ap-guangzhou.myqcloud.com/12_3_5a39773610c690a655d26851f6d49086.jpg?imageMogr2/quality/40', // 图片地址
      // title: '有礼喜坊', // 标题
      // desc1: ['乔迁之喜礼盒'],
      // desc2: ['2024/12/18 23:59']

    },
    paintPallette: {}
  },
  createPoster() {
    let paintObj = { width: '700rpx', height: '1000rpx', background: '#f3b24b', views: [] }
    const { qrcodeUrl } = this.data
    const {url, title, desc1, desc2} = this.data.info
    paintObj.views.push({ type: 'rect', css: { top: '260rpx', left: '50rpx', color: 'rgba(255, 255, 255, 1)', width: '600rpx', height: '600rpx', borderRadius: '50%'}})
    paintObj.views.push({id: 'image-qrcode', type: 'image', url: qrcodeUrl, css: {top: '280rpx', left: '70rpx', width: '560rpx', height: '560rpx'}})
    paintObj.views.push({id: 'image-url', type: 'image',url: `https:${url}`, css: {top: '435rpx', left: '225rpx', width: '250rpx', height: '250rpx', borderRadius: '50%'}})

    paintObj.views.push({type: 'text', text: '微信扫描或长按识别进入小程序', css: {top: '900rpx', left: '0rpx', fontSize: '24rpx', width: '100%', maxLines: '1', color: '#fff', textAlign: 'center'}})
    paintObj.views.push({type: 'text', text: replaceStr(title), css: {top: '50rpx', left: '40rpx', fontSize: '40rpx', width: '620rpx', maxLines: '1', color: '#fff', fontWeight: 'bold'}})
    if (desc1?.length) {
      paintObj.views.push({type: 'text', text: replaceStr(desc1[0]), css: {top: '130rpx', left: '40rpx', fontSize: '32rpx', width: '620rpx', maxLines: '1', color: '#fff'}})
    }
    if (desc2?.length) {
      paintObj.views.push({type: 'text', text: replaceStr(desc2[0]), css: {top: '200rpx', left: '40rpx', fontSize: '24rpx', width: '620rpx', maxLines: '1', color: '#fff'}})
    }
    // paintObj.views.push({id: 'image-url', type: 'image',url: `https:${url}`, css: {top: '0rpx', left: '0rpx', width: '100%', height: '700rpx'}})
    // paintObj.views.push({id: 'image-qrcode', type: 'image', url: qrcodeUrl, css: {top: '750rpx', left: '470rpx', width: '200rpx', height: '200rpx'}})
    // // title
    // paintObj.views.push({type: 'text', text: title, css: {top: '750rpx', left: '40rpx', fontSize: '40rpx', width: '420rpx', maxLines: '1'}})
    // if (desc1.length) {
    //   paintObj.views.push({type: 'text', text: desc1[0], css: {top: '820rpx', left: '40rpx', fontSize: '32rpx', width: '420rpx', maxLines: '1', color: '#aaaaaa'}})
    // }
    // if (desc2.length) {
    //   paintObj.views.push({type: 'text', text: desc2[0], css: {top: '900rpx', left: '40rpx', fontSize: '24rpx', width: '420rpx', maxLines: '1', color: '#aaaaaa'}})
    // }
    this.setData({paintPallette: paintObj})

  },
  async getQrCode() {
    try {
      wx.showLoading({ title: '正在生成海报~'})
      const {globalData: {apiPath}} = getApp();
      const {scene} = this.data
      const {data} = await http.post(`${apiPath}/album/Getwxacodeunlimit`, {scene: decodeURIComponent(scene)})
      if (data.code === 0) {
        let picUrl = "data:image/png;base64,"+data.data
        this.setData({qrcodeUrl: picUrl})
        this.createPoster()
      } else {
        console.error(data)
        wx.hideLoading()
      }
    } catch(e) {
      console.error(e)
      wx.hideLoading()
    }
  },
  async onLoad(options) {
    const {src_path, url, title, desc1, desc2, scene, inventoryId, noExport} = options
    console.log(options)
    const data = {
      src_path: decodeURIComponent(src_path),
      url: decodeURIComponent(url),
      title: decodeURIComponent(title),
      desc1: JSON.parse(decodeURIComponent(desc1) || '[]'),
      desc2: JSON.parse(decodeURIComponent(desc2) || '[]'),
    }
    this.setData({info: data})
    this.setData({scene})
    this.setData({inventoryId: decodeURIComponent(inventoryId || '') || ''})
    this.setData({noExport: decodeURIComponent(noExport || '') || ''})
    await this.getQrCode()
  },
  onImgOK(e) {
    wx.hideLoading()
    this.setData({
      image: e.detail.path,
    });
  },
  saveImage() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.image,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: () => {
        wx.showToast({
          title: '保存失败，请允许添加到相册',
          duration: 2000
        })
      }
    });
  },
  async downloadExcel () {
    const {globalData: {apiPath}} = getApp();
    wx.showLoading({mask: true})
    wx.downloadFile({
      url: `${apiPath}/album/ExportInventory?id=${this.data.inventoryId}`,
      success: (res) => {
        console.log(res)
        wx.hideLoading()
        if (res.statusCode === 200) {
          wx.shareFileMessage({
            filePath: res.tempFilePath,
            fileName: res.tempFilePath.replace('wxfile://tmp', '清单'),
            fail: (e) => {
              console.error(e, 'shareFileMessage')
            }
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error(err)
      }
    })
  },
  onShareAppMessage(){
    const {src_path, url} = this.data.info
    const instance = new util.UrlTools(src_path)
    const {title} = instance.query

    let ret = {
      title: title || '  ',
      path: `/pages/index/index?src_path=${encodeURIComponent(src_path)}`,
    }
    if (url) {
      ret.imageUrl = `http:${url}`
    }
    return ret
  }
})
