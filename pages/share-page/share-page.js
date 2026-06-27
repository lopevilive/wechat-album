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
    qrcodeUrl: '', // 普通二维码地址
    h5Url: '',     // 配套的 H5 链接地址
    scene: '',
    info: {},
    paintPallette: {},
    forwardPermi: 0,
  },

  async onLoad(options) {
    const { src_path, url, title, desc1, desc2, scene, forwardPermi, h5Url } = options
    console.log('接收到的参数：', options)
    
    const data = {
      src_path: decodeURIComponent(src_path || ''),
      url: decodeURIComponent(url || ''),
      title: decodeURIComponent(title || ''),
      desc1: JSON.parse(decodeURIComponent(desc1) || '[]'),
      desc2: JSON.parse(decodeURIComponent(desc2) || '[]'),
    }
    
    this.setData({ info: data })
    this.setData({ scene })
    this.setData({ forwardPermi: forwardPermi === '1' ? 1 : 0 });
    if (h5Url) {
      this.setData({h5Url: decodeURIComponent(h5Url)})
      this.getH5QrCode()
    }
    this.getPoster()
  },
  
  async getPoster() {
    try {
      wx.showLoading({ title: '正在生成海报~' })
      const { globalData: { apiPath } } = getApp();
      const { scene } = this.data
      const { url, title, desc1, desc2 } = this.data.info
      
      const { data } = await http.post(`${apiPath}/album/GetSharePoster`, {
        scene: decodeURIComponent(scene),
        url, title, desc1, desc2
      })
      
      if (data.code === 0) {
        let picUrl = "data:image/png;base64," + data.data
        this.setData({ image: picUrl })
      } else {
        console.error(data)
      }
      wx.hideLoading()
    } catch(e) {
      console.error(e)
      wx.hideLoading()
    }
  },

  async getH5QrCode() {
    const {h5Url} = this.data
    if (!h5Url) return
    const { globalData: { apiPath } } = getApp();
    const {data} = await http.post(`${apiPath}/album/GetQrCode`, {
      str: h5Url
    })
    if (data.code === 0) {
      const url  = data.data
      this.setData({qrcodeUrl: url})
    }
  },

  // 复制 H5 链接到剪贴板
  copyH5Link() {
    const { h5Url } = this.data;
    if (!h5Url) {
      return wx.showToast({ title: '暂无有效链接', icon: 'none' });
    }
    
    wx.setClipboardData({
      data: h5Url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      }
    });
  },

  // 1. 公共的 Base64 图片保存核心方法
  async saveBase64Image(base64Data, loadingText = '正在保存...') {
    if (!base64Data || !base64Data.startsWith('data:image')) {
      return wx.showToast({ title: '图片生成中，请稍后', icon: 'none' });
    }

    try {
      wx.showLoading({ title: loadingText, mask: true });
      const reg = /data:image\/(\w+);base64,(.*)/;
      const match = base64Data.match(reg);
      if (!match) throw new Error('Base64格式错误');

      const fileExt = match[1] || 'png';
      const bodyData = match[2];
      const fsm = wx.getFileSystemManager();
      const fileName = `code_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      // 写入小程序临时本地文件
      await new Promise((resolve, reject) => {
        fsm.writeFile({ 
          filePath, 
          data: bodyData, 
          encoding: 'base64', 
          success: resolve, 
          fail: reject 
        });
      });

      // 拉起权限并存储入手机相册
      this.executeSave(filePath);
    } catch (error) {
      wx.hideLoading();
      console.error(error);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 2. 存小程序海报码 -> 触发公共方法
  async saveImage() {
    await this.saveBase64Image(this.data.image, '正在保存海报...');
  },

  // 3. 存普通 H5 二维码 -> 同样触发公共方法
  async saveQrCode() {
    await this.saveBase64Image(this.data.qrcodeUrl, '正在保存二维码...');
  },

  // 公共相册写入授权拦截器
  executeSave(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.showToast({ title: '已成功保存相册', icon: 'success' });
      },
      fail: (err) => {
        console.error(err);
        if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize:fail')) {
          wx.showModal({
            title: '提示',
            content: '需要允许访问相册权限才能保存图片',
            confirmText: '去授权',
            success: (res) => { if (res.confirm) wx.openSetting(); }
          });
        } else {
          wx.showToast({ title: '保存取消/失败', icon: 'none' });
        }
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  onShareAppMessage(){
    const { src_path, url } = this.data.info
    const instance = new util.UrlTools(src_path)
    const { title } = instance.query

    let ret = {
      title: title || '  ',
      path: `/pages/index/index?src_path=${encodeURIComponent(src_path)}`,
    }
    if (url) ret.imageUrl = `http:${url}`
    if (this.data.forwardPermi === 1) {
      wx.updateShareMenu({ isPrivateMessage: true, success: () => {}, fail: () => {} })
    }
    return ret
  }
})