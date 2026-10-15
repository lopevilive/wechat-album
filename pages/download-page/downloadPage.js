Page({
  data: {
    isProcessing: true,
    progress: 0,
    tempFilePath: '',
    fileName: '',
    fileUrl: '',
    fileType: 1, // 1: Excel 文档（默认）, 2: 视频
    loadingText: '正在准备清单',
    successText: '文件已生成',
    btnText: '保存',
    errorMsg: ''
  },

  onLoad(options) {
    try {
      const { payload } = options;
      if (!payload) throw new Error('参数缺失');
      
      const info = JSON.parse(decodeURIComponent(payload));
      const fileType = Number(info.type) || 1; // 不传默认 1（Excel 文档）
      const isVideo = fileType === 2;

      this.setData({
        fileUrl: info.url,
        fileType,
        fileName: info.fileName || (isVideo ? `视频_${Date.now()}.mp4` : '报价清单.xlsx'),
        loadingText: isVideo ? '正在准备视频' : '正在准备清单',
        successText: isVideo ? '视频已生成' : '文件已生成',
        btnText: '保存'
      });

      console.log(info.url, 'info.url')

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

  // 用户点击触发分享 / 保存
  handleTapShare() {
    if (!this.data.tempFilePath) return;

    // type=2：视频，保存到系统相册
    if (this.data.fileType === 2) {
      this.saveVideo();
      return;
    }

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

  // 视频处理：PC 端保存到相册，非 PC 端走文件转发（与 handleTapShare 逻辑一致）
  saveVideo() {
    const sysInfo = wx.getSystemInfoSync();
    const isPC = sysInfo.platform === 'windows' || sysInfo.platform === 'mac';

    if (isPC) {
      // PC 端：保存到系统相册
      const doSave = () => {
        wx.saveVideoToPhotosAlbum({
          filePath: this.data.tempFilePath,
          success: () => {
            wx.showToast({ title: '已保存到相册', icon: 'success' });
            setTimeout(() => { this.goBack(); }, 1200);
          },
          fail: (err) => {
            console.error('保存视频失败', err);
            const msg = (err && err.errMsg) || '';
            if (msg.includes('auth deny') || msg.includes('auth denied') || msg.includes('authorize:fail')) {
              // 用户拒绝过相册权限，引导去设置页开启
              wx.showModal({
                title: '提示',
                content: '需要允许访问相册权限才能保存视频',
                confirmText: '去授权',
                success: (res) => { if (res.confirm) wx.openSetting(); }
              });
            } else if (msg.includes('cancel')) {
              // 用户主动取消，无需提示
            } else {
              wx.showModal({ title: '提示', content: '保存失败，请重试', showCancel: false });
            }
          }
        });
      };

      // 主动校验相册权限，避免首次保存静默失败
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.writePhotosAlbum'] === false) {
            wx.showModal({
              title: '提示',
              content: '需要允许访问相册权限才能保存视频',
              confirmText: '去授权',
              success: (r) => { if (r.confirm) wx.openSetting(); }
            });
          } else {
            doSave();
          }
        },
        fail: doSave
      });
    } else {
      // 非 PC 端：文件转发（发送给微信好友）
      wx.shareFileMessage({
        filePath: this.data.tempFilePath,
        fileName: this.data.fileName,
        success: () => {
          wx.showToast({ title: '已发起分享', icon: 'success' });
          setTimeout(() => { this.goBack(); }, 1200);
        },
        fail: (err) => {
          // 分享失败或取消，留在当前页让用户可以再次点击
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