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
    paintPallette: {},
    forwardPermi: 0,
  },
  async getQrCode() {
    try {
      wx.showLoading({ title: '正在生成海报~'})
      const {globalData: {apiPath}} = getApp();
      const {scene} = this.data
      const {url, title, desc1, desc2} = this.data.info
      // const {data} = await http.post(`${apiPath}/album/Getwxacodeunlimit`, {scene: decodeURIComponent(scene)})
      const {data} = await http.post(`${apiPath}/album/GetSharePoster`, {
        scene: decodeURIComponent(scene),
        url, title, desc1, desc2
      })
      if (data.code === 0) {
        console.log(data)
        let picUrl = "data:image/png;base64,"+data.data
        this.setData({image: picUrl})
      } else {
        console.error(data)
      }
      wx.hideLoading()
    } catch(e) {
      console.error(e)
      wx.hideLoading()
    }
  },
  async onLoad(options) {
    const {src_path, url, title, desc1, desc2, scene, inventoryId, noExport, forwardPermi} = options
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
    this.setData({forwardPermi: forwardPermi === '1' ? 1: 0});
    await this.getQrCode()
  },
  onImgOK(e) {
    wx.hideLoading()
    this.setData({
      image: e.detail.path,
    });
  },
  async saveImage() {
    const base64Data = this.data.image;

    if (!base64Data || !base64Data.startsWith('data:image')) {
      return wx.showToast({ title: '图片生成中，请稍后', icon: 'none' });
    }

    try {
      wx.showLoading({ title: '正在保存...', mask: true });

      // 1. 提取 Base64 纯数据和后缀名
      const reg = /data:image\/(\w+);base64,(.*)/;
      const match = base64Data.match(reg);
      if (!match) throw new Error('Base64格式错误');

      const fileExt = match[1] || 'png';
      const bodyData = match[2];

      // 2. 利用文件管理器写入本地临时文件
      const fsm = wx.getFileSystemManager();
      // 定义一个唯一的临时路径
      const fileName = `poster_${Date.now()}.${fileExt}`;
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      // 同步/异步写入均可，这里用异步更符合小程序规范
      await new Promise((resolve, reject) => {
        fsm.writeFile({
          filePath,
          data: bodyData,
          encoding: 'base64',
          success: resolve,
          fail: reject
        });
      });

      // 3. 保存到系统相册
      wx.saveImageToPhotosAlbum({
        filePath: filePath,
        success: () => {
          wx.showToast({ title: '已保存到相册', icon: 'success' });
        },
        fail: (err) => {
          console.error('saveImageToPhotosAlbum fail:', err);
          // 处理用户拒绝授权的情况
          if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize:fail')) {
            wx.showModal({
              title: '授权提示',
              content: '需要您授权保存图片到相册的权限才能保存',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) wx.openSetting();
              }
            });
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        },
        complete: () => {
          wx.hideLoading();
          // 4. 无论成功失败，清理掉这个临时文件，释放小程序存储空间
          fsm.unlink({ 
            filePath,
            fail: (e) => console.warn('清理临时文件失败', e)
          });
        }
      })

    } catch (error) {
      wx.hideLoading();
      console.error('saveImage Error:', error);
      wx.showToast({ title: '图片处理异常', icon: 'none' });
    }
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
    if (this.data.forwardPermi === 1) {
      wx.updateShareMenu({
        isPrivateMessage: true,
        success: () => {},
        fail: () => {}
      })
    }
    return ret
  }
})
