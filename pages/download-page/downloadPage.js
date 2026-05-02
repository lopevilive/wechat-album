Page({
  data: {
    isProcessing: true,
    progress: 0,
    tempFilePath: '',
    fileName: '',
    fileUrl: '',
    errorMsg: ''
  },

  onLoad(options) {
    try {
      const { payload } = options;
      if (!payload) throw new Error('参数缺失');
      
      const info = JSON.parse(decodeURIComponent(payload));
      this.setData({ 
        fileUrl: info.url, 
        fileName: info.fileName || '报价清单.xlsx' 
      });

      this.executeDownload();
    } catch (e) {
      this.setData({ isProcessing: false, errorMsg: '参数解析异常' });
    }
  },

  executeDownload() {
    const downloadTask = wx.downloadFile({
      url: this.data.fileUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            isProcessing: false,
            tempFilePath: res.tempFilePath
          });
        } else {
          this.setData({ isProcessing: false, errorMsg: `下载失败(Code:${res.statusCode})` });
        }
      },
      fail: () => {
        this.setData({ isProcessing: false, errorMsg: '网络连接失败，请检查网络' });
      }
    });

    downloadTask.onProgressUpdate((res) => {
      this.setData({ progress: res.progress });
    });
  },

  // 用户点击触发分享
  handleTapShare() {
    if (!this.data.tempFilePath) return;
    const sysInfo = wx.getSystemInfoSync();
    const isPC = sysInfo.platform === 'windows' || sysInfo.platform === 'mac';

    if (isPC) {
      wx.openDocument({
        filePath: this.data.tempFilePath,
        showMenu: true, // 关键：开启后用户可以点击右上角“另存为”
        fileType: 'pdf', // 建议明确指定类型，提高打开成功率
        success: () => {
          wx.showToast({ title: '已开启预览', icon: 'none' });
        },
        fail: (err) => {
          console.error('预览失败', err);
          wx.showModal({ title: '提示', content: '预览失败，请检查文件格式', showCancel: false });
        }
      });
    } else {
      wx.shareFileMessage({
        filePath: this.data.tempFilePath,
        fileName: this.data.fileName,
        success: () => {
          // 分享成功，提示并返回
          wx.showToast({ title: '已发起分享', icon: 'success' });
          setTimeout(() => { this.goBack(); }, 1200);
        },
        fail: (err) => {
          // 如果是分享失败或取消，留在当前页让用户可以再次点击
          console.log('用户取消或转发失败', err);
        }
      });
    }


  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  }
});