// app.js
// const url = 'huace.xiaoguoyun.top'
const url = 'huace.xiaoguoxx.cn'
App({
  onLaunch() {

  },
  globalData: {
    userInfo: null,
    webVeiwName: '',
    apiPath: `https://${url}/api`,
    web_src: `https://${url}/dist`
  }
})
