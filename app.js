// app.js
// const url = 'huace.xiaoguoyun.top'
// const url = 'huace.xiaoguoxx.cn'
const url = 'album.xiaoguoxx.cn'
App({
  onLaunch() {

  },
  globalData: {
    userInfo: null,
    webVeiwName: '',
    forwardInfo: {},
    apiPath: `https://${url}/api`,
    web_src: `https://${url}/dist`
  }
})
