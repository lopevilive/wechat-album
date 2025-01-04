const util = require('../../utils/util')
const http = require('../../utils/http')

Page({
  data: {
    image: "",
    qrcodeUrl: '',
    scene: '',
    inventoryId: '',
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
    let paintObj = { width: '700rpx', height: '1000rpx', background: '#ffffff', views: [] }
    const { qrcodeUrl } = this.data
    const {url, title, desc1, desc2} = this.data.info
    paintObj.views.push({id: 'image-url', type: 'image',url: `https:${url}`, css: {top: '0rpx', left: '0rpx', width: '100%', height: '700rpx'}})
    paintObj.views.push({id: 'image-qrcode', type: 'image', url: qrcodeUrl, css: {top: '750rpx', left: '470rpx', width: '200rpx', height: '200rpx'}})
    // title
    paintObj.views.push({type: 'text', text: title, css: {top: '750rpx', left: '40rpx', fontSize: '40rpx', width: '420rpx', maxLines: '1'}})
    if (desc1.length) {
      paintObj.views.push({type: 'text', text: desc1[0], css: {top: '820rpx', left: '40rpx', fontSize: '32rpx', width: '420rpx', maxLines: '1', color: '#aaaaaa'}})
    }
    if (desc2.length) {
      paintObj.views.push({type: 'text', text: desc2[0], css: {top: '900rpx', left: '40rpx', fontSize: '24rpx', width: '420rpx', maxLines: '1', color: '#aaaaaa'}})
    }
    this.setData({paintPallette: paintObj})

  },
  async getQrCode() {
    try {
      wx.showLoading({mask: true, title: '正在生成海报~'})
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
    const {src_path, url, title, desc1, desc2, scene, inventoryId} = options
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
    // const res = await wx.downloadFile({
    //   url: `${apiPath}/album/ExportInventory?id=${this.data.inventoryId}`
    // })
    // console.log(res)
    // await wx.shareFileMessage({filePath: res.tempFilePath})
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
